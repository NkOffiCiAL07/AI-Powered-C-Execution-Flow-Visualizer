# Start Traceon Dev Environment

Run the following to start both servers for the Traceon project:

```bash
cd /Users/nkofficial07/Desktop/Projects/AI-Powered-C-Execution-Flow-Visualizer

# Kill any stale processes first
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start backend
./venv/bin/python run_server.py &

# Wait then start frontend
sleep 2 && cd frontend && npm start
```

Backend runs on http://localhost:8000
Frontend runs on http://localhost:3000

## Quick health check
```bash
curl -s http://localhost:8000/health
```

## Stop everything
```bash
lsof -ti :8000 :3000 | xargs kill -9 2>/dev/null
```
