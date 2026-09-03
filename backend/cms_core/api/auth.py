import base64
import hashlib
import hmac
import logging
import os
import secrets
import time
from datetime import datetime

from fastapi import APIRouter, Request
from pydantic import BaseModel

from cms_core.db import execute, fetch_one

router = APIRouter()
logger = logging.getLogger(__name__)
ITERATIONS = 260000
_failures: dict[str, tuple[int, float]] = {}
LOCK_SECONDS = 300
MAX_FAILURES = 10


class VerifyPayload(BaseModel):
    username: str = "admin"
    password: str


class ChangePasswordPayload(BaseModel):
    username: str
    old_password: str
    new_password: str


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_key(username: str, request: Request) -> str:
    return f"{username}:{_client_ip(request)}"


def _is_locked(key: str) -> bool:
    item = _failures.get(key)
    if not item:
        return False
    count, until = item
    if until and time.time() < until:
        return True
    if until and time.time() >= until:
        _failures.pop(key, None)
    return False


def _record_failure(key: str) -> None:
    count, until = _failures.get(key, (0, 0))
    count += 1
    _failures[key] = (count, time.time() + LOCK_SECONDS if count >= MAX_FAILURES else until)


def _clear_failures(key: str) -> None:
    _failures.pop(key, None)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        ITERATIONS,
        base64.b64encode(salt).decode("ascii"),
        base64.b64encode(digest).decode("ascii"),
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations_raw, salt_b64, hash_b64 = stored_hash.split("$", 3)
        iterations = int(iterations_raw)
        if algorithm != "pbkdf2_sha256" or iterations < 200000:
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def bootstrap_admin_user() -> None:
    row = fetch_one("SELECT COUNT(*) AS count FROM admin_users")
    if row and row["count"]:
        return
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not password:
        logger.warning("admin_users is empty and ADMIN_PASSWORD is not set; login is unavailable")
        return
    execute(
        "INSERT INTO admin_users (username, password_hash) VALUES (:username, :password_hash)",
        username="admin",
        password_hash=hash_password(password),
    )
    logger.warning("ADMIN USER BOOTSTRAPPED: username=admin from ADMIN_PASSWORD")


@router.post("/verify")
async def verify_admin(payload: VerifyPayload, request: Request):
    key = _rate_key(payload.username, request)
    if _is_locked(key):
        return {"success": False, "message": "\u767b\u5f55\u5931\u8d25\u6b21\u6570\u8fc7\u591a\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5"}
    row = fetch_one("SELECT password_hash FROM admin_users WHERE username = :username", username=payload.username)
    ok = bool(row and verify_password(payload.password, row["password_hash"]))
    if not ok:
        _record_failure(key)
        return {"success": False, "message": "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef"}
    _clear_failures(key)
    execute("UPDATE admin_users SET last_login_at = :last_login_at WHERE username = :username", username=payload.username, last_login_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    return {"success": True, "message": "\u767b\u5f55\u6210\u529f"}


@router.post("/change_password")
async def change_password(payload: ChangePasswordPayload, request: Request):
    key = _rate_key(payload.username, request)
    if _is_locked(key):
        return {"success": False, "message": "\u767b\u5f55\u5931\u8d25\u6b21\u6570\u8fc7\u591a\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5"}
    row = fetch_one("SELECT password_hash FROM admin_users WHERE username = :username", username=payload.username)
    if not row or not verify_password(payload.old_password, row["password_hash"]):
        _record_failure(key)
        return {"success": False, "message": "\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef"}
    execute("UPDATE admin_users SET password_hash = :password_hash WHERE username = :username", username=payload.username, password_hash=hash_password(payload.new_password))
    _clear_failures(key)
    return {"success": True, "message": "\u5bc6\u7801\u5df2\u66f4\u65b0"}
