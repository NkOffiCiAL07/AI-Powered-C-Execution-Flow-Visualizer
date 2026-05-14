from __future__ import annotations

import re
import subprocess
from typing import Iterable


class GdbMIController:
    def __init__(self, executable: str):
        self.executable = executable
        self._process: subprocess.Popen[str] | None = None
        self._token = 1

    def start(self) -> None:
        self._process = subprocess.Popen(
            ["gdb", "--quiet", "--interpreter=mi2", self.executable],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        self._read_until_prompt()

    def close(self) -> None:
        if not self._process:
            return

        try:
            if self._process.poll() is None:
                self.run("-gdb-exit")
        except Exception:
            pass
        finally:
            if self._process.poll() is None:
                self._process.terminate()
            self._process = None

    def run(self, command: str) -> list[str]:
        if not self._process or not self._process.stdin:
            raise RuntimeError("GDB process is not started")

        token = self._token
        self._token += 1
        self._process.stdin.write(f"{token}{command}\n")
        self._process.stdin.flush()
        return self._read_until_prompt()

    def break_main(self) -> list[str]:
        return self.run("-break-insert main")

    def exec_run(self) -> list[str]:
        return self.run("-exec-run")

    def exec_step(self) -> list[str]:
        return self.run("-exec-step")

    def list_locals(self) -> dict[str, str]:
        output = self.run("-stack-list-variables --simple-values")
        text = "\n".join(output)
        return dict(re.findall(r'name="([^"]+)",value="([^"]*)"', text))

    def current_location(self) -> tuple[str, int, str]:
        output = self.run("-stack-info-frame")
        text = "\n".join(output)

        file_match = re.search(r'fullname="([^"]+)"', text) or re.search(
            r'file="([^"]+)"', text
        )
        line_match = re.search(r'line="(\d+)"', text)
        func_match = re.search(r'func="([^"]+)"', text)

        file_name = file_match.group(1) if file_match else "unknown"
        line = int(line_match.group(1)) if line_match else -1
        function = func_match.group(1) if func_match else "unknown"
        return file_name, line, function

    @staticmethod
    def is_exited(lines: Iterable[str]) -> bool:
        text = "\n".join(lines)
        return 'reason="exited-normally"' in text or 'reason="exited"' in text

    @staticmethod
    def has_error(lines: Iterable[str]) -> bool:
        return any(re.match(r"^\d+\^error", line) for line in lines)

    @staticmethod
    def get_error_message(lines: Iterable[str]) -> str:
        for line in lines:
            if re.match(r"^\d+\^error", line):
                msg_match = re.search(r'msg="((?:\\.|[^"])*)"', line)
                if msg_match:
                    return msg_match.group(1).replace('\\"', '"')
                return line
        return "Unknown GDB error"

    def _read_until_prompt(self) -> list[str]:
        if not self._process or not self._process.stdout:
            raise RuntimeError("GDB process is not started")

        lines: list[str] = []
        while True:
            line = self._process.stdout.readline()
            if line == "":
                break
            stripped = line.rstrip("\n")
            if stripped.strip() == "(gdb)":
                break
            if stripped:
                lines.append(stripped)
        return lines
