from __future__ import annotations

from fastapi import APIRouter, HTTPException

from flowviz.server.models import (
    CommandResponse,
    CompileSessionRequest,
    CompileSessionResponse,
    CreateSessionRequest,
    CurrentStateResponse,
    DebugCommandRequest,
    SessionStatus,
    SessionSummaryResponse,
    StartSessionResponse,
)
from flowviz.server.session_manager import SessionManager


router = APIRouter(prefix="/sessions", tags=["sessions"])
session_manager = SessionManager()


@router.post("", response_model=SessionSummaryResponse)
def create_session(request: CreateSessionRequest) -> SessionSummaryResponse:
    return session_manager.create_session(request)


@router.post("/{session_id}/compile", response_model=CompileSessionResponse)
def compile_session(
    session_id: str,
    request: CompileSessionRequest,
) -> CompileSessionResponse:
    del request
    try:
        record = session_manager.mark_compiled(session_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return CompileSessionResponse(
        session_id=record.session_id,
        status=record.status,
        success=True,
        diagnostics=[],
        executable_path=f"/tmp/flowviz/{record.session_id}/a.out",
    )


@router.post("/{session_id}/start", response_model=StartSessionResponse)
def start_session(session_id: str) -> StartSessionResponse:
    try:
        record = session_manager.get_record(session_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    if record is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

    if record.status not in {SessionStatus.COMPILED, SessionStatus.READY, SessionStatus.PAUSED}:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot start session in status '{record.status}'",
        )

    started = session_manager.mark_started(session_id)
    return StartSessionResponse(
        session_id=started.session_id,
        status=started.status,
        state=started.state,
    )


@router.post("/{session_id}/commands", response_model=CommandResponse)
def send_command(session_id: str, request: DebugCommandRequest) -> CommandResponse:
    try:
        accepted, message, record = session_manager.apply_command(session_id, request.command)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    if not accepted:
        raise HTTPException(status_code=409, detail=message or "Command rejected")

    return CommandResponse(
        session_id=record.session_id,
        accepted=accepted,
        status=record.status,
        state=record.state,
        message=message,
    )


@router.get("/{session_id}/state", response_model=CurrentStateResponse)
def get_state(session_id: str) -> CurrentStateResponse:
    try:
        return session_manager.get_current_state(session_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
