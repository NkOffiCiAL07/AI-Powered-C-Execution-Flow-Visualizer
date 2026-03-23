from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

from flowviz.server.models import (
    CommandType,
    CreateSessionRequest,
    CurrentStateResponse,
    DebugBackend,
    LiveExecutionStateDTO,
    SessionStatus,
    SessionSummaryResponse,
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
        record = self._require_session(session_id)
        record.status = SessionStatus.COMPILED
        return record

    def mark_started(self, session_id: str) -> _SessionRecord:
        record = self._require_session(session_id)
        record.status = SessionStatus.PAUSED
        if record.state is None:
            record.state = LiveExecutionStateDTO(
                step=0,
                location=SourceLocationDTO(
                    file=record.request.source.file_name,
                    line=1,
                    function="main",
                ),
                variables={},
                changed_variables=[],
                call_stack=[],
                stdout_tail="",
                stderr_tail="",
            )
        return record

    def apply_command(self, session_id: str, command: CommandType) -> tuple[bool, str | None, _SessionRecord]:
        record = self._require_session(session_id)

        if command == CommandType.STOP:
            record.status = SessionStatus.EXITED
            return True, None, record

        if record.status not in {SessionStatus.PAUSED, SessionStatus.RUNNING}:
            return False, f"Command '{command}' not allowed while status is '{record.status}'", record

        if command == CommandType.CONTINUE:
            record.status = SessionStatus.RUNNING
            return True, "Execution resumed", record

        if command == CommandType.PAUSE:
            record.status = SessionStatus.PAUSED
            return True, "Execution paused", record

        if command in {CommandType.STEP_OVER, CommandType.STEP_IN, CommandType.STEP_OUT}:
            if record.status != SessionStatus.PAUSED:
                return False, "Step commands require paused state", record

            if record.state is None:
                record = self.mark_started(session_id)

            record.state = LiveExecutionStateDTO(
                step=record.state.step + 1,
                location=SourceLocationDTO(
                    file=record.state.location.file,
                    line=record.state.location.line + 1,
                    function=record.state.location.function,
                ),
                variables=record.state.variables,
                changed_variables=[],
                call_stack=record.state.call_stack,
                stdout_tail=record.state.stdout_tail,
                stderr_tail=record.state.stderr_tail,
            )
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
