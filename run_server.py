import sys
import os
import logging
import logging.handlers
import uvicorn
from pathlib import Path

# Add src directory to path so flowviz module can be found
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


def setup_logging() -> None:
    logs_dir = Path(__file__).parent / "logs"
    logs_dir.mkdir(exist_ok=True)

    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(fmt, datefmt))

    file_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "traceon.log",
        maxBytes=10_000_000,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(logging.Formatter(fmt, datefmt))

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(console_handler)
    root.addHandler(file_handler)

    # Silence noisy third-party loggers
    for noisy in ("httpx", "httpcore", "pymongo", "google"):
        logging.getLogger(noisy).setLevel(logging.WARNING)


if __name__ == "__main__":
    setup_logging()
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 8000))
    reload = os.environ.get("RELOAD", "true").lower() == "true"
    uvicorn.run("traceon.server.app:app", host=host, port=port, reload=reload)
