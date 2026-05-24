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
    memory: list[dict] = Field(default_factory=list)
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


class RunCodeRequest(BaseModel):
    code: str
    stdin: str = ""
    language: str = "cpp"


class RunCodeResponse(BaseModel):
    success: bool
    stdout: str = ""
    stderr: str = ""
    compile_error: str = ""
    exit_code: int = 0


class AnalyzeCodeRequest(BaseModel):
    code: str
    stdin: str = ""
    language: str = "cpp"
    project_id: str | None = None
    file_id: str | None = None


class AnalyzeStepRequest(BaseModel):
    direction: str = Field(default="next")
    step_type: CommandType | None = None


class ExecutionSnapshot(BaseModel):
    step: int
    location: dict
    variables: dict
    changed_variables: list
    call_stack: list[StackFrameDTO] = Field(default_factory=list)


class PerformanceMetricsDTO(BaseModel):
    line_hits: dict[int, int] = Field(default_factory=dict)
    line_times_ms: dict[int, float] = Field(default_factory=dict)
    total_execution_time_ms: float = 0.0


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
    performance: PerformanceMetricsDTO | None = None


class AnalyzeStepResponse(BaseModel):
    session_id: str
    accepted: bool = True
    status: SessionStatus
    cursor: int
    total_recorded_steps: int
    snapshot: ExecutionSnapshot | None = None
    message: str = ""
    performance: PerformanceMetricsDTO | None = None


class GenerateCodeRequest(BaseModel):
    prompt: str
    language: str = "cpp"


class GenerateCodeResponse(BaseModel):
    code: str


class ExplainCodeRequest(BaseModel):
    code: str
    language: str = "cpp"


class ExplainCodeResponse(BaseModel):
    explanation: str
    time_complexity: str
    space_complexity: str
    key_points: list[str] = Field(default_factory=list)


class OptimizeCodeRequest(BaseModel):
    code: str
    language: str = "cpp"
    line_hits: dict = Field(default_factory=dict)   # {line_number_str: hit_count}
    step_count: int = 0


# ── Project / File DTOs (P4) ─────────────────────────────────────────────────

class UserDTO(BaseModel):
    id: str
    google_id: str
    email: str
    name: str
    avatar_url: str
    role: str
    created_at: datetime


class ProjectDTO(BaseModel):
    id: str
    owner_id: str
    name: str
    language: str
    created_at: datetime
    last_accessed: datetime


class FileDTO(BaseModel):
    id: str
    project_id: str
    name: str
    language: str
    code: str
    updated_at: datetime
    last_snapshots: list[dict] = Field(default_factory=list)


class ProjectCreateRequest(BaseModel):
    name: str
    language: str = "cpp"


class FileUpsertRequest(BaseModel):
    name: str
    language: str
    code: str
    snapshots: list[dict] | None = None


class CheckCodeRequest(BaseModel):
    code: str
    language: str = "cpp"


class CheckCodeResponse(BaseModel):
    ok: bool
    errors: str = ""
