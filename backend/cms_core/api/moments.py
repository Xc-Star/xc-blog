from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from cms_core.db import execute, fetch_all, json_param, parse_json_column, safe_slug

router = APIRouter()


class MomentPayload(BaseModel):
    id: str
    date: str
    content: str
    location: Optional[str] = ""
    images: List[str] = []


class DeletePayload(BaseModel):
    id: str


def _format_datetime(value) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return str(value)


@router.post("/save")
def save_moment(payload: MomentPayload):
    try:
        moment_id = safe_slug(payload.id)
        execute(
            """
            INSERT INTO moments (id, content, location, images, published_at)
            VALUES (:id, :content, :location, :images, :published_at)
            ON DUPLICATE KEY UPDATE
              content = VALUES(content), location = VALUES(location), images = VALUES(images), published_at = VALUES(published_at)
            """,
            id=moment_id,
            content=payload.content,
            location=payload.location,
            images=json_param(payload.images),
            published_at=payload.date or None,
        )
        print(f"\n[\u6210\u529f] \u8bf4\u8bf4\u5df2\u5199\u5165\u6570\u636e\u5e93\uff1a{moment_id}\n")
        return {"success": True, "message": f"✅ 说说已保存：{moment_id}"}
    except Exception as e:
        print(f"\n[\u62a5\u9519] \u5199\u5165\u5931\u8d25\uff1a{str(e)}\n")
        return {"success": False, "message": f"写入数据库失败: {str(e)}"}


@router.post("/delete")
def delete_moment(payload: DeletePayload):
    try:
        moment_id = safe_slug(payload.id)
        deleted = execute("DELETE FROM moments WHERE id = :id", id=moment_id)
        if deleted:
            print(f"\n[\u5220\u9664\u6210\u529f] \u6570\u636e\u5e93\u8bb0\u5f55\u5df2\u5220\u9664\uff1a{moment_id}\n")
            return {"success": True, "message": "说说已删除"}
        return {"success": False, "message": "该说说不存在，无法删除"}
    except Exception as e:
        print(f"\n[\u5220\u9664\u62a5\u9519] {str(e)}\n")
        return {"success": False, "message": f"删除失败: {str(e)}"}


@router.get("/list")
def list_moments():
    rows = fetch_all("SELECT id, content, location, images, published_at FROM moments ORDER BY published_at DESC, created_at DESC")
    moments = []
    for row in rows:
        moments.append({
            "id": row.get("id", ""),
            "date": _format_datetime(row.get("published_at")),
            "location": row.get("location") or "",
            "images": parse_json_column(row.get("images"), []),
            "content": row.get("content") or "",
        })
    return {"success": True, "moments": moments}
