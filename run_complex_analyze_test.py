import json
import urllib.error
import urllib.request
from pathlib import Path

code = Path("complex_test.cpp").read_text(encoding="utf-8")
request = urllib.request.Request(
    "http://127.0.0.1:8000/analyze",
    data=json.dumps({"code": code}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)

try:
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
except urllib.error.HTTPError as error:
    print("HTTP_ERROR", error.code)
    print(error.read().decode("utf-8", errors="ignore"))
    raise SystemExit(1)
except Exception as error:
    print("ERROR", repr(error))
    raise SystemExit(1)

snapshots = payload.get("snapshots", [])
print("SNAPSHOT_COUNT", len(snapshots))
if not snapshots:
    raise SystemExit(0)

print("FIRST_LINE", snapshots[0]["location"]["line"])
print("LAST_LINE", snapshots[-1]["location"]["line"])
print("FIRST_FUNCTION", snapshots[0]["location"]["function"])
print("LAST_FUNCTION", snapshots[-1]["location"]["function"])
print("LAST_VARIABLES", json.dumps(snapshots[-1].get("variables", {}), sort_keys=True))
print("TAIL_LINES", [snapshot["location"]["line"] for snapshot in snapshots[-10:]])
