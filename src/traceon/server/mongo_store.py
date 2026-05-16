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
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
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


# ── User / Project / File store (P4) ────────────────────────────────────────

class MongoAppStore:
    """Manages users, projects, and files in separate MongoDB collections."""

    def __init__(self) -> None:
        self._db = None
        self._enabled = False
        self._ObjId = None

        mongo_uri = os.getenv("MONGO_CONNECTION_STRING") or os.getenv("MONGO_URI")
        if not mongo_uri:
            logger.info("MongoAppStore disabled (no connection string)")
            return

        try:
            pymongo = importlib.import_module("pymongo")
            bson = importlib.import_module("bson")
            MongoClient = getattr(pymongo, "MongoClient")
            self._ObjId = getattr(bson, "ObjectId")

            db_name = os.getenv("MONGO_DB_NAME", "traceon")
            client = MongoClient(mongo_uri, serverSelectionTimeoutMS=8000)
            client.admin.command("ping")
            self._db = client[db_name]
            self._enabled = True
            self._ensure_indexes()
            logger.info("MongoAppStore connected to %s", db_name)
        except Exception as exc:
            logger.warning("MongoAppStore init failed: %s", exc)

    @property
    def enabled(self) -> bool:
        return self._enabled and self._db is not None

    def _ensure_indexes(self) -> None:
        self._db.users.create_index("google_id", unique=True)
        self._db.projects.create_index("owner_id")
        self._db.files.create_index("project_id")

    # ── Users ────────────────────────────────────────────────────────────────

    def upsert_user(self, google_id: str, email: str, name: str, avatar_url: str) -> str:
        """Upsert user by google_id; return MongoDB _id as string."""
        if not self.enabled:
            return google_id  # graceful fallback: use google_id when DB is off

        result = self._db.users.find_one_and_update(
            {"google_id": google_id},
            {
                "$set": {
                    "email": email,
                    "name": name,
                    "avatar_url": avatar_url,
                    "updated_at": datetime.now(timezone.utc),
                },
                "$setOnInsert": {
                    "google_id": google_id,
                    "role": "member",
                    "created_at": datetime.now(timezone.utc),
                },
            },
            upsert=True,
            return_document=True,  # ReturnDocument.AFTER = True
        )
        return str(result["_id"])

    # ── Projects ─────────────────────────────────────────────────────────────

    def count_projects(self, owner_id: str) -> int:
        if not self.enabled:
            return 0
        return self._db.projects.count_documents({"owner_id": owner_id})

    def list_projects(self, owner_id: str) -> list[dict]:
        if not self.enabled:
            return []
        docs = self._db.projects.find({"owner_id": owner_id}).sort("last_accessed", -1)
        return [self._project_out(d) for d in docs]

    def get_project(self, project_id: str) -> dict | None:
        if not self.enabled:
            return None
        try:
            doc = self._db.projects.find_one({"_id": self._ObjId(project_id)})
        except Exception:
            return None
        return self._project_out(doc) if doc else None

    def create_project(self, owner_id: str, name: str, language: str) -> str:
        now = datetime.now(timezone.utc)
        result = self._db.projects.insert_one({
            "owner_id": owner_id,
            "name": name.strip(),
            "language": language,
            "created_at": now,
            "last_accessed": now,
        })
        return str(result.inserted_id)

    def touch_project(self, project_id: str) -> None:
        if not self.enabled:
            return
        try:
            self._db.projects.update_one(
                {"_id": self._ObjId(project_id)},
                {"$set": {"last_accessed": datetime.now(timezone.utc)}},
            )
        except Exception:
            pass

    def delete_project(self, owner_id: str, project_id: str) -> bool:
        if not self.enabled:
            return False
        try:
            res = self._db.projects.delete_one(
                {"_id": self._ObjId(project_id), "owner_id": owner_id}
            )
            if res.deleted_count:
                self._db.files.delete_many({"project_id": project_id})
                return True
        except Exception:
            pass
        return False

    # ── Files ─────────────────────────────────────────────────────────────────

    def count_files(self, project_id: str) -> int:
        if not self.enabled:
            return 0
        return self._db.files.count_documents({"project_id": project_id})

    def list_files(self, project_id: str) -> list[dict]:
        if not self.enabled:
            return []
        docs = self._db.files.find({"project_id": project_id})
        return [self._file_out(d) for d in docs]

    def get_file(self, project_id: str, file_id: str) -> dict | None:
        if not self.enabled:
            return None
        try:
            doc = self._db.files.find_one(
                {"_id": self._ObjId(file_id), "project_id": project_id}
            )
        except Exception:
            return None
        return self._file_out(doc) if doc else None

    def upsert_file(
        self,
        project_id: str,
        file_id: str | None,
        name: str,
        language: str,
        code: str,
    ) -> str:
        now = datetime.now(timezone.utc)
        if file_id:
            try:
                self._db.files.update_one(
                    {"_id": self._ObjId(file_id), "project_id": project_id},
                    {"$set": {"name": name, "language": language, "code": code, "updated_at": now}},
                    upsert=True,
                )
                return file_id
            except Exception:
                pass
        result = self._db.files.insert_one({
            "project_id": project_id,
            "name": name.strip(),
            "language": language,
            "code": code,
            "updated_at": now,
        })
        return str(result.inserted_id)

    def delete_file(self, project_id: str, file_id: str) -> bool:
        if not self.enabled:
            return False
        try:
            res = self._db.files.delete_one(
                {"_id": self._ObjId(file_id), "project_id": project_id}
            )
            return bool(res.deleted_count)
        except Exception:
            return False

    # ── Serialisers ───────────────────────────────────────────────────────────

    def _project_out(self, doc: dict) -> dict:
        now = datetime.now(timezone.utc)
        return {
            "id": str(doc["_id"]),
            "owner_id": doc.get("owner_id", ""),
            "name": doc.get("name", ""),
            "language": doc.get("language", "cpp"),
            "created_at": doc.get("created_at", now).isoformat(),
            "last_accessed": doc.get("last_accessed", now).isoformat(),
        }

    def _file_out(self, doc: dict) -> dict:
        now = datetime.now(timezone.utc)
        return {
            "id": str(doc["_id"]),
            "project_id": doc.get("project_id", ""),
            "name": doc.get("name", ""),
            "language": doc.get("language", "cpp"),
            "code": doc.get("code", ""),
            "updated_at": doc.get("updated_at", now).isoformat(),
        }


# Module-level singleton used by auth.py and app.py
mongo_app_store = MongoAppStore()
