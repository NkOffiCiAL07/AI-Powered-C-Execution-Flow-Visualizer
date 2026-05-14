from __future__ import annotations

import os
import importlib
import logging
from datetime import datetime, timezone
from typing import Any

from traceon.server.models import LiveExecutionStateDTO, SessionStatus

logger = logging.getLogger(__name__)


class MongoExecutionStore:
    def __init__(self) -> None:
        self._collection = None
        self._enabled = False

        mongo_uri = os.getenv("MONGO_CONNECTION_STRING") or os.getenv("MONGO_URI")
        if not mongo_uri:
            logger.info("MongoDB persistence is disabled (no connection string provided)")
            return

        try:
            pymongo = importlib.import_module("pymongo")
            MongoClient = getattr(pymongo, "MongoClient")

            db_name = os.getenv("MONGO_DB_NAME", "traceon")
            collection_name = os.getenv("MONGO_COLLECTION_NAME", "execution_sessions")
            
            logger.info(f"Connecting to MongoDB at {db_name}.{collection_name}...")
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
            self._collection = client[db_name][collection_name]
            client.admin.command("ping")
            self._enabled = True
            logger.info("Successfully connected to MongoDB")
        except Exception as e:
            logger.warning(f"Failed to enable MongoDB persistence: {e}")
            self._collection = None
            self._enabled = False

    @property
    def enabled(self) -> bool:
        return self._enabled and self._collection is not None

    def create_session(self, session_id: str, code: str, stdin: str) -> None:
        if not self.enabled:
            return

        self._collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "session_id": session_id,
                    "code": code,
                    "stdin": stdin,
                    "status": SessionStatus.CREATED.value,
                    "cursor": -1,
                    "total_recorded_steps": 0,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$setOnInsert": {
                    "created_at": datetime.now(timezone.utc),
                    "snapshots": [],
                },
            },
            upsert=True,
        )

    def append_snapshot(
        self,
        session_id: str,
        snapshot: LiveExecutionStateDTO,
        status: SessionStatus,
        cursor: int,
        total_recorded_steps: int,
    ) -> None:
        if not self.enabled:
            return

        payload: dict[str, Any] = snapshot.model_dump(mode="json")
        self._collection.update_one(
            {"session_id": session_id},
            {
                "$push": {"snapshots": payload},
                "$set": {
                    "status": status.value,
                    "cursor": cursor,
                    "total_recorded_steps": total_recorded_steps,
                    "updated_at": datetime.now(timezone.utc),
                },
            },
            upsert=True,
        )

    def update_cursor(self, session_id: str, status: SessionStatus, cursor: int, total_recorded_steps: int) -> None:
        if not self.enabled:
            return

        self._collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": status.value,
                    "cursor": cursor,
                    "total_recorded_steps": total_recorded_steps,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )
