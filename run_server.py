import sys
import os
import uvicorn

# Add src directory to path so flowviz module can be found
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

if __name__ == "__main__":
    uvicorn.run("flowviz.server.app:app", host="127.0.0.1", port=8000, reload=True)
