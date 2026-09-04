from fastapi import APIRouter, Request
from sqlalchemy import text
from cms_core.db import connection, database_label, fetch_all, fetch_one, json_param, parse_json_column, safe_slug

router = APIRouter()


@router.post("/sync")
async def sync_gallery(request: Request):
    try:
        payload = await request.json()
        albums_data = payload.get("albums", [])
        if not isinstance(albums_data, list):
            return {"success": False, "message": "数据格式非法，预期为数组"}
        with connection() as conn:
            conn.execute(text("DELETE FROM albums"))
            for idx, album in enumerate(albums_data):
                conn.execute(text("""
                    INSERT INTO albums (id, title, description, cover, album_date, photos, sort_order)
                    VALUES (:id, :title, :description, :cover, :album_date, :photos, :sort_order)
                """), {"id": safe_slug(str(album.get("id") or f"album_{idx}")), "title": album.get("title", ""), "description": album.get("description", ""), "cover": album.get("cover", ""), "album_date": album.get("date", ""), "photos": json_param(album.get("photos", [])), "sort_order": idx})
        return {"success": True, "message": f"\U0001f4f8 画廊物理文件已更新！已同步 {len(albums_data)} 个相册。"}
    except Exception as e:
        return {"success": False, "message": f"同步失败: {str(e)}"}


@router.get("/list")
async def list_gallery():
    try:
        rows = fetch_all("SELECT id, title, description, cover, album_date, photos FROM albums ORDER BY sort_order ASC")
        data = [{"id": r["id"], "title": r.get("title") or "", "description": r.get("description") or "", "cover": r.get("cover") or "", "date": r.get("album_date") or "", "photos": parse_json_column(r.get("photos"), [])} for r in rows]
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": f"读取失败: {str(e)}"}


@router.get("/debug_path")
async def debug_path():
    count = fetch_one("SELECT COUNT(*) AS count FROM albums") or {"count": 0}
    return {"database": database_label(), "table": "albums", "row_count": count["count"]}
