from dataclasses import dataclass, field


@dataclass
class SourceLocation:
    file: str
    line: int
    function: str


@dataclass
class MemoryVariable:
    address: str
    type: str
    name: str
    value: str
    deref: str | None = None


@dataclass
class StateSnapshot:
    step: int
    location: SourceLocation
    variables: dict[str, str] = field(default_factory=dict)
    memory: list[dict] = field(default_factory=list)
    changed_variables: set[str] = field(default_factory=set)
    call_stack: list[tuple[int, str, str, int]] = field(default_factory=list)
