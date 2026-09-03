import json
import re
import time
from datetime import datetime

import markdown
import yaml
from fastapi import APIRouter, Request
from markdownify import markdownify as md

from cms_core.db import connection, execute, fetch_all, fetch_one, json_param, parse_json_column, safe_slug
from sqlalchemy import text

router = APIRouter()


def _format_datetime(value) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return str(value)


def _draft_to_api(row: dict, include_content: bool = True) -> dict:
    data = {
        "id": row.get("id", ""),
        "type": row.get("doc_type", "post"),
        "title": row.get("title", "") or "",
        "description": row.get("description", "") or "",
        "cover": row.get("cover", "") or "",
        "tags": parse_json_column(row.get("tags"), []),
        "mood": row.get("mood", "") or "",
        "date": row.get("doc_date", "") or "",
        "lastModified": row.get("last_modified", 0) or 0,
    }
    content = row.get("content", "") or ""
    if include_content:
        data["content"] = content
    else:
        data["contentPreview"] = content[:100] if content else ""
    return data


@router.post("/save")
async def save_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "\u540e\u7aef\u65e0\u6cd5\u89e3\u6790\u4f20\u6765\u7684 JSON \u6570\u636e"}
    draft_id = payload.get("id")
    if not draft_id or draft_id == "new":
        draft_id = f"draft_{int(time.time() * 1000)}"
    elif payload.get("type") == "about":
        draft_id = "about"
    try:
        draft_id = safe_slug(str(draft_id))
        execute(
            """
            INSERT INTO drafts (id, doc_type, title, description, cover, mood, tags, content, doc_date, last_modified)
            VALUES (:id, :doc_type, :title, :description, :cover, :mood, :tags, :content, :doc_date, :last_modified)
            ON DUPLICATE KEY UPDATE
              doc_type=VALUES(doc_type), title=VALUES(title), description=VALUES(description), cover=VALUES(cover),
              mood=VALUES(mood), tags=VALUES(tags), content=VALUES(content), doc_date=VALUES(doc_date), last_modified=VALUES(last_modified)
            """,

            id=draft_id,
            doc_type=payload.get("type", "post"),
            title=payload.get("title", ""),
            description=payload.get("description", ""),
            cover=payload.get("cover", ""),
            mood=payload.get("mood", ""),
            tags=json_param(payload.get("tags", [])),
            content=payload.get("content", ""),
            doc_date=payload.get("date", ""),
            last_modified=int(time.time() * 1000),
        )
        return {"success": True, "message": "\u8349\u7a3f\u5df2\u5b89\u5168\u843d\u76d8", "id": draft_id}
    except Exception as e:
        return {"success": False, "message": f"\u8349\u7a3f\u4fdd\u5b58\u5931\u8d25: {str(e)}"}


@router.post("/list")
async def list_drafts(request: Request):
    rows = fetch_all("SELECT * FROM drafts ORDER BY last_modified DESC")
    return {"success": True, "drafts": [_draft_to_api(row, include_content=False) for row in rows]}


@router.post("/get")
async def get_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON \u89e3\u6790\u5931\u8d25"}
    try:
        raw_id = safe_slug(payload.get("id", ""))
    except Exception as e:
        return {"success": False, "message": f"\u975e\u6cd5\u6587\u4ef6\u8def\u5f84: {str(e)}"}
    doc_type = payload.get("type", "post")

    row = fetch_one("SELECT * FROM drafts WHERE id = :id", id=raw_id)
    if row:
        return {"success": True, "draft": _draft_to_api(row, include_content=True)}

    if raw_id == "about" or doc_type == "about":
        page = fetch_one("SELECT slug, title, cover, content FROM pages WHERE slug = 'about'")
        if page:
            html_content = markdown.markdown(page.get("content") or "", extensions=["fenced_code", "tables", "nl2br"])
            return {"success": True, "draft": {
                "id": "about", "type": "about", "title": page.get("title") or "\u5173\u4e8e\u6211", "content": html_content,
                "tags": [], "cover": page.get("cover") or "", "description": "", "mood": "", "date": ""
            }}
    else:
        doc = fetch_one(
            "SELECT slug, doc_type, title, description, cover, mood, tags, content, published_at FROM documents WHERE slug=:slug AND doc_type=:doc_type",
            slug=raw_id,
            doc_type="post" if doc_type == "post" else "chatter",
        )
        if doc:
            html_content = markdown.markdown(doc.get("content") or "", extensions=["fenced_code", "tables", "nl2br"])
            return {"success": True, "draft": {
                "id": raw_id,
                "type": doc.get("doc_type") or doc_type,
                "title": doc.get("title") or "",
                "content": html_content,
                "tags": parse_json_column(doc.get("tags"), []),
                "cover": doc.get("cover") or "",
                "description": doc.get("description") or "",
                "mood": doc.get("mood") or "",
                "date": _format_datetime(doc.get("published_at")),
            }}
    return {"success": False, "message": "\u672a\u627e\u5230\u76f8\u5173\u6587\u4ef6"}


@router.post("/delete")
async def delete_draft(request: Request):
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON \u89e3\u6790\u5931\u8d25"}
    try:
        raw_id = safe_slug(payload.get("id", ""))
    except Exception as e:
        return {"success": False, "message": f"\u975e\u6cd5\u6587\u4ef6\u8def\u5f84: {str(e)}"}
    deleted = 0
    with connection() as conn:
        deleted += conn.execute(text("DELETE FROM drafts WHERE id=:id"), {"id": raw_id}).rowcount
        deleted += conn.execute(text("DELETE FROM documents WHERE slug=:slug"), {"slug": raw_id}).rowcount
    if deleted > 0:
        return {"success": True, "message": "\u5df2\u5f7b\u5e95\u9500\u6bc1\u76f8\u5173\u6587\u4ef6"}
    return {"success": False, "message": "\u672a\u627e\u5230\u76f8\u5173\u6587\u4ef6"}


@router.post("/sync_local")
async def sync_local_operations(request: Request):
    payload = await request.json()
    operations = payload.get("operations", [])
    results = []
    for op in operations:
        if op.get("type") != "publish_article":
            continue
        data = op.get("value", {})
        doc_type = data.get("type", "post")
        doc_id = data.get("id", "")
        final_id = doc_id if doc_id and doc_id != "new" else f"{doc_type}_{int(time.time())}"
        try:
            final_id = safe_slug(final_id)
        except Exception as e:
            results.append(f"\u274c \u53d1\u5e03\u5931\u8d25: {str(e)}")
            continue
        raw_html = data.get("content", "")
        raw_html = re.sub(r"<p>&#12288;</p>", "<br><br>", raw_html)
        raw_html = re.sub(r"<p></p>", "<br><br>", raw_html)
        md_content = md(raw_html, heading_style="ATX", keep=["img", "br"])
        md_content = re.sub(r"<br\s*/?>", "\n\n", md_content)
        input_date = str(data.get("date", "")).strip()
        if input_date:
            final_date = f"{input_date} {datetime.now().strftime('%H:%M:%S')}" if len(input_date) <= 10 else input_date
        else:
            final_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if doc_type == "about":
            execute(
                """
                INSERT INTO pages (slug, title, cover, content)
                VALUES ('about', :title, :cover, :content)
                ON DUPLICATE KEY UPDATE title=VALUES(title), cover=VALUES(cover), content=VALUES(content)
                """,
                title=data.get("title", ""), cover=data.get("cover", ""), content=md_content,
            )
        else:
            execute(
                """
                INSERT INTO documents (slug, doc_type, title, description, cover, mood, tags, content, published_at)
                VALUES (:slug, :doc_type, :title, :description, :cover, :mood, :tags, :content, :published_at)
                ON DUPLICATE KEY UPDATE
                  title=VALUES(title), description=VALUES(description), cover=VALUES(cover), mood=VALUES(mood),
                  tags=VALUES(tags), content=VALUES(content), published_at=VALUES(published_at)
                """,
                slug=final_id,
                doc_type="post" if doc_type == "post" else "chatter",
                title=data.get("title", ""),
                description=data.get("description", ""),
                cover=data.get("cover", ""),
                mood=data.get("mood", ""),
                tags=json_param(data.get("tags", [])),
                content=md_content,
                published_at=final_date,
            )
        if doc_id:
            try:
                execute("DELETE FROM drafts WHERE id=:id", id=safe_slug(doc_id))
            except Exception:
                pass
        results.append(f"\u2705 \u5df2\u53d1\u5e03: {data.get('title', '')}")
    return {"success": True, "message": "\n".join(results)}


@router.get("/all_tags")
async def get_all_historical_tags():
    tag_collections = {"post": set(), "chatter": set()}
    rows = fetch_all("SELECT doc_type, tags FROM documents WHERE doc_type IN ('post', 'chatter')")
    for row in rows:
        for tag in parse_json_column(row.get("tags"), []):
            tag_collections[row["doc_type"]].add(str(tag))
    return {"success": True, "postTags": sorted(tag_collections["post"]), "chatterTags": sorted(tag_collections["chatter"])}
