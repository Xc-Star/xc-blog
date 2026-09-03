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
            return {"success": False, "message": "\u6570\u636e\u683c\u5f0f\u975e\u6cd5\uff0c\u9884\u671f\u4e3a\u6570\u7ec4"}
        with connection() as conn:
            conn.execute(text("DELETE FROM friends"))
            for idx, friend in enumerate(friends_list):
                conn.execute(text("""INSERT INTO friends (id, name, url, description, avatar, theme_color, sort_order) VALUES (:id, :name, :url, :description, :avatar, :theme_color, :sort_order)"""), {"id": safe_slug(str(friend.get("id") or f"friend_{idx}")), "name": friend.get("name", ""), "url": friend.get("url", ""), "description": friend.get("description", ""), "avatar": friend.get("avatar", ""), "theme_color": friend.get("themeColor", ""), "sort_order": idx})
        return {"success": True, "message": f"\u2728 \u53cb\u94fe\u7269\u7406\u6587\u4ef6\u5df2\u66f4\u65b0\uff01\u5171\u540c\u6b65 {len(friends_list)} \u4f4d\u597d\u53cb\u3002"}
    except Exception as e:
        return {"success": False, "message": f"\u540e\u7aef\u540c\u6b65\u5d29\u6e83: {str(e)}"}


@router.get("/list")
async def list_friends():
    try:
        rows = fetch_all("SELECT id, name, url, description, avatar, theme_color FROM friends ORDER BY sort_order ASC")
        data = [{"id": r["id"], "name": r.get("name") or "", "url": r.get("url") or "", "description": r.get("description") or "", "avatar": r.get("avatar") or "", "themeColor": r.get("theme_color") or ""} for r in rows]
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": f"\u8bfb\u53d6\u5931\u8d25: {str(e)}"}
