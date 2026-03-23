from __future__ import annotations

from fastapi import FastAPI

from flowviz.server.api import router as sessions_router


def create_app() -> FastAPI:
    app = FastAPI(title="FlowViz Debug Server", version="0.1.0")

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(sessions_router)
    return app


app = create_app()
