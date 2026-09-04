from typing import Any, Dict
from fastapi import APIRouter, Body
from cms_core.db import execute, fetch_all, json_param, parse_json_column

router = APIRouter()
VALID_ROOT_KEYS = {
    "title", "authorName", "bio", "avatarUrl", "useGradient", "themeColors",
    "bgImages", "defaultPostCover", "photoWallImage", "cloudMusicIds", "social",
    "counts", "chatterTitle", "chatterDescription", "picBedName", "picBedUrl",
    "picBedToken", "danmakuList", "gitalkConfig", "buildDate", "footerBadges",
    "icpConfig", "geminiConfig", "faviconUrl", "navTitle", "navSuffix", "navAfter",
    "friendLinkApplyFormat", "enableLevelSystem"
}


@router.get("/get")
def get_site_config():
    try:
        rows = fetch_all("SELECT config_key, config_value FROM site_config")
        return {"success": True, "data": {r["config_key"]: parse_json_column(r["config_value"], None) for r in rows}}
    except Exception as e:
        return {"success": False, "message": f"解析失败: {str(e)}"}


@router.post("/update")
def update_site_config(payload: Dict[str, Any] = Body(...)):
    updates = payload.get("updates", {})
    if not updates:
        return {"success": False, "message": "没有收到需要更新的数据"}
    invalid_keys = [key for key in updates if key not in VALID_ROOT_KEYS]
    if invalid_keys:
        return {"success": False, "message": f"包含非法配置字段: {', '.join(invalid_keys)}"}
    try:
        for key, value in updates.items():
            execute("""
                INSERT INTO site_config (config_key, config_value)
                VALUES (:config_key, :config_value)
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
            """, config_key=key, config_value=json_param(value))
        return {"success": True, "message": "本地 site.config.json 修改成功！"}
    except Exception as e:
        return {"success": False, "message": f"文件读写错误: {str(e)}"}
