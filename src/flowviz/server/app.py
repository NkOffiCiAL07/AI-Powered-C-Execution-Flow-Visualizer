from __future__ import annotations

import tempfile
import subprocess
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from flowviz.server.api import router as sessions_router
from flowviz.executor import collect_execution_timeline


class AnalyzeCodeRequest(BaseModel):
    code: str
    stdin: str = ""


class ExecutionSnapshot(BaseModel):
    step: int
    location: dict
    variables: dict
    changed_variables: list


class AnalyzeCodeResponse(BaseModel):
    snapshots: list[ExecutionSnapshot]
    total_steps: int
    stdout: str = ""
    stderr: str = ""
    execution_mode: str = "timeline"
    message: str = ""


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
        """
        Analyze C++ code by compiling it and capturing execution timeline.
        Returns snapshots of variable values at each step.
        Supports code snippets without main() by wrapping them automatically.
        Accepts optional stdin input for programs that read from cin.
        """
        if not request.code or not request.code.strip():
            raise HTTPException(status_code=400, detail="No C++ code provided")

        code = request.code.strip()
        stdin_text = request.stdin or ""
        
        # Check if code already has a main function
        has_main = "main(" in code or "main ()" in code
        
        # Prepare the code - wrap in main if needed
        if not has_main:
            # Auto-wrap code without main in a main function
            wrapped_code = f"""#include <iostream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

int main() {{
{chr(10).join('    ' + line for line in code.split(chr(10)))}
    return 0;
}}
"""
        else:
            # Ensure necessary headers are included
            if "#include" not in code:
                wrapped_code = f"""#include <iostream>
#include <vector>
#include <string>
#include <cmath>
using namespace std;

{code}
"""
            else:
                wrapped_code = code

        try:
            # Create temporary files for the C++ source and stdin payload.
            with tempfile.NamedTemporaryFile(mode="w", suffix=".cpp", delete=False) as f:
                f.write(wrapped_code)
                source_file = f.name
            with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
                f.write(stdin_text)
                stdin_file = f.name

            try:
                executable = source_file.replace(".cpp", "")

                # Compile the code - try clang++ first, then g++
                result = subprocess.run(
                    ["clang++", "-g", "-O0", "-std=c++17", "-o", executable, source_file],
                    capture_output=True,
                    text=True,
                    timeout=10,
                )

                if result.returncode != 0:
                    # Try g++ as fallback
                    result = subprocess.run(
                        ["g++", "-g", "-O0", "-std=c++17", "-o", executable, source_file],
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )

                if result.returncode != 0:
                    # Format error message with file/line details
                    error_msg = result.stderr
                    # Extract line numbers and provide better context
                    detail_msg = f"Compilation failed:\n{error_msg}"
                    raise HTTPException(
                        status_code=400,
                        detail=detail_msg,
                    )

                if stdin_text:
                    run_result = subprocess.run(
                        [executable],
                        input=stdin_text,
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )

                    return AnalyzeCodeResponse(
                        snapshots=[],
                        total_steps=0,
                        stdout=run_result.stdout,
                        stderr=run_result.stderr,
                        execution_mode="output_only",
                        message="Executed with stdin input in output-only mode.",
                    )

                # Prefer timeline mode, but fall back to a normal run when LLDB tracing fails.
                try:
                    snapshots = collect_execution_timeline(
                        executable=executable,
                        max_steps=150,
                        delay_seconds=0.0,
                        auto_mode=True,
                        backend="lldb",
                        stdin_path=stdin_file,
                    )
                except Exception as timeline_error:
                    run_result = subprocess.run(
                        [executable],
                        input=stdin_text,
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )

                    fallback_stderr = run_result.stderr
                    fallback_message = (
                        "Timeline capture is not available for this program. "
                        "Showing normal program output instead."
                    )
                    if str(timeline_error):
                        fallback_stderr = (
                            f"{fallback_stderr}\n\nTimeline fallback reason: {timeline_error}".strip()
                        )

                    return AnalyzeCodeResponse(
                        snapshots=[],
                        total_steps=0,
                        stdout=run_result.stdout,
                        stderr=fallback_stderr,
                        execution_mode="output_only",
                        message=fallback_message,
                    )

                # Run the program once to capture its actual stdout/stderr
                try:
                    run_for_output = subprocess.run(
                        [executable],
                        input=stdin_text,
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )
                    captured_stdout = run_for_output.stdout
                    captured_stderr = run_for_output.stderr
                except Exception:
                    captured_stdout = ""
                    captured_stderr = ""

                # Convert to response format
                response_snapshots = []
                for snapshot in snapshots:
                    response_snapshots.append(
                        ExecutionSnapshot(
                            step=snapshot.step,
                            location={
                                "file": snapshot.location.file,
                                "line": snapshot.location.line,
                                "function": snapshot.location.function,
                            },
                            variables=snapshot.variables,
                            changed_variables=list(snapshot.changed_variables),
                        )
                    )

                return AnalyzeCodeResponse(
                    snapshots=response_snapshots,
                    total_steps=len(response_snapshots),
                    stdout=captured_stdout,
                    stderr=captured_stderr,
                    execution_mode="timeline",
                    message="",
                )

            finally:
                # Cleanup
                if os.path.exists(source_file):
                    os.remove(source_file)
                if os.path.exists(stdin_file):
                    os.remove(stdin_file)
                if os.path.exists(executable):
                    os.remove(executable)

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    app.include_router(sessions_router)
    return app


app = create_app()
