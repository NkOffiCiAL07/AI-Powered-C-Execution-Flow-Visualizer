from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import subprocess
import tempfile
import threading
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

SESSION_TTL_MINUTES = 30


def _load_local_env() -> None:
    env_file = Path(__file__).resolve().parents[3] / ".env"
    if not env_file.exists():
        return

    for line in env_file.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


_load_local_env()

# ── Simple in-memory rate limiter (sliding window) ───────────────────────────
_rl_store: dict[str, list[float]] = {}
_rl_lock = threading.Lock()
_RL_LIMIT = 10      # max requests
_RL_WINDOW = 60.0   # per N seconds


def _is_rate_limited(ip: str) -> bool:
    now = time.monotonic()
    with _rl_lock:
        times = _rl_store.get(ip, [])
        times = [t for t in times if now - t < _RL_WINDOW]
        if len(times) >= _RL_LIMIT:
            _rl_store[ip] = times
            return True
        times.append(now)
        _rl_store[ip] = times
        return False


from traceon.server.api import router as sessions_router, session_manager
from traceon.server.ai_service import explain_code_ai, generate_code_ai
from traceon.server.auth import optional_user, require_member, router as auth_router
from traceon.server.mongo_store import mongo_app_store
from traceon.server.models import (
    AnalyzeCodeRequest,
    AnalyzeCodeResponse,
    AnalyzeStepRequest,
    AnalyzeStepResponse,
    CommandType,
    CreateSessionRequest,
    DebugBackend,
    ExecutionSnapshot,
    ExplainCodeRequest,
    ExplainCodeResponse,
    FileUpsertRequest,
    GenerateCodeRequest,
    GenerateCodeResponse,
    ProjectCreateRequest,
    RunCodeRequest,
    RunCodeResponse,
    SessionSettings,
    SessionStatus,
    SourceFile,
)


@dataclass
class _PythonSession:
    session_id: str
    snapshots: list
    cursor: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.now(tz=timezone.utc))


_python_sessions: dict[str, _PythonSession] = {}

_TRACER_SCRIPT = Path(__file__).parent / "python_tracer.py"
_JAVA_TRACER_SCRIPT = Path(__file__).parent / "java_tracer.py"


def _run_python_tracer(code: str, stdin_data: str = "") -> list:
    with tempfile.TemporaryDirectory() as tmpdir:
        code_path = Path(tmpdir) / "user_code.py"
        stdin_path = Path(tmpdir) / "stdin.txt"
        code_path.write_text(code)
        stdin_path.write_text(stdin_data or "")
        try:
            result = subprocess.run(
                ["python3", str(_TRACER_SCRIPT), str(code_path), str(stdin_path)],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode != 0 and not result.stdout.strip():
                raise ValueError(result.stderr.strip() or "Tracer failed")
            return json.loads(result.stdout.strip() or "[]")
        except subprocess.TimeoutExpired:
            raise ValueError("Python execution timed out (15s limit)")
        except json.JSONDecodeError as e:
            raise ValueError(f"Tracer output parse error: {e}")


def _snapshot_from_dict(d: dict) -> ExecutionSnapshot:
    return ExecutionSnapshot(
        step=d["step"],
        location=d["location"],
        variables=d.get("variables", {}),
        changed_variables=d.get("changed_variables", []),
        call_stack=d.get("call_stack", []),
    )


def _run_java_tracer(code: str, stdin_data: str = "") -> list:
    with tempfile.TemporaryDirectory() as tmpdir:
        code_path = Path(tmpdir) / "user_code.java"
        stdin_path = Path(tmpdir) / "stdin.txt"
        code_path.write_text(code)
        stdin_path.write_text(stdin_data or "")
        try:
            result = subprocess.run(
                ["python3", str(_JAVA_TRACER_SCRIPT), str(code_path), str(stdin_path)],
                capture_output=True, text=True, timeout=45,
            )
            if result.returncode != 0 and not result.stdout.strip():
                raise ValueError(result.stderr.strip() or "Java tracer failed")
            return json.loads(result.stdout.strip() or "[]")
        except subprocess.TimeoutExpired:
            raise ValueError("Java execution timed out (45s limit)")
        except json.JSONDecodeError as e:
            raise ValueError(f"Tracer output parse error: {e}")


def _detect_java_class_name(code: str) -> str:
    m = re.search(r'\bpublic\s+class\s+(\w+)', code)
    if m:
        return m.group(1)
    m = re.search(r'\bclass\s+(\w+)', code)
    if m:
        return m.group(1)
    return "Main"


def _prepare_c_code(code: str) -> str:
    normalized = code.strip()
    has_main = "main(" in normalized or "main ()" in normalized

    if not has_main:
        return f"""#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

int main() {{
{chr(10).join('    ' + line for line in normalized.split(chr(10)))}
    return 0;
}}
"""

    if "#include" not in normalized:
        return f"""#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

{normalized}
"""

    return normalized


def _prepare_cpp_code(code: str) -> str:
    normalized = code.strip()
    has_main = "main(" in normalized or "main ()" in normalized

    if not has_main:
        return f"""#include <iostream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

int main() {{
{chr(10).join('    ' + line for line in normalized.split(chr(10)))}
    return 0;
}}
"""

    if "#include" not in normalized:
        return f"""#include <iostream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

{normalized}
"""

    return normalized


def _to_execution_snapshot(state) -> ExecutionSnapshot | None:
    if state is None:
        return None
    return ExecutionSnapshot(
        step=state.step,
        location={
            "file": state.location.file,
            "line": state.location.line,
            "function": state.location.function,
        },
        variables=state.variables,
        changed_variables=list(state.changed_variables),
        call_stack=state.call_stack,
    )


async def _session_cleanup_loop() -> None:
    """Remove sessions idle for longer than SESSION_TTL_MINUTES and delete their temp dirs."""
    while True:
        await asyncio.sleep(60)
        try:
            cutoff = datetime.now(tz=timezone.utc) - timedelta(minutes=SESSION_TTL_MINUTES)
            # Expire Python sessions
            py_stale = [sid for sid, s in list(_python_sessions.items()) if s.created_at < cutoff]
            for sid in py_stale:
                _python_sessions.pop(sid, None)
                logger.info("Expired Python session %s", sid)
            # Expire C/C++ sessions
            stale = [
                sid
                for sid, record in list(session_manager._sessions.items())
                if record.created_at < cutoff
            ]
            for sid in stale:
                record = session_manager._sessions.pop(sid, None)
                if record is None:
                    continue
                if record.controller is not None:
                    try:
                        record.controller.close()
                    except Exception:
                        pass
                if record.work_dir and record.work_dir.exists():
                    import shutil
                    shutil.rmtree(record.work_dir, ignore_errors=True)
                logger.info("Expired session %s (age > %d min)", sid, SESSION_TTL_MINUTES)
        except Exception:
            logger.exception("Session cleanup task error")


@asynccontextmanager
async def _lifespan(app: FastAPI):
    task = asyncio.create_task(_session_cleanup_loop())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


def create_app() -> FastAPI:
    app = FastAPI(title="Traceon Debug Server", version="0.1.0", lifespan=_lifespan)

    # CORS — read from ALLOWED_ORIGINS env var (comma-separated); fallback to localhost:3000
    _raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    _allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/db", tags=["system"])
    def health_db() -> dict:
        return {"mongo_connected": mongo_app_store.enabled}

    @app.post("/analyze", response_model=AnalyzeCodeResponse, tags=["analysis"])
    def analyze_code(request: AnalyzeCodeRequest, http_request: Request):
        lang = (request.language or "cpp").lower()
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="No code provided")

        # If client supplies a project_id, verify ownership (P4.4)
        if request.project_id and mongo_app_store.enabled:
            caller = optional_user(http_request)
            if caller:
                owner_id = caller.get("user_id") or caller.get("sub", "")
                proj = mongo_app_store.get_project(request.project_id)
                if not proj or proj["owner_id"] != owner_id:
                    raise HTTPException(status_code=403, detail="project_id does not belong to your account")

        # ── Python: trace-based debugger ──
        if lang == "python":
            try:
                snapshots = _run_python_tracer(request.code, request.stdin or "")
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Python trace failed: {e}")

            if not snapshots:
                raise HTTPException(status_code=400, detail="No executable statements found in Python code.")

            session_id = f"py_{uuid.uuid4().hex[:12]}"
            _python_sessions[session_id] = _PythonSession(
                session_id=session_id,
                snapshots=snapshots,
                cursor=0,
            )
            return AnalyzeCodeResponse(
                session_id=session_id,
                status=SessionStatus.RUNNING,
                cursor=0,
                total_recorded_steps=len(snapshots),
                snapshots=[_snapshot_from_dict(snapshots[0])],
                total_steps=len(snapshots),
                execution_mode="incremental",
                message="Python session started. Click Next to step through.",
            )

        # ── Java: jdb-based debugger ──
        if lang == "java":
            try:
                snapshots = _run_java_tracer(request.code, request.stdin or "")
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Java trace failed: {e}")

            if not snapshots:
                raise HTTPException(status_code=400, detail="No executable statements found in Java code.")

            session_id = f"jv_{uuid.uuid4().hex[:12]}"
            _python_sessions[session_id] = _PythonSession(
                session_id=session_id,
                snapshots=snapshots,
                cursor=0,
            )
            return AnalyzeCodeResponse(
                session_id=session_id,
                status=SessionStatus.RUNNING,
                cursor=0,
                total_recorded_steps=len(snapshots),
                snapshots=[_snapshot_from_dict(snapshots[0])],
                total_steps=len(snapshots),
                execution_mode="incremental",
                message="Java session started. Click Next to step through.",
            )

        is_c = lang == "c"

        if is_c:
            wrapped_code = _prepare_c_code(request.code)
            file_name, lang, compiler, flags = "main.c", "c", "clang", ["-std=c11", "-g", "-O0"]
        else:
            wrapped_code = _prepare_cpp_code(request.code)
            file_name, lang, compiler, flags = "main.cpp", "cpp", "clang++", ["-std=c++17", "-g", "-O0"]

        create_request = CreateSessionRequest(
            source=SourceFile(file_name=file_name, language=lang, code=wrapped_code),
            settings=SessionSettings(
                backend=DebugBackend.LLDB,
                compiler=compiler,
                compiler_flags=flags,
                stdin_data=request.stdin or "",
                stop_at_main=True,
                max_steps=150,
                execution_timeout_seconds=15,
            ),
        )

        try:
            summary = session_manager.create_session(create_request)
            compile_result = session_manager.compile_session(summary.session_id)
            if not compile_result.success:
                diagnostics = "\n".join(compile_result.diagnostics) or "Compilation failed"
                raise HTTPException(status_code=400, detail=diagnostics)

            started = session_manager.mark_started(summary.session_id)
            first_snapshot = _to_execution_snapshot(started.state)
            snapshots = [first_snapshot] if first_snapshot is not None else []
            total_steps = len(started.history or [])

            return AnalyzeCodeResponse(
                session_id=started.session_id,
                status=started.status,
                cursor=max(started.cursor, 0) if snapshots else -1,
                total_recorded_steps=total_steps,
                snapshots=snapshots,
                total_steps=total_steps,
                execution_mode="incremental",
                message="Session started. Click Next to fetch each new step.",
            )
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {error}") from error

    @app.post("/analyze/{session_id}/step", response_model=AnalyzeStepResponse, tags=["analysis"])
    def analyze_step(session_id: str, request: AnalyzeStepRequest):
        direction = (request.direction or "next").strip().lower()
        if direction not in {"next", "back"}:
            raise HTTPException(status_code=400, detail="Direction must be either 'next' or 'back'")

        # ── Python session ──
        if session_id in _python_sessions:
            py = _python_sessions[session_id]
            total = len(py.snapshots)
            if direction == "next":
                if py.cursor < total - 1:
                    py.cursor += 1
                    accepted, msg = True, ""
                else:
                    accepted, msg = False, "Already at last step"
            else:
                if py.cursor > 0:
                    py.cursor -= 1
                    accepted, msg = True, ""
                else:
                    accepted, msg = False, "Already at first step"

            at_end = py.cursor >= total - 1
            status = SessionStatus.EXITED if at_end else SessionStatus.RUNNING
            return AnalyzeStepResponse(
                session_id=session_id,
                accepted=accepted,
                status=status,
                cursor=py.cursor,
                total_recorded_steps=total,
                snapshot=_snapshot_from_dict(py.snapshots[py.cursor]),
                message=msg,
            )

        # ── C / C++ session ──
        try:
            if direction == "next":
                step_type = request.step_type or CommandType.STEP_OVER
                accepted, message, record, _created_new_step = session_manager.step_next(session_id, step_type)
            else:
                accepted, message, record = session_manager.step_back(session_id)

            return AnalyzeStepResponse(
                session_id=record.session_id,
                accepted=accepted,
                status=record.status,
                cursor=record.cursor,
                total_recorded_steps=len(record.history or []),
                snapshot=_to_execution_snapshot(record.state),
                message=message or "",
            )
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Step failed: {error}") from error

    @app.post("/run", response_model=RunCodeResponse, tags=["run"])
    def run_code(request: RunCodeRequest):
        import subprocess
        import tempfile
        from pathlib import Path

        lang = (request.language or "cpp").lower()
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="No code provided")

        with tempfile.TemporaryDirectory() as tmpdir:
            # ── Python: no compilation ──
            if lang == "python":
                src_path = Path(tmpdir) / "main.py"
                src_path.write_text(request.code)
                try:
                    run_proc = subprocess.run(
                        ["python3", str(src_path)],
                        input=request.stdin or "",
                        capture_output=True, text=True,
                        timeout=10,
                    )
                    return RunCodeResponse(
                        success=run_proc.returncode == 0,
                        stdout=run_proc.stdout,
                        stderr=run_proc.stderr,
                        exit_code=run_proc.returncode,
                    )
                except subprocess.TimeoutExpired:
                    return RunCodeResponse(
                        success=False,
                        compile_error="",
                        stdout="",
                        stderr="Program timed out (10s limit)",
                        exit_code=-1,
                    )

            # ── Java: compile with javac, run with java ──
            if lang == "java":
                class_name = _detect_java_class_name(request.code)
                src_path = Path(tmpdir) / f"{class_name}.java"
                src_path.write_text(request.code)
                try:
                    compile_proc = subprocess.run(
                        ["javac", str(src_path)],
                        capture_output=True, text=True, cwd=tmpdir, timeout=15,
                    )
                except FileNotFoundError:
                    return RunCodeResponse(
                        success=False,
                        compile_error="javac not found. Please install JDK 11 or later.",
                        stdout="", stderr="", exit_code=1,
                    )
                except subprocess.TimeoutExpired:
                    return RunCodeResponse(
                        success=False,
                        compile_error="Compilation timed out (15s limit)",
                        stdout="", stderr="", exit_code=1,
                    )
                if compile_proc.returncode != 0:
                    return RunCodeResponse(
                        success=False,
                        compile_error=compile_proc.stderr.strip(),
                        stdout="", stderr="", exit_code=compile_proc.returncode,
                    )
                try:
                    run_proc = subprocess.run(
                        ["java", "-classpath", tmpdir, class_name],
                        input=request.stdin or "",
                        capture_output=True, text=True, timeout=10,
                    )
                    return RunCodeResponse(
                        success=run_proc.returncode == 0,
                        stdout=run_proc.stdout,
                        stderr=run_proc.stderr,
                        exit_code=run_proc.returncode,
                    )
                except FileNotFoundError:
                    return RunCodeResponse(
                        success=False,
                        compile_error="java not found. Please install JDK 11 or later.",
                        stdout="", stderr="", exit_code=1,
                    )
                except subprocess.TimeoutExpired:
                    return RunCodeResponse(
                        success=False,
                        compile_error="",
                        stdout="",
                        stderr="Program timed out (10s limit)",
                        exit_code=-1,
                    )

            # ── C / C++: compile then run ──
            if lang == "c":
                wrapped_code = _prepare_c_code(request.code)
                src_name, compiler, compile_flags = "main.c", "clang", ["-std=c11", "-O0"]
            else:
                wrapped_code = _prepare_cpp_code(request.code)
                src_name, compiler, compile_flags = "main.cpp", "clang++", ["-std=c++17", "-O0"]

            src_path = Path(tmpdir) / src_name
            exe_path = Path(tmpdir) / "program"
            src_path.write_text(wrapped_code)

            compile_proc = subprocess.run(
                [compiler, *compile_flags, "-o", str(exe_path), str(src_path)],
                capture_output=True, text=True, timeout=15,
            )
            if compile_proc.returncode != 0:
                return RunCodeResponse(
                    success=False,
                    compile_error=compile_proc.stderr.strip(),
                    stdout="",
                    stderr="",
                    exit_code=compile_proc.returncode,
                )

            try:
                run_proc = subprocess.run(
                    [str(exe_path)],
                    input=request.stdin or "",
                    capture_output=True, text=True,
                    timeout=10,
                )
                return RunCodeResponse(
                    success=True,
                    stdout=run_proc.stdout,
                    stderr=run_proc.stderr,
                    exit_code=run_proc.returncode,
                )
            except subprocess.TimeoutExpired:
                return RunCodeResponse(
                    success=False,
                    compile_error="",
                    stdout="",
                    stderr="Program timed out (10s limit)",
                    exit_code=-1,
                )

    @app.post("/generate", response_model=GenerateCodeResponse, tags=["analysis"])
    def generate_code(req: GenerateCodeRequest, http_request: Request):
        client_ip = http_request.client.host if http_request.client else "unknown"
        if _is_rate_limited(client_ip):
            raise HTTPException(status_code=429, detail="Rate limit exceeded (10 req/min). Please wait before trying again.")
        if not req.prompt or not req.prompt.strip():
            raise HTTPException(status_code=400, detail="No prompt provided")
        try:
            return generate_code_ai(req.prompt.strip(), req.language or "cpp")
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Code generation failed: {error}") from error

    @app.post("/explain", response_model=ExplainCodeResponse, tags=["analysis"])
    def explain_code(req: ExplainCodeRequest, http_request: Request):
        client_ip = http_request.client.host if http_request.client else "unknown"
        if _is_rate_limited(client_ip):
            raise HTTPException(status_code=429, detail="Rate limit exceeded (10 req/min). Please wait before trying again.")
        if not req.code or not req.code.strip():
            raise HTTPException(status_code=400, detail="No code provided")
        try:
            return explain_code_ai(req.code, req.language or "cpp")
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"AI explanation failed: {error}") from error

    # ── Projects (P4.5) ──────────────────────────────────────────────────────

    @app.get("/projects", tags=["projects"])
    def list_projects(payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        return {"projects": mongo_app_store.list_projects(owner_id)}

    @app.post("/projects", tags=["projects"], status_code=201)
    def create_project(req: ProjectCreateRequest, payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        if not mongo_app_store.enabled:
            raise HTTPException(status_code=503, detail="Database not available. Connect MongoDB to use projects.")
        if mongo_app_store.count_projects(owner_id) >= 10:
            raise HTTPException(status_code=429, detail="Project limit reached (10 per account). Delete an existing project to create a new one.")
        project_id = mongo_app_store.create_project(owner_id, req.name, req.language)
        return {"project": mongo_app_store.get_project(project_id)}

    @app.get("/projects/{project_id}", tags=["projects"])
    def get_project(project_id: str, payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        proj = mongo_app_store.get_project(project_id)
        if not proj or proj["owner_id"] != owner_id:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        return {"project": proj}

    @app.delete("/projects/{project_id}", tags=["projects"])
    def delete_project(project_id: str, payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        deleted = mongo_app_store.delete_project(owner_id, project_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        return {"deleted": True}

    # ── Files (P4.5) ─────────────────────────────────────────────────────────

    @app.get("/projects/{project_id}/files", tags=["projects"])
    def list_files(project_id: str, payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        proj = mongo_app_store.get_project(project_id)
        if not proj or proj["owner_id"] != owner_id:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        return {"files": mongo_app_store.list_files(project_id)}

    @app.post("/projects/{project_id}/files", tags=["projects"], status_code=201)
    def create_file(project_id: str, req: FileUpsertRequest, payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        proj = mongo_app_store.get_project(project_id)
        if not proj or proj["owner_id"] != owner_id:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        if mongo_app_store.count_files(project_id) >= 5:
            raise HTTPException(status_code=429, detail="File limit reached (5 per project). Delete an existing file to add a new one.")
        file_id = mongo_app_store.upsert_file(project_id, None, req.name, req.language, req.code)
        mongo_app_store.touch_project(project_id)
        return {"file": mongo_app_store.get_file(project_id, file_id)}

    @app.put("/projects/{project_id}/files/{file_id}", tags=["projects"])
    def update_file(project_id: str, file_id: str, req: FileUpsertRequest, payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        proj = mongo_app_store.get_project(project_id)
        if not proj or proj["owner_id"] != owner_id:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        mongo_app_store.upsert_file(project_id, file_id, req.name, req.language, req.code)
        mongo_app_store.touch_project(project_id)
        return {"file": mongo_app_store.get_file(project_id, file_id)}

    @app.delete("/projects/{project_id}/files/{file_id}", tags=["projects"])
    def delete_file(project_id: str, file_id: str, payload: dict = Depends(require_member)):
        owner_id = payload.get("user_id") or payload.get("sub", "")
        proj = mongo_app_store.get_project(project_id)
        if not proj or proj["owner_id"] != owner_id:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        deleted = mongo_app_store.delete_file(project_id, file_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="File not found")
        return {"deleted": True}

    app.include_router(sessions_router)
    app.include_router(auth_router)
    return app


app = create_app()
