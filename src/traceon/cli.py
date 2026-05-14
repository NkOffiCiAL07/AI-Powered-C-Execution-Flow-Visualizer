from __future__ import annotations

import argparse

from rich.console import Console
from rich.table import Table

from traceon.executor import collect_execution_timeline


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="traceon",
        description="Step through a C++ executable with LLDB/GDB and show variable flow.",
    )
    parser.add_argument("executable", help="Path to compiled C++ executable (built with -g)")
    parser.add_argument(
        "--backend",
        choices=["lldb", "gdb"],
        default="lldb",
        help="Debugger backend to use (default: lldb)",
    )
    parser.add_argument("--max-steps", type=int, default=200, help="Maximum number of steps")
    parser.add_argument("--delay", type=float, default=0.0, help="Delay between steps in auto mode")
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Require keypress for each step (Enter next, c continue, q quit)",
    )
    return parser


def _render_snapshot_table(console: Console, snapshot) -> None:
    console.rule(f"Step {snapshot.step} • {snapshot.location.function} • line {snapshot.location.line}")
    console.print(snapshot.location.file)

    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Variable")
    table.add_column("Value")
    table.add_column("Changed")

    if not snapshot.variables:
        table.add_row("-", "-", "-")
    else:
        for variable_name in sorted(snapshot.variables):
            changed = "*" if variable_name in snapshot.changed_variables else ""
            table.add_row(variable_name, snapshot.variables[variable_name], changed)

    console.print(table)


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    console = Console()

    try:
        snapshots = collect_execution_timeline(
            executable=args.executable,
            max_steps=args.max_steps,
            delay_seconds=args.delay,
            auto_mode=not args.interactive,
            backend=args.backend,
        )
    except RuntimeError as error:
        message = str(error)
        console.print(f"Execution failed: {message}", style="bold red")
        if args.backend == "gdb" and "Don't know how to run" in message:
            console.print(
                "Your GDB build cannot launch native processes on this system. "
                "Use Linux (VM/container) for GDB-based execution, or run with --backend lldb on macOS.",
                style="yellow",
            )
        return 2

    if not snapshots:
        console.print("No execution snapshots were captured.", style="yellow")
        return 1

    for snapshot in snapshots:
        _render_snapshot_table(console, snapshot)

    console.rule("Execution Complete")
    console.print(f"Captured {len(snapshots)} steps.", style="green")
    return 0
