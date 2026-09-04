from fastapi import APIRouter, Request
from sqlalchemy import text
from cms_core.db import connection, fetch_all, json_param, parse_json_column, safe_slug

router = APIRouter()


def _fetch_categories():
    rows = fetch_all("SELECT id, name FROM project_categories ORDER BY sort_order ASC, id ASC")
    return [{"id": r["id"], "name": r.get("name") or ""} for r in rows]


@router.post("/sync")
async def sync_projects(request: Request):
    try:
        payload = await request.json()
        projects_list = payload.get("projects", [])
        if not isinstance(projects_list, list):
            return {"success": False, "message": "数据格式非法，预期为数组"}
        categories_list = payload.get("categories")
        print("Writing projects to MySQL")
        with connection() as conn:
            # categories 缺省时保持原有分类不动，只覆盖项目本体
            if isinstance(categories_list, list):
                conn.execute(text("DELETE FROM project_categories"))
                for idx, category in enumerate(categories_list):
                    conn.execute(text("""INSERT INTO project_categories (id, name, sort_order) VALUES (:id, :name, :sort_order)"""), {"id": safe_slug(str(category.get("id") or f"category_{idx}")), "name": (category.get("name") or "").strip(), "sort_order": idx})
            conn.execute(text("DELETE FROM projects"))
            for idx, project in enumerate(projects_list):
                conn.execute(text("""INSERT INTO projects (id, name, description, icon, category, github_url, tags, sort_order) VALUES (:id, :name, :description, :icon, :category, :github_url, :tags, :sort_order)"""), {"id": safe_slug(str(project.get("id") or f"project_{idx}")), "name": project.get("name", ""), "description": project.get("description", ""), "icon": project.get("icon", ""), "category": project.get("category") or "", "github_url": project.get("githubUrl", ""), "tags": json_param(project.get("tags", [])), "sort_order": idx})
        print("Projects saved to MySQL")
        return {"success": True, "message": "写入成功"}
    except Exception as e:
        print(f"Project write failed: {str(e)}")
        return {"success": False, "message": str(e)}


@router.get("/list")
async def list_projects():
    try:
        rows = fetch_all("SELECT id, name, description, icon, category, github_url, tags FROM projects ORDER BY sort_order ASC")
        data = [{"id": r["id"], "name": r.get("name") or "", "description": r.get("description") or "", "icon": r.get("icon") or "", "category": r.get("category") or "", "githubUrl": r.get("github_url") or "", "tags": parse_json_column(r.get("tags"), [])} for r in rows]
        return {"success": True, "data": data, "categories": _fetch_categories()}
    except Exception as e:
        return {"success": False, "message": f"读取失败: {str(e)}"}
