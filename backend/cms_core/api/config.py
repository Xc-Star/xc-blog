from typing import Any, Dict
from fastapi import APIRouter, Body
from cms_core.db import execute, fetch_all, json_param, parse_json_column

router = APIRouter()
VALID_ROOT_KEYS = {
    "title", "authorName", "bio", "avatarUrl", "useGradient", "themeColors",
    "bgImages", "defaultPostCover", "photoWallImage", "cloudMusicIds", "social",
    "counts", "chatterTitle", "chatterDescription", "picBedName", "picBedUrl",
    "picBedToken", "danmakuList", "buildDate", "footerBadges",
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
    # 管理端会把整份表单原样回传，其中可能夹带历史遗留字段（如已下线的 gitalkConfig）。
    # 只忽略这些字段，不能因此让整次保存失败。
    ignored_keys = [key for key in updates if key not in VALID_ROOT_KEYS]
    accepted = {key: value for key, value in updates.items() if key in VALID_ROOT_KEYS}
    if not accepted:
        return {"success": False, "message": f"没有可保存的合法字段（已忽略: {', '.join(ignored_keys)}）"}
    try:
        for key, value in accepted.items():
            execute("""
                INSERT INTO site_config (config_key, config_value)
                VALUES (:config_key, :config_value)
                ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
            """, config_key=key, config_value=json_param(value))
        message = "站点配置已保存！"
        if ignored_keys:
            message += f"（已忽略未知字段: {', '.join(ignored_keys)}）"
        return {"success": True, "message": message}
    except Exception as e:
        return {"success": False, "message": f"写入数据库失败: {str(e)}"}
