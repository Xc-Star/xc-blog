import os
from fastapi import APIRouter, Body
import httpx
from cms_core.db import fetch_one

router = APIRouter()


@router.post("/check")
async def check_blog_path(payload: dict | None = Body(default=None)):
    try:
        count_queries = {
            "site_config": "SELECT COUNT(*) AS count FROM site_config",
            "documents": "SELECT COUNT(*) AS count FROM documents",
            "moments": "SELECT COUNT(*) AS count FROM moments",
            "pages": "SELECT COUNT(*) AS count FROM pages",
            "drafts": "SELECT COUNT(*) AS count FROM drafts",
            "albums": "SELECT COUNT(*) AS count FROM albums",
            "friends": "SELECT COUNT(*) AS count FROM friends",
            "projects": "SELECT COUNT(*) AS count FROM projects",
            "admin_users": "SELECT COUNT(*) AS count FROM admin_users",
        }
        counts = {}
        for table, sql in count_queries.items():
            row = fetch_one(sql)
            counts[table] = row["count"] if row else 0
        return {"success": True, "message": "\u2705 \u6570\u636e\u5e93\u5df2\u5c31\u7eea\u3002", "counts": counts}
    except Exception as e:
        return {"success": False, "message": f"\u6570\u636e\u5e93\u68c0\u6d4b\u5931\u8d25: {str(e)}"}


@router.post("/execute")
async def execute_sync(payload: dict | None = Body(default=None)):
    url = os.environ.get("BLOG_REVALIDATE_URL", "http://blog:3000/api/revalidate")
    token = os.environ.get("REVALIDATE_TOKEN", "")
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(url, headers={"X-Revalidate-Token": token})
            response.raise_for_status()
        return {"success": True, "message": "\U0001f389 \u5185\u5bb9\u5df2\u53d1\u5e03\uff0c\u535a\u5ba2\u7f13\u5b58\u5df2\u5237\u65b0\u3002"}
    except Exception:
        return {"success": True, "message": "\u2705 \u5185\u5bb9\u5df2\u4fdd\u5b58\u5230\u6570\u636e\u5e93\uff1b\u535a\u5ba2\u6682\u65f6\u65e0\u6cd5\u5237\u65b0\u7f13\u5b58\uff0c\u5c06\u5728\u4e0b\u6b21\u8bf7\u6c42\u65f6\u81ea\u52a8\u8bfb\u53d6\u6700\u65b0\u5185\u5bb9\u3002"}
