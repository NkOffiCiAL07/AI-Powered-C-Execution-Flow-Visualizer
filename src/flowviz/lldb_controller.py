from __future__ import annotations

import re
import time
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
        self._process.sendline("settings set auto-confirm true")
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

        self._drain_pending_output()
        self._process.sendline(command)
        self._process.expect_exact("(lldb)")
        output = self._process.before or ""
        lines: list[str] = []
        for line in output.splitlines():
            cleaned = ANSI_ESCAPE_RE.sub("", line).replace("\r", "").strip()
            if cleaned:
                if cleaned == command:
                    continue
                if cleaned.startswith("(lldb)"):
                    continue
                lines.append(cleaned)
        return lines

    def break_main(self) -> list[str]:
        return self.run("breakpoint set --name main")

    def exec_run(self, stdin_path: str | None = None) -> list[str]:
        if stdin_path:
            escaped_path = stdin_path.replace("\\", "\\\\").replace('"', '\\"')
            return self.run(f'process launch --stdin "{escaped_path}"')
        return self.run("run")

    def exec_step(self) -> list[str]:
        return self.run("thread step-over")

    def exec_step_in(self) -> list[str]:
        return self.run("thread step-in")

    def exec_step_out(self) -> list[str]:
        return self.run("thread step-out")

    def exec_continue(self) -> list[str]:
        return self.run("continue")

    def kill(self) -> list[str]:
        return self.run("process kill")

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

    def call_stack(self) -> list[tuple[int, str, str, int]]:
        output = self.run("thread backtrace")
        frames: list[tuple[int, str, str, int]] = []
        for line in output:
            match = re.search(
                r"frame\s+#(\d+):\s+.*?`([^`]+)(?:\s+at\s+(.+?):(\d+)(?::\d+)?)?\s*$",
                line,
            )
            if not match:
                continue

            frame_index = int(match.group(1))
            function_name = match.group(2).strip()
            frame_file = match.group(3) or "unknown"
            frame_line = int(match.group(4)) if match.group(4) else -1
            frames.append((frame_index, function_name, frame_file, frame_line))
        return frames

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

    def _drain_pending_output(self) -> None:
        if not self._process:
            return

        for _ in range(5):
            try:
                pending = self._process.read_nonblocking(size=4096, timeout=0.02)
            except pexpect.TIMEOUT:
                break
            except pexpect.EOF:
                break
            if not pending:
                break
            time.sleep(0.01)

