from __future__ import annotations

import asyncio
import json
import logging
import os
import subprocess
import tempfile
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException
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

from traceon.server.api import router as sessions_router, session_manager
from traceon.server.ai_service import explain_code_ai, generate_code_ai
from traceon.server.auth import router as auth_router
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
    GenerateCodeRequest,
    GenerateCodeResponse,
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

    # Add CORS middleware for frontend access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins for development
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/analyze", response_model=AnalyzeCodeResponse, tags=["analysis"])
    def analyze_code(request: AnalyzeCodeRequest):
        lang = (request.language or "cpp").lower()
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="No code provided")

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
    def generate_code(request: GenerateCodeRequest):
        if not request.prompt or not request.prompt.strip():
            raise HTTPException(status_code=400, detail="No prompt provided")
        try:
            return generate_code_ai(request.prompt.strip(), request.language or "cpp")
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Code generation failed: {error}") from error

    @app.post("/explain", response_model=ExplainCodeResponse, tags=["analysis"])
    def explain_code(request: ExplainCodeRequest):
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="No code provided")

        try:
            return explain_code_ai(request.code, request.language or "cpp")
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"AI explanation failed: {error}") from error

    app.include_router(sessions_router)
    app.include_router(auth_router)
    return app


app = create_app()
