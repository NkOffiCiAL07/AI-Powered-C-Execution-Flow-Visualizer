from __future__ import annotations

import re
from typing import Iterable

import pexpect


ANSI_ESCAPE_RE = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")


class LLDBController:
    def __init__(self, executable: str):
        self.executable = executable
        self._process: pexpect.spawn | None = None

    def start(self) -> None:
        self._process = pexpect.spawn(
            "lldb",
            ["--no-lldbinit", self.executable],
            encoding="utf-8",
            timeout=15,
            echo=False,
        )
        self._process.expect_exact("(lldb)")
        self._process.sendline("settings set use-color false")
        self._process.expect_exact("(lldb)")

    def close(self) -> None:
        if not self._process:
            return

        try:
            if self._process.isalive():
                self.run("quit")
        except Exception:
            pass
        finally:
            if self._process.isalive():
                self._process.terminate(force=True)
            self._process = None

    def run(self, command: str) -> list[str]:
        if not self._process:
            raise RuntimeError("LLDB process is not started")

        self._process.sendline(command)
        self._process.expect_exact("(lldb)")
        output = self._process.before or ""
        lines: list[str] = []
        for line in output.splitlines():
            cleaned = ANSI_ESCAPE_RE.sub("", line).replace("\r", "").strip()
            if cleaned:
                lines.append(cleaned)
        return lines

    def break_main(self) -> list[str]:
        return self.run("breakpoint set --name main")

    def exec_run(self) -> list[str]:
        return self.run("run")

    def exec_step(self) -> list[str]:
        return self.run("thread step-over")

    def list_locals(self) -> dict[str, str]:
        for _ in range(3):
            output = self.run("frame variable")
            variables: dict[str, str] = {}
            for line in output:
                match = re.match(r"^\((.*?)\)\s+([A-Za-z_]\w*)\s*=\s*(.*)$", line.strip())
                if not match:
                    continue
                variable_name = match.group(2)
                variable_value = match.group(3).strip()
                variables[variable_name] = variable_value
            if variables:
                return variables
        return {}

    def current_location(self) -> tuple[str, int, str]:
        for _ in range(3):
            output = self.run("frame info")
            text = "\n".join(output)

            location_match = re.search(r" at (.+?):(\d+)(?::\d+)?", text)
            function_match = re.search(r"`([^`]+?)\s+at ", text)

            if location_match:
                file_name = location_match.group(1)
                line = int(location_match.group(2))
                function = function_match.group(1) if function_match else "unknown"
                return file_name, line, function

        return "unknown", -1, "unknown"

    @staticmethod
    def is_exited(lines: Iterable[str]) -> bool:
        text = "\n".join(lines)
        return "exited with status" in text or "Process " in text and " exited" in text

    @staticmethod
    def has_error(lines: Iterable[str]) -> bool:
        return any("error:" in line.lower() for line in lines)

    @staticmethod
    def get_error_message(lines: Iterable[str]) -> str:
        for line in lines:
            if "error:" in line.lower():
                return line.strip()
        return "Unknown LLDB error"

