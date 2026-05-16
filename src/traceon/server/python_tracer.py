#!/usr/bin/env python3
"""
Python execution tracer for Traceon debugger.
Usage: python3 python_tracer.py <code_file> [<stdin_file>]
Outputs a JSON array of execution snapshots to stdout.
"""
import sys
import json
import os

MAX_STEPS = 250

EXCLUDED = frozenset([
    "__builtins__", "__name__", "__doc__", "__package__",
    "__loader__", "__spec__", "__annotations__", "__cached__",
    "__file__", "__build_class__",
])


def _safe_repr(val, depth=0):
    if depth > 2:
        return "..."
    if isinstance(val, bool):
        return str(val)
    if isinstance(val, type(None)):
        return "None"
    if isinstance(val, int):
        return str(val)
    if isinstance(val, float):
        return f"{val:.6g}"
    if isinstance(val, str):
        s = repr(val)
        return s[:120] + "..." if len(s) > 120 else s
    if isinstance(val, (list, tuple)):
        items = [_safe_repr(v, depth + 1) for v in val[:8]]
        suffix = f", ...+{len(val) - 8}" if len(val) > 8 else ""
        inner = ", ".join(items) + suffix
        return f"[{inner}]" if isinstance(val, list) else f"({inner})"
    if isinstance(val, dict):
        pairs = [f"{_safe_repr(k, depth+1)}: {_safe_repr(v, depth+1)}"
                 for k, v in list(val.items())[:8]]
        suffix = f", ...+{len(val) - 8}" if len(val) > 8 else ""
        return "{" + ", ".join(pairs) + suffix + "}"
    if isinstance(val, set):
        items = [_safe_repr(v, depth + 1) for v in list(val)[:8]]
        return "{" + ", ".join(items) + "}"
    try:
        r = repr(val)
        return r[:100] if len(r) > 100 else r
    except Exception:
        return "<object>"


def main():
    if len(sys.argv) < 2:
        print("[]")
        return

    code_file = os.path.abspath(sys.argv[1])
    stdin_file = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        with open(code_file) as f:
            code = f.read()
    except Exception as e:
        print(json.dumps([{
            "step": 0,
            "location": {"file": "user_code.py", "line": 0, "function": "<error>"},
            "variables": {"error": str(e)},
            "changed_variables": ["error"],
            "call_stack": [],
        }]))
        return

    # Redirect stdin
    if stdin_file and os.path.exists(stdin_file):
        try:
            sys.stdin = open(stdin_file)
        except Exception:
            pass
    else:
        import io
        sys.stdin = io.StringIO("")

    snapshots = []
    step_counter = [0]
    prev_vars = [{}]
    halted = [False]

    def tracer(frame, event, arg):
        if halted[0]:
            return None

        # Only trace user's file
        if frame.f_code.co_filename != code_file:
            # Allow tracing returns from calls within user code
            return tracer if event == "call" else None

        if event not in ("call", "line", "return"):
            return tracer

        if step_counter[0] >= MAX_STEPS:
            halted[0] = True
            sys.settrace(None)
            return None

        func = frame.f_code.co_name
        line = frame.f_lineno

        local_vars = {}
        for k, v in frame.f_locals.items():
            if k in EXCLUDED or k.startswith("__"):
                continue
            try:
                local_vars[k] = _safe_repr(v)
            except Exception:
                local_vars[k] = "<error>"

        changed = [
            k for k, v in local_vars.items()
            if k not in prev_vars[0] or prev_vars[0].get(k) != v
        ]
        prev_vars[0] = dict(local_vars)

        # Build call stack
        stack = []
        f = frame
        idx = 0
        while f is not None and idx < 8:
            if f.f_code.co_filename == code_file:
                stack.append({
                    "index": idx,
                    "function": f.f_code.co_name,
                    "file": os.path.basename(code_file),
                    "line": f.f_lineno,
                })
            f = f.f_back
            idx += 1
        stack.reverse()

        snapshots.append({
            "step": step_counter[0],
            "location": {
                "file": os.path.basename(code_file),
                "line": line,
                "function": func,
            },
            "variables": local_vars,
            "changed_variables": changed,
            "call_stack": stack,
        })
        step_counter[0] += 1
        return tracer

    try:
        compiled = compile(code, code_file, "exec")
    except SyntaxError as e:
        print(json.dumps([{
            "step": 0,
            "location": {"file": os.path.basename(code_file), "line": e.lineno or 0, "function": "<syntax error>"},
            "variables": {"error": f"SyntaxError: {e.msg}"},
            "changed_variables": ["error"],
            "call_stack": [],
        }]))
        return

    import io as _io
    # Capture the program's own stdout so it doesn't mix with our JSON output
    _orig_stdout = sys.stdout
    _captured_stdout = _io.StringIO()
    sys.stdout = _captured_stdout

    global_ns = {"__name__": "__main__", "__file__": code_file}
    sys.settrace(tracer)
    try:
        exec(compiled, global_ns)  # noqa: S102
    except SystemExit:
        pass
    except Exception as e:
        snapshots.append({
            "step": step_counter[0],
            "location": {"file": os.path.basename(code_file), "line": 0, "function": "<runtime error>"},
            "variables": {"error": f"{type(e).__name__}: {e}"},
            "changed_variables": ["error"],
            "call_stack": [],
        })
    finally:
        sys.settrace(None)
        sys.stdout = _orig_stdout

    # Remove consecutive no-op snapshots (same line, same vars, nothing changed)
    deduped = []
    for snap in snapshots:
        if (deduped
                and snap["location"]["line"] == deduped[-1]["location"]["line"]
                and snap["location"]["function"] == deduped[-1]["location"]["function"]
                and snap["variables"] == deduped[-1]["variables"]
                and snap["changed_variables"] == []):
            continue
        deduped.append(snap)

    for i, snap in enumerate(deduped):
        snap["step"] = i

    print(json.dumps(deduped))


if __name__ == "__main__":
    main()
