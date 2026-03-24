#!/usr/bin/env python3
"""Demo script: compile a C++ program and visualize its execution flow using LLDB."""

import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from flowviz.executor import collect_execution_timeline


def main():
    demo_dir = os.path.dirname(os.path.abspath(__file__))
    cpp_source = os.path.join(demo_dir, "demo_program.cpp")
    executable = os.path.join(demo_dir, "demo_program")

    # --- Compile with debug symbols using clang++ ---
    print("=== Compiling demo_program.cpp with debug symbols ===")
    result = subprocess.run(
        ["clang++", "-g", "-O0", "-std=c++17", "-o", executable, cpp_source],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        # Fallback to g++ if clang++ not available
        print("clang++ not found, trying g++...")
        result = subprocess.run(
            ["g++", "-g", "-O0", "-std=c++17", "-o", executable, cpp_source],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"Compilation failed:\n{result.stderr}")
            sys.exit(1)

    print(f"Compiled: {executable}\n")

    # --- Force LLDB backend ---
    backend = "lldb"
    print(f"=== Running execution timeline (backend: {backend}) ===\n")

    try:
        snapshots = collect_execution_timeline(
            executable=executable,
            max_steps=150,
            delay_seconds=0.0,
            auto_mode=True,
            backend=backend,
        )
    except RuntimeError as e:
        print(f"Error: {e}")
        sys.exit(1)

    # --- Pretty-print the timeline ---
    print(f"\n{'Step':<6} {'Line':<6} {'Function':<20} {'Variables':<50} {'Changed'}")
    print("-" * 120)

    for snap in snapshots:
        vars_str = ", ".join(f"{k}={v}" for k, v in snap.variables.items()) or "(none)"
        changed_str = ", ".join(sorted(snap.changed_variables)) or "-"
        print(
            f"{snap.step:<6} "
            f"{snap.location.line:<6} "
            f"{snap.location.function:<20} "
            f"{vars_str:<50} "
            f"{changed_str}"
        )

    print(f"\n=== Total steps captured: {len(snapshots)} ===")

    # --- Cleanup ---
    if os.path.exists(executable):
        os.remove(executable)
        print("Cleaned up executable.")


if __name__ == "__main__":
    main()
