#!/usr/bin/env python3
"""
Java execution tracer for Traceon debugger.
Uses jdb with reactive stdin/stdout interaction to step through Java programs.
Outputs a JSON array of execution snapshots to stdout.
"""
import sys
import json
import os
import re
import subprocess
import tempfile
import threading
import queue
import time
from pathlib import Path

MAX_STEPS = 200

_PROMPT_RE  = re.compile(r'^(\w+)\[\d+\]\s*>?\s*$')
_EVENT_RE   = re.compile(r'(?:Breakpoint hit|Step completed):\s*"[^"]*",\s*([\w.$]+)\(\),\s*line=(\d+)')
_EXIT_MARKS = ('The application exited', 'VM disconnected', 'Disconnected from')


def _detect_class_name(code: str) -> str:
    m = re.search(r'\bpublic\s+class\s+(\w+)', code)
    if m:
        return m.group(1)
    m = re.search(r'\bclass\s+(\w+)', code)
    if m:
        return m.group(1)
    return "Main"


def _error_snapshot(class_name: str, line: int, func: str, msg: str) -> list:
    return [{
        "step": 0,
        "location": {"file": f"{class_name}.java", "line": line, "function": func},
        "variables": {"error": msg},
        "changed_variables": ["error"],
        "call_stack": [],
    }]


def _run_jdb_session(class_name: str, classpath: str) -> list:
    """Reactive jdb session: reads stdout in background thread, drives commands."""
    try:
        proc = subprocess.Popen(
            ["jdb", "-classpath", classpath, class_name],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            bufsize=0,
        )
    except FileNotFoundError:
        return _error_snapshot(class_name, 0, "<error>",
                               "jdb not found. Please install JDK 11 or later.")

    out_q: queue.Queue = queue.Queue()

    def _reader():
        buf = b""
        while True:
            chunk = proc.stdout.read(256)
            if not chunk:
                out_q.put(None)
                break
            buf += chunk
            while b"\n" in buf:
                line_b, buf = buf.split(b"\n", 1)
                out_q.put(line_b.decode("utf-8", errors="replace") + "\n")
            # Flush partial lines that look like a prompt
            if buf:
                text = buf.decode("utf-8", errors="replace")
                if _PROMPT_RE.match(text.strip()):
                    out_q.put(text)
                    buf = b""

    threading.Thread(target=_reader, daemon=True).start()

    def send(cmd: str):
        try:
            proc.stdin.write((cmd + "\n").encode())
            proc.stdin.flush()
        except BrokenPipeError:
            pass

    def collect(timeout: float = 5.0) -> tuple[list, bool]:
        """Collect lines until a standalone prompt line or timeout/exit."""
        lines: list[str] = []
        deadline = time.monotonic() + timeout
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            try:
                line = out_q.get(timeout=min(remaining, 0.4))
            except queue.Empty:
                break
            if line is None:
                return lines, True
            lines.append(line)
            stripped = line.strip()
            if any(m in line for m in _EXIT_MARKS):
                return lines, True
            if _PROMPT_RE.match(stripped):
                break
        return lines, False

    snapshots: list = []
    prev_vars: dict = {}

    # ── Phase 1: initial prompt ──
    collect(timeout=4.0)

    # ── Phase 2: set breakpoint ──
    send(f"stop in {class_name}.main")
    collect(timeout=4.0)

    # ── Phase 3: run ──
    send("run")

    # ── Phase 4: wait for breakpoint hit ──
    current_line: int | None = None
    current_method = "main"
    deadline = time.monotonic() + 15.0

    while time.monotonic() < deadline:
        try:
            line = out_q.get(timeout=0.5)
        except queue.Empty:
            continue
        if line is None:
            break
        m = _EVENT_RE.search(line)
        if m:
            current_method = m.group(1).split(".")[-1]
            current_line = int(m.group(2))
        if current_line and _PROMPT_RE.match(line.strip()):
            break
        if any(x in line for x in _EXIT_MARKS):
            break

    if not current_line:
        proc.terminate()
        return snapshots

    # ── Phase 5: step loop ──
    for _ in range(MAX_STEPS):
        # Request locals
        send("locals")
        lines, exited = collect(timeout=4.0)

        # Parse variables
        cur_vars: dict = {}
        for l in lines:
            ls = l.strip()
            if ls in ("Method arguments:", "Local variables:") or not ls:
                continue
            if _PROMPT_RE.match(ls):
                continue
            vm = re.match(r"^(\w+)\s*=\s*(.+)$", ls)
            if vm and vm.group(1) != "args":
                cur_vars[vm.group(1)] = vm.group(2).strip()

        changed = [k for k, v in cur_vars.items() if prev_vars.get(k) != v]
        changed += [k for k in prev_vars if k not in cur_vars]

        snapshots.append({
            "step": len(snapshots),
            "location": {"file": f"{class_name}.java", "line": current_line, "function": current_method},
            "variables": dict(cur_vars),
            "changed_variables": changed,
            "call_stack": [{"index": 0, "function": current_method,
                            "file": f"{class_name}.java", "line": current_line}],
        })
        prev_vars = dict(cur_vars)

        if exited:
            break

        # Step to next statement
        send("next")
        lines, exited = collect(timeout=4.0)

        if exited:
            break

        new_line: int | None = None
        for l in lines:
            m = _EVENT_RE.search(l)
            if m:
                current_method = m.group(1).split(".")[-1]
                new_line = int(m.group(2))
                break

        if new_line is None:
            break
        current_line = new_line

    try:
        send("quit")
        time.sleep(0.1)
    except Exception:
        pass
    proc.terminate()
    return snapshots


def main():
    if len(sys.argv) < 2:
        print("[]")
        return

    code_file = os.path.abspath(sys.argv[1])
    stdin_data = ""
    if len(sys.argv) > 2:
        stdin_file = sys.argv[2]
        if os.path.exists(stdin_file):
            try:
                with open(stdin_file) as f:
                    stdin_data = f.read()
            except Exception:
                pass

    try:
        with open(code_file) as f:
            code = f.read()
    except Exception as e:
        print(json.dumps(_error_snapshot("Main", 0, "<error>", str(e))))
        return

    class_name = _detect_class_name(code)

    with tempfile.TemporaryDirectory() as tmpdir:
        src_path = Path(tmpdir) / f"{class_name}.java"
        src_path.write_text(code)

        # ── Compile ──
        try:
            compile_proc = subprocess.run(
                ["javac", "-g", str(src_path)],
                capture_output=True, text=True, cwd=tmpdir, timeout=15,
            )
        except FileNotFoundError:
            print(json.dumps(_error_snapshot(class_name, 0, "<error>",
                "javac not found. Please install JDK 11 or later.")))
            return
        except subprocess.TimeoutExpired:
            print(json.dumps(_error_snapshot(class_name, 0, "<timeout>",
                "Compilation timed out (15s limit)")))
            return

        if compile_proc.returncode != 0:
            err = compile_proc.stderr.strip()
            line_match = re.search(r":(\d+):", err)
            line_num = int(line_match.group(1)) if line_match else 1
            first_line = err.split("\n")[0] if err else "Compilation failed"
            print(json.dumps(_error_snapshot(class_name, line_num, "<compile error>", first_line)))
            return

        # ── Trace via jdb ──
        try:
            snapshots = _run_jdb_session(class_name, tmpdir)
        except subprocess.TimeoutExpired:
            print(json.dumps(_error_snapshot(class_name, 0, "<timeout>",
                "Execution timed out (30s limit)")))
            return
        except Exception as e:
            print(json.dumps(_error_snapshot(class_name, 0, "<error>", str(e))))
            return

        if not snapshots:
            print(json.dumps([{
                "step": 0,
                "location": {"file": f"{class_name}.java", "line": 1, "function": "main"},
                "variables": {},
                "changed_variables": [],
                "call_stack": [],
            }]))
            return

        print(json.dumps(snapshots))


if __name__ == "__main__":
    main()
