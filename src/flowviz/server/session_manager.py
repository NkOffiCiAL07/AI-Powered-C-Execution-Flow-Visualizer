from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import shutil
import subprocess
import tempfile
from uuid import uuid4

from flowviz.lldb_controller import LLDBController
from flowviz.server.models import (
    CommandType,
    CompileSessionResponse,
    CreateSessionRequest,
    CurrentStateResponse,
    DebugBackend,
    LiveExecutionStateDTO,
    SessionStatus,
    SessionSummaryResponse,
    StackFrameDTO,
    SourceLocationDTO,
)


@dataclass
class _SessionRecord:
    session_id: str
    backend: DebugBackend
    status: SessionStatus
    created_at: datetime
    request: CreateSessionRequest
    state: LiveExecutionStateDTO | None = None
    work_dir: Path | None = None
    source_path: Path | None = None
    executable_path: Path | None = None
    controller: LLDBController | None = None
    previous_variables: dict[str, str] | None = None


class SessionManager:
    def __init__(self) -> None:
        self._sessions: dict[str, _SessionRecord] = {}

    def create_session(self, request: CreateSessionRequest) -> SessionSummaryResponse:
        session_id = str(uuid4())
        record = _SessionRecord(
            session_id=session_id,
            backend=request.settings.backend,
            status=SessionStatus.CREATED,
            created_at=datetime.now(tz=timezone.utc),
            request=request,
        )
        self._sessions[session_id] = record
        return SessionSummaryResponse(
            session_id=record.session_id,
            status=record.status,
            backend=record.backend,
            created_at=record.created_at,
        )

    def get_record(self, session_id: str) -> _SessionRecord | None:
        return self._sessions.get(session_id)

    def mark_compiled(self, session_id: str) -> _SessionRecord:
        raise NotImplementedError

    def compile_session(self, session_id: str, override_flags: list[str] | None = None) -> CompileSessionResponse:
        record = self._require_session(session_id)

        self._cleanup_runtime(record)

        work_dir = Path(tempfile.mkdtemp(prefix=f"flowviz_{record.session_id}_"))
        source_path = work_dir / record.request.source.file_name
        source_path.write_text(record.request.source.code)

        executable_path = work_dir / "program.out"
        compile_flags = override_flags if override_flags is not None else record.request.settings.compiler_flags
        compile_command = [
            record.request.settings.compiler,
            *compile_flags,
            str(source_path),
            "-o",
            str(executable_path),
        ]

        try:
            completed = subprocess.run(
                compile_command,
                capture_output=True,
                text=True,
                timeout=record.request.settings.execution_timeout_seconds,
            )
        except Exception as error:
            record.status = SessionStatus.ERROR
            return CompileSessionResponse(
                session_id=record.session_id,
                status=record.status,
                success=False,
                diagnostics=[str(error)],
                executable_path=None,
            )

        diagnostics = [line for line in completed.stderr.splitlines() if line.strip()]
        if completed.returncode != 0:
            record.status = SessionStatus.ERROR
            return CompileSessionResponse(
                session_id=record.session_id,
                status=record.status,
                success=False,
                diagnostics=diagnostics or ["Compilation failed"],
                executable_path=None,
            )

        record.work_dir = work_dir
        record.source_path = source_path
        record.executable_path = executable_path
        record.status = SessionStatus.COMPILED
        record.state = None
        record.previous_variables = None

        return CompileSessionResponse(
            session_id=record.session_id,
            status=record.status,
            success=True,
            diagnostics=diagnostics,
            executable_path=str(executable_path),
        )

    def mark_started(self, session_id: str) -> _SessionRecord:
        record = self._require_session(session_id)

        if record.executable_path is None:
            raise RuntimeError("Session is not compiled")

        if record.backend != DebugBackend.LLDB:
            raise RuntimeError(f"Backend '{record.backend}' is not implemented yet")

        if record.controller is not None:
            record.controller.close()

        controller = LLDBController(str(record.executable_path))
        controller.start()

        break_output = controller.break_main()
        if controller.has_error(break_output):
            record.status = SessionStatus.ERROR
            raise RuntimeError(controller.get_error_message(break_output))

        run_output = controller.exec_run()
        if controller.has_error(run_output):
            record.status = SessionStatus.ERROR
            raise RuntimeError(controller.get_error_message(run_output))

        if controller.is_exited(run_output):
            record.controller = controller
            record.status = SessionStatus.EXITED
            self._refresh_state(record, increment_step=False)
            return record

        record.controller = controller
        record.status = SessionStatus.PAUSED
        self._refresh_state(record, increment_step=False)
        return record

    def apply_command(self, session_id: str, command: CommandType) -> tuple[bool, str | None, _SessionRecord]:
        record = self._require_session(session_id)
        controller = record.controller

        if command == CommandType.STOP:
            if controller is not None:
                try:
                    controller.kill()
                except Exception:
                    pass
                controller.close()
                record.controller = None
            record.status = SessionStatus.EXITED
            return True, None, record

        if record.status not in {SessionStatus.PAUSED, SessionStatus.RUNNING}:
            return False, f"Command '{command}' not allowed while status is '{record.status}'", record

        if controller is None:
            return False, "Debugger is not started for this session", record

        if command == CommandType.CONTINUE:
            record.status = SessionStatus.RUNNING
            continue_output = controller.exec_continue()
            if controller.has_error(continue_output):
                record.status = SessionStatus.ERROR
                return False, controller.get_error_message(continue_output), record
            if controller.is_exited(continue_output):
                record.status = SessionStatus.EXITED
            else:
                record.status = SessionStatus.PAUSED
                self._refresh_state(record, increment_step=True)
            return True, "Execution resumed", record

        if command == CommandType.PAUSE:
            if record.status != SessionStatus.RUNNING:
                return False, "Pause command is valid only while running", record
            record.status = SessionStatus.PAUSED
            self._refresh_state(record, increment_step=False)
            return True, "Execution paused", record

        if command in {CommandType.STEP_OVER, CommandType.STEP_IN, CommandType.STEP_OUT}:
            if record.status != SessionStatus.PAUSED:
                return False, "Step commands require paused state", record

            if command == CommandType.STEP_OVER:
                step_output = controller.exec_step()
            elif command == CommandType.STEP_IN:
                step_output = controller.exec_step_in()
            else:
                step_output = controller.exec_step_out()

            if controller.has_error(step_output):
                record.status = SessionStatus.ERROR
                return False, controller.get_error_message(step_output), record

            if controller.is_exited(step_output):
                record.status = SessionStatus.EXITED
                self._refresh_state(record, increment_step=True)
                return True, None, record

            self._refresh_state(record, increment_step=True)
            return True, None, record

        return False, f"Unsupported command '{command}'", record

    def get_current_state(self, session_id: str) -> CurrentStateResponse:
        record = self._require_session(session_id)
        return CurrentStateResponse(
            session_id=record.session_id,
            status=record.status,
            state=record.state,
        )

    def _require_session(self, session_id: str) -> _SessionRecord:
        record = self.get_record(session_id)
        if record is None:
            raise KeyError(f"Session '{session_id}' not found")
        return record

    def _refresh_state(self, record: _SessionRecord, increment_step: bool) -> None:
        if record.controller is None:
            return

        current_file, current_line, current_function = record.controller.current_location()
        variables = record.controller.list_locals()
        if not variables and record.previous_variables:
            variables = record.previous_variables.copy()

        previous_state = record.state
        previous_variables = record.previous_variables or {}
        changed_variables = [
            name for name, value in variables.items() if previous_variables.get(name) != value
        ]

        call_stack = [
            StackFrameDTO(index=frame_index, function=function, file=file_name, line=line)
            for frame_index, function, file_name, line in record.controller.call_stack()
        ]

        previous_step = previous_state.step if previous_state else 0
        next_step = previous_step + 1 if increment_step else previous_step

        record.state = LiveExecutionStateDTO(
            step=next_step,
            location=SourceLocationDTO(
                file=current_file,
                line=current_line,
                function=current_function,
            ),
            variables=variables,
            changed_variables=changed_variables,
            call_stack=call_stack,
            stdout_tail=previous_state.stdout_tail if previous_state else "",
            stderr_tail=previous_state.stderr_tail if previous_state else "",
        )
        record.previous_variables = variables.copy()

    def _cleanup_runtime(self, record: _SessionRecord) -> None:
        if record.controller is not None:
            try:
                record.controller.close()
            except Exception:
                pass
            record.controller = None

        if record.work_dir and record.work_dir.exists():
            shutil.rmtree(record.work_dir, ignore_errors=True)
        record.work_dir = None
        record.source_path = None
        record.executable_path = None
