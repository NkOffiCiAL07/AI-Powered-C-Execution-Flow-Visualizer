from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


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

from flowviz.server.api import router as sessions_router, session_manager
from flowviz.server.models import (
    AnalyzeCodeRequest,
    AnalyzeCodeResponse,
    AnalyzeStepRequest,
    AnalyzeStepResponse,
    CreateSessionRequest,
    DebugBackend,
    ExecutionSnapshot,
    SessionSettings,
    SessionStatus,
    SourceFile,
)


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
    )


def create_app() -> FastAPI:
    app = FastAPI(title="FlowViz Debug Server", version="0.1.0")

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
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="No C++ code provided")

        wrapped_code = _prepare_cpp_code(request.code)
        create_request = CreateSessionRequest(
            source=SourceFile(file_name="main.cpp", language="cpp", code=wrapped_code),
            settings=SessionSettings(
                backend=DebugBackend.LLDB,
                compiler="clang++",
                compiler_flags=["-std=c++17", "-g", "-O0"],
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

        try:
            if direction == "next":
                accepted, message, record, _created_new_step = session_manager.step_next(session_id)
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

    app.include_router(sessions_router)
    return app


app = create_app()
