import hmac
import logging
import os
from fastapi import Header, HTTPException

logger = logging.getLogger(__name__)
CMS_TOKEN = os.environ.get("CMS_TOKEN", "")


def auth_enabled() -> bool:
    return bool(CMS_TOKEN)


def log_auth_status() -> None:
    if auth_enabled():
        logger.info("CMS token auth is enabled")
    else:
        logger.warning("CMS_TOKEN is not set; CMS API token authentication is disabled")


def require_token(x_cms_token: str = Header(None)) -> None:
    if not CMS_TOKEN:
        return
    if not x_cms_token or not hmac.compare_digest(x_cms_token, CMS_TOKEN):
        raise HTTPException(status_code=401, detail="\u672a\u6388\u6743")
