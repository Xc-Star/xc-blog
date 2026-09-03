from fastapi import APIRouter, Request
from sqlalchemy import text
from cms_core.db import connection, fetch_all, json_param, parse_json_column, safe_slug

router = APIRouter()


@router.post("/sync")
async def sync_projects(request: Request):
    try:
        payload = await request.json()
        projects_list = payload.get("projects", [])
        if not isinstance(projects_list, list):
            return {"success": False, "message": "\u6570\u636e\u683c\u5f0f\u975e\u6cd5\uff0c\u9884\u671f\u4e3a\u6570\u7ec4"}
        print("Writing projects to MySQL")
        with connection() as conn:
            conn.execute(text("DELETE FROM projects"))
            for idx, project in enumerate(projects_list):
                conn.execute(text("""INSERT INTO projects (id, name, description, icon, github_url, tags, sort_order) VALUES (:id, :name, :description, :icon, :github_url, :tags, :sort_order)"""), {"id": safe_slug(str(project.get("id") or f"project_{idx}")), "name": project.get("name", ""), "description": project.get("description", ""), "icon": project.get("icon", ""), "github_url": project.get("githubUrl", ""), "tags": json_param(project.get("tags", [])), "sort_order": idx})
        print("Projects saved to MySQL")
        return {"success": True, "message": "\u5199\u5165\u6210\u529f"}
    except Exception as e:
        print(f"Project write failed: {str(e)}")
        return {"success": False, "message": str(e)}


@router.get("/list")
async def list_projects():
    try:
        rows = fetch_all("SELECT id, name, description, icon, github_url, tags FROM projects ORDER BY sort_order ASC")
        data = [{"id": r["id"], "name": r.get("name") or "", "description": r.get("description") or "", "icon": r.get("icon") or "", "githubUrl": r.get("github_url") or "", "tags": parse_json_column(r.get("tags"), [])} for r in rows]
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": f"\u8bfb\u53d6\u5931\u8d25: {str(e)}"}
