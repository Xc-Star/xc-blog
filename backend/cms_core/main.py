import logging
import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cms_core.api import auth as login_auth
from cms_core.api import config, drafts, friends, gallery, moments, music, picbed, projects, sync
from cms_core.auth import auth_enabled, log_auth_status, require_token
from cms_core.db import database_label, fetch_one, wait_for_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
app = FastAPI(title="XingHuiSama CMS Backend", version="1.0.0")

cors_origins_raw = os.environ.get("CORS_ORIGINS", "*").strip()
allow_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()] or ["*"]
allow_credentials = allow_origins != ["*"]
app.add_middleware(CORSMiddleware, allow_origins=allow_origins, allow_credentials=allow_credentials, allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup_log() -> None:
    wait_for_db()
    login_auth.bootstrap_admin_user()
    logger.info("Database ready: %s; token auth enabled: %s", database_label(), auth_enabled())
    log_auth_status()


@app.get("/api/status")
def get_status():
    try:
        fetch_one("SELECT 1 AS ok")
        db_status = "connected"
    except Exception:
        db_status = "error"
    return {"status": "online", "message": "\u4e2d\u67a2\u795e\u7ecf\u5df2\u8fde\u63a5", "db": db_status}


protected = [Depends(require_token)]
app.include_router(music.router, prefix="/api/music", tags=["Music"], dependencies=protected)
app.include_router(config.router, prefix="/api/config", tags=["Config"], dependencies=protected)
app.include_router(picbed.router, prefix="/api/picbed", tags=["PicBed"], dependencies=protected)
app.include_router(drafts.router, prefix="/api/drafts", tags=["Drafts"], dependencies=protected)
app.include_router(gallery.router, prefix="/api/gallery", tags=["Gallery"], dependencies=protected)
app.include_router(friends.router, prefix="/api/friends", tags=["Friends"], dependencies=protected)
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"], dependencies=protected)
app.include_router(moments.router, prefix="/api/moments", tags=["Moments"], dependencies=protected)
app.include_router(sync.router, prefix="/api/sync", tags=["Sync"], dependencies=protected)
app.include_router(login_auth.router, prefix="/api/auth", tags=["Auth"], dependencies=protected)
