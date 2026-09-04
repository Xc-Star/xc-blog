import base64

from fastapi import APIRouter, Body, UploadFile, File, Form
import httpx

router = APIRouter()

# 1x1 透明 PNG，用于连通性自检
PROBE_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
)

# 图床侧的存放目录，作为 URL 查询参数传给 /upload
UPLOAD_FOLDER = "blog"


def _normalize(url: str, token: str) -> tuple[str, str]:
    url = (url or "").strip().rstrip("/")
    token = (token or "").strip()
    if token and not token.startswith("Bearer "):
        token = f"Bearer {token}"
    return url, token


def _resolve_url(payload, base_url: str) -> str | None:
    """上传接口返回 [{src, publicUrl}]；publicUrl 需图床配了默认 URL 前缀才有，缺失时用图床域名拼 src。"""
    item = payload[0] if isinstance(payload, list) and payload else payload
    if not isinstance(item, dict):
        return None
    public_url = str(item.get("publicUrl") or "").strip()
    if public_url:
        return public_url
    src = str(item.get("src") or "").strip()
    if not src:
        return None
    if src.startswith(("http://", "https://")):
        return src
    return f"{base_url}/{src.lstrip('/')}"


async def _do_upload(base_url: str, token: str, filename: str, content: bytes, content_type: str | None) -> dict:
    headers = {"Authorization": token, "Accept": "application/json"}
    files = {"file": (filename, content, content_type or "application/octet-stream")}

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{base_url}/upload",
            headers=headers,
            files=files,
            params={"uploadFolder": UPLOAD_FOLDER},
        )

    if response.status_code in (401, 403):
        return {"success": False, "message": "认证失败，请检查上传认证码 / API Token 是否具备 upload 权限"}
    if not 200 <= response.status_code < 300:
        return {"success": False, "message": f"上传失败，图床返回 {response.status_code}：{response.text[:200]}"}

    try:
        payload = response.json()
    except ValueError:
        return {"success": False, "message": "图床返回的不是合法 JSON，请确认 API 地址填写正确"}

    img_url = _resolve_url(payload, base_url)
    if not img_url:
        return {"success": False, "message": f"图床未返回可用链接：{response.text[:200]}"}
    return {"success": True, "message": "上传成功", "url": img_url}


@router.post("/test")
async def test_picbed_connection(payload: dict = Body(...)):
    base_url, token = _normalize(payload.get("url", ""), payload.get("token", ""))
    if not base_url or not token:
        return {"success": False, "message": "图床 API 地址和 Token 不能为空"}

    try:
        result = await _do_upload(base_url, token, "connection-probe.png", PROBE_PNG, "image/png")
    except httpx.TimeoutException:
        return {"success": False, "message": "连接超时，请检查图床地址是否可达"}
    except Exception as e:
        return {"success": False, "message": f"网络异常: {str(e)}"}

    if result["success"]:
        return {"success": True, "message": f"连接成功！测试图已上传：{result['url']}"}
    return result


@router.post("/upload")
async def upload_image(
        file: UploadFile = File(...),
        url: str = Form(...),
        token: str = Form(...)
):
    base_url, token = _normalize(url, token)
    if not base_url or not token:
        return {"success": False, "message": "图床 API 地址和 Token 不能为空"}

    try:
        content = await file.read()
        return await _do_upload(base_url, token, file.filename or "upload.png", content, file.content_type)
    except httpx.TimeoutException:
        return {"success": False, "message": "图片上传超时，请检查网络或图片是否过大"}
    except Exception as e:
        return {"success": False, "message": f"服务器异常: {str(e)}"}
