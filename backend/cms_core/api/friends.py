from fastapi import APIRouter, Request
from sqlalchemy import text
from cms_core.db import connection, fetch_all, safe_slug

router = APIRouter()


@router.post("/sync")
async def sync_friends(request: Request):
    try:
        payload = await request.json()
        friends_list = payload.get("friends", [])
        if not isinstance(friends_list, list):
            return {"success": False, "message": "数据格式非法，预期为数组"}
        with connection() as conn:
            conn.execute(text("DELETE FROM friends"))
            for idx, friend in enumerate(friends_list):
                conn.execute(text("""INSERT INTO friends (id, name, url, description, avatar, theme_color, sort_order) VALUES (:id, :name, :url, :description, :avatar, :theme_color, :sort_order)"""), {"id": safe_slug(str(friend.get("id") or f"friend_{idx}")), "name": friend.get("name", ""), "url": friend.get("url", ""), "description": friend.get("description", ""), "avatar": friend.get("avatar", ""), "theme_color": friend.get("themeColor", ""), "sort_order": idx})
        return {"success": True, "message": f"✨ 友链物理文件已更新！共同步 {len(friends_list)} 位好友。"}
    except Exception as e:
        return {"success": False, "message": f"后端同步崩溃: {str(e)}"}


@router.get("/list")
async def list_friends():
    try:
        rows = fetch_all("SELECT id, name, url, description, avatar, theme_color FROM friends ORDER BY sort_order ASC")
        data = [{"id": r["id"], "name": r.get("name") or "", "url": r.get("url") or "", "description": r.get("description") or "", "avatar": r.get("avatar") or "", "themeColor": r.get("theme_color") or ""} for r in rows]
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": f"读取失败: {str(e)}"}
