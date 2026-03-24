"""Compile C code and trace execution using LLDB."""

import os
import subprocess
import tempfile
import re


def compile_and_trace(c_code: str, user_input: str = "") -> dict:
    """Compile C code, run it, and return output + basic trace."""
    with tempfile.TemporaryDirectory() as tmpdir:
        src_path = os.path.join(tmpdir, "program.c")
        exe_path = os.path.join(tmpdir, "program")

        with open(src_path, "w") as f:
            f.write(c_code)

        # Compile
        compile_result = subprocess.run(
            ["gcc", "-g", "-O0", "-o", exe_path, src_path],
            capture_output=True, text=True,
        )
        if compile_result.returncode != 0:
            return {"error": compile_result.stderr.strip()}

        # Run normally to get output
        try:
            run_result = subprocess.run(
                [exe_path],
                input=user_input,
                capture_output=True, text=True,
                timeout=10,
            )
            output = run_result.stdout
        except subprocess.TimeoutExpired:
            return {"error": "Program timed out (10s limit)"}

        # Run under LLDB for trace
        lldb_commands = "\n".join([
            "settings set auto-confirm true",
            "breakpoint set --name main",
            "run",
        ] + ["frame variable\nnext"] * 50 + ["quit"])

        try:
            lldb_result = subprocess.run(
                ["lldb", "--batch", exe_path],
                input=lldb_commands,
                capture_output=True, text=True,
                timeout=15,
            )
            trace_raw = lldb_result.stdout
        except (subprocess.TimeoutExpired, FileNotFoundError):
            trace_raw = ""

        return {
            "output": output,
            "trace": _parse_trace(trace_raw),
        }


def _parse_trace(raw: str) -> list:
    """Minimal trace parser."""
    steps = []
    loc_pattern = re.compile(r'at\s+(\S+?):(\d+)')
    var_pattern = re.compile(r'\(([^)]+)\)\s+(\w+)\s*=\s*(.*)')

    current_line = 0
    current_vars = {}

    for line in raw.splitlines():
        loc_match = loc_pattern.search(line)
        if loc_match:
            current_line = int(loc_match.group(2))

        var_match = var_pattern.match(line.strip())
        if var_match:
            current_vars[var_match.group(2)] = var_match.group(3).strip()

        if "stopped" in line and current_line > 0:
            steps.append({"line": current_line, "variables": dict(current_vars)})

    return steps
