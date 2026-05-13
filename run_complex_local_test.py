import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

from flowviz.executor import collect_execution_timeline

source_file = ROOT / "complex_test.cpp"
executable = ROOT / "build" / "complex_test_exec"
result_file = ROOT / "complex_local_result.json"

compile_result = subprocess.run(
    ["clang++", "-g", "-O0", "-std=c++17", "-o", str(executable), str(source_file)],
    capture_output=True,
    text=True,
)

if compile_result.returncode != 0:
    compile_result = subprocess.run(
        ["g++", "-g", "-O0", "-std=c++17", "-o", str(executable), str(source_file)],
        capture_output=True,
        text=True,
    )

summary = {
    "compiled": compile_result.returncode == 0,
    "compile_stderr": compile_result.stderr,
    "snapshot_count": 0,
    "first_line": None,
    "last_line": None,
    "functions": [],
    "tail_lines": [],
    "last_variables": {},
    "error": None,
}

if summary["compiled"]:
    try:
        snapshots = collect_execution_timeline(
            executable=str(executable),
            max_steps=200,
            delay_seconds=0.0,
            auto_mode=True,
            backend="lldb",
        )
        summary["snapshot_count"] = len(snapshots)
        if snapshots:
            summary["first_line"] = snapshots[0].location.line
            summary["last_line"] = snapshots[-1].location.line
            summary["functions"] = sorted({snapshot.location.function for snapshot in snapshots})
            summary["tail_lines"] = [snapshot.location.line for snapshot in snapshots[-10:]]
            summary["last_variables"] = snapshots[-1].variables
    except Exception as error:
        summary["error"] = repr(error)

result_file.write_text(json.dumps(summary, indent=2), encoding="utf-8")

if executable.exists():
    executable.unlink()
