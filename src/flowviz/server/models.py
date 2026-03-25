from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class DebugBackend(StrEnum):
    LLDB = "lldb"
    GDB = "gdb"


class SessionStatus(StrEnum):
    CREATED = "created"
    COMPILED = "compiled"
    READY = "ready"
    RUNNING = "running"
    PAUSED = "paused"
    EXITED = "exited"
    ERROR = "error"


class CommandType(StrEnum):
    STEP_OVER = "step_over"
    STEP_IN = "step_in"
    STEP_OUT = "step_out"
    CONTINUE = "continue"
    PAUSE = "pause"
    STOP = "stop"


class SourceFile(BaseModel):
    file_name: str = Field(default="main.cpp")
    language: str = Field(default="cpp")
    code: str


class SessionSettings(BaseModel):
    backend: DebugBackend = DebugBackend.LLDB
    compiler: str = Field(default="g++")
    compiler_flags: list[str] = Field(default_factory=lambda: ["-std=c++17", "-g"])
    stdin_data: str = Field(default="")
    stop_at_main: bool = True
    max_steps: int = 1000
    execution_timeout_seconds: int = 30


class CreateSessionRequest(BaseModel):
    source: SourceFile
    settings: SessionSettings = Field(default_factory=SessionSettings)


class CompileSessionRequest(BaseModel):
    override_flags: list[str] | None = None


class DebugCommandRequest(BaseModel):
    command: CommandType


class SourceLocationDTO(BaseModel):
    file: str
    line: int
    function: str


class StackFrameDTO(BaseModel):
    index: int
    function: str
    file: str
    line: int


class LiveExecutionStateDTO(BaseModel):
    step: int
    location: SourceLocationDTO
    variables: dict[str, str] = Field(default_factory=dict)
    changed_variables: list[str] = Field(default_factory=list)
    call_stack: list[StackFrameDTO] = Field(default_factory=list)
    stdout_tail: str = ""
    stderr_tail: str = ""


class SessionSummaryResponse(BaseModel):
    session_id: str
    status: SessionStatus
    backend: DebugBackend
    created_at: datetime


class CompileSessionResponse(BaseModel):
    session_id: str
    status: SessionStatus
    success: bool
    diagnostics: list[str] = Field(default_factory=list)
    executable_path: str | None = None


class StartSessionResponse(BaseModel):
    session_id: str
    status: SessionStatus
    state: LiveExecutionStateDTO | None = None


class CommandResponse(BaseModel):
    session_id: str
    accepted: bool
    status: SessionStatus
    state: LiveExecutionStateDTO | None = None
    message: str | None = None


class CurrentStateResponse(BaseModel):
    session_id: str
    status: SessionStatus
    state: LiveExecutionStateDTO | None = None


class ErrorResponse(BaseModel):
    error_code: str
    message: str
    details: list[str] = Field(default_factory=list)


class AnalyzeCodeRequest(BaseModel):
    code: str
    stdin: str = ""


class AnalyzeStepRequest(BaseModel):
    direction: str = Field(default="next")


class ExecutionSnapshot(BaseModel):
    step: int
    location: dict
    variables: dict
    changed_variables: list


class AnalyzeCodeResponse(BaseModel):
    session_id: str
    status: SessionStatus
    cursor: int = 0
    total_recorded_steps: int = 0
    snapshots: list[ExecutionSnapshot] = Field(default_factory=list)
    total_steps: int = 0
    stdout: str = ""
    stderr: str = ""
    execution_mode: str = "timeline"
    message: str = ""


class AnalyzeStepResponse(BaseModel):
    session_id: str
    accepted: bool = True
    status: SessionStatus
    cursor: int
    total_recorded_steps: int
    snapshot: ExecutionSnapshot | None = None
    message: str = ""
