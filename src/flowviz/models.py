from dataclasses import dataclass, field


@dataclass
class SourceLocation:
    file: str
    line: int
    function: str


@dataclass
class StateSnapshot:
    step: int
    location: SourceLocation
    variables: dict[str, str] = field(default_factory=dict)
    changed_variables: set[str] = field(default_factory=set)
