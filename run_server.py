import sys
import os
import uvicorn

# Add src directory to path so flowviz module can be found
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 8000))
    reload = os.environ.get("RELOAD", "true").lower() == "true"
    uvicorn.run("traceon.server.app:app", host=host, port=port, reload=reload)
