import json
import os
import time
from contextlib import contextmanager
from typing import Any
from urllib.parse import quote_plus

from sqlalchemy import create_engine, text
from sqlalchemy.engine import RowMapping


def _database_url() -> str:
    direct = os.environ.get("DATABASE_URL")
    if direct:
        return direct
    host = os.environ.get("MYSQL_HOST", "mysql")
    port = os.environ.get("MYSQL_PORT", "3306")
    database = os.environ.get("MYSQL_DATABASE", "xhblogs")
    user = quote_plus(os.environ.get("MYSQL_USER", "root"))
    password = quote_plus(os.environ.get("MYSQL_PASSWORD", ""))
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


DATABASE_URL = _database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600, future=True)


@contextmanager
def connection():
    with engine.begin() as conn:
        yield conn


def _row_to_dict(row: RowMapping | None) -> dict | None:
    return None if row is None else dict(row)


def fetch_all(sql: str, **params) -> list[dict]:
    with engine.connect() as conn:
        return [dict(row) for row in conn.execute(text(sql), params).mappings().all()]


def fetch_one(sql: str, **params) -> dict | None:
    with engine.connect() as conn:
        return _row_to_dict(conn.execute(text(sql), params).mappings().first())


def execute(sql: str, **params) -> int:
    with connection() as conn:
        return conn.execute(text(sql), params).rowcount


def wait_for_db(timeout: int = 60) -> None:
    deadline = time.monotonic() + timeout
    last_error: Exception | None = None
    while time.monotonic() < deadline:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return
        except Exception as exc:
            last_error = exc
            time.sleep(2)
    raise RuntimeError(f"Database did not become ready within {timeout}s: {last_error}")


def parse_json_column(value: Any, default: Any):
    if value is None:
        return default
    if isinstance(value, (dict, list, int, float, bool)):
        return value
    if isinstance(value, (bytes, bytearray)):
        value = value.decode("utf-8")
    if isinstance(value, str):
        if value == "":
            return default
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return default
    return default


def json_param(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def safe_slug(value: str) -> str:
    value = (value or "").replace(".md", "").replace(".json", "")
    if any(part in value for part in ("/", "\\", "..")):
        raise ValueError("\u975e\u6cd5\u6807\u8bc6")
    return value


def database_label() -> str:
    if os.environ.get("DATABASE_URL"):
        return "DATABASE_URL"
    return f"{os.environ.get('MYSQL_HOST', 'mysql')}:{os.environ.get('MYSQL_PORT', '3306')}/{os.environ.get('MYSQL_DATABASE', 'xhblogs')}"
