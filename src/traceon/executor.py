from __future__ import annotations

import time

from traceon.gdb_controller import GdbMIController
from traceon.lldb_controller import LLDBController
from traceon.models import SourceLocation, StateSnapshot


def collect_execution_timeline(
    executable: str,
    max_steps: int = 500,
    delay_seconds: float = 0.0,
    auto_mode: bool = True,
    backend: str = "lldb",
    stdin_path: str | None = None,
) -> list[StateSnapshot]:
    if backend == "lldb":
        controller = LLDBController(executable)
        debugger_name = "LLDB"
    elif backend == "gdb":
        controller = GdbMIController(executable)
        debugger_name = "GDB"
    else:
        raise RuntimeError(f"Unsupported debugger backend: {backend}")

    snapshots: list[StateSnapshot] = []
    previous_variables: dict[str, str] = {}
    last_known_location: SourceLocation | None = None

    try:
        controller.start()
    except FileNotFoundError as error:
        raise RuntimeError(f"{debugger_name} is not installed or not in PATH") from error

    try:
        break_output = controller.break_main()
        if controller.has_error(break_output):
            raise RuntimeError(
                f"{debugger_name} failed to set breakpoint at main: {controller.get_error_message(break_output)}"
            )

        if backend == "gdb" and stdin_path:
            raise RuntimeError("stdin input is only supported with the LLDB backend")

        run_output = controller.exec_run(stdin_path=stdin_path) if backend == "lldb" else controller.exec_run()
        if controller.has_error(run_output):
            raise RuntimeError(
                f"{debugger_name} failed to run executable: {controller.get_error_message(run_output)}"
            )

        if controller.is_exited(run_output):
            return snapshots

        for step_number in range(1, max_steps + 1):
            current_file, current_line, current_function = controller.current_location()
            if current_line == -1 and last_known_location is not None:
                current_file = last_known_location.file
                current_line = last_known_location.line
                current_function = last_known_location.function

            variables = controller.list_locals()
            if not variables and previous_variables:
                variables = previous_variables.copy()

            changed = {
                name
                for name, value in variables.items()
                if previous_variables.get(name) != value
            }

            location = SourceLocation(
                file=current_file,
                line=current_line,
                function=current_function,
            )
            
            call_stack = controller.call_stack()

            snapshots.append(
                StateSnapshot(
                    step=step_number,
                    location=location,
                    variables=variables,
                    changed_variables=changed,
                    call_stack=call_stack,
                )
            )

            previous_variables = variables
            if location.line != -1:
                last_known_location = location

            if not auto_mode:
                user_input = input("Press Enter for next step, c for continuous, q to stop: ").strip().lower()
                if user_input == "q":
                    break
                if user_input == "c":
                    auto_mode = True

            step_output = controller.exec_step()
            if controller.has_error(step_output):
                raise RuntimeError(
                    f"{debugger_name} step failed: {controller.get_error_message(step_output)}"
                )
            if controller.is_exited(step_output):
                break

            if delay_seconds > 0:
                time.sleep(delay_seconds)
    finally:
        controller.close()

    return snapshots
