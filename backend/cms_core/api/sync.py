from fastapi import APIRouter, Body
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
        return {"success": True, "message": "✅ 数据库已就绪。", "counts": counts}
    except Exception as e:
        return {"success": False, "message": f"数据库检测失败: {str(e)}"}
