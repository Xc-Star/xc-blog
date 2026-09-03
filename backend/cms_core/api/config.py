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
        return {"success": False, "message": f"\u89e3\u6790\u5931\u8d25: {str(e)}"}


@router.post("/update")
def update_site_config(payload: Dict[str, Any] = Body(...)):
    updates = payload.get("updates", {})
    if not updates:
        return {"success": False, "message": "\u6ca1\u6709\u6536\u5230\u9700\u8981\u66f4\u65b0\u7684\u6570\u636e"}
    invalid_keys = [key for key in updates if key not in VALID_ROOT_KEYS]
    if invalid_keys:
        return {"success": False, "message": f"\u5305\u542b\u975e\u6cd5\u914d\u7f6e\u5b57\u6bb5: {', '.join(invalid_keys)}"}
    try:
        for key, value in updates.items():
            execute("""
                INSERT INTO site_config (config_key, config_value)
                VALUES (:config_key, :config_value)
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
            """, config_key=key, config_value=json_param(value))
        return {"success": True, "message": "\u672c\u5730 site.config.json \u4fee\u6539\u6210\u529f\uff01"}
    except Exception as e:
        return {"success": False, "message": f"\u6587\u4ef6\u8bfb\u5199\u9519\u8bef: {str(e)}"}
