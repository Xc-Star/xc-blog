from fastapi import APIRouter, Body
import httpx

router = APIRouter()


@router.post("/models")
async def list_models(payload: dict = Body(...)):
    """拉取 OpenAI 兼容端点的模型列表，供管理端下拉选择。"""
    base_url = (payload.get("baseUrl") or "").strip().rstrip("/")
    api_key = (payload.get("apiKey") or "").strip()

    if not base_url or not api_key:
        return {"success": False, "message": "接口地址和 API Key 不能为空"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{base_url}/models",
                headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
            )
    except httpx.TimeoutException:
        return {"success": False, "message": "连接超时，请检查接口地址是否可达"}
    except Exception as e:
        return {"success": False, "message": f"网络异常: {str(e)}"}

    if response.status_code in (401, 403):
        return {"success": False, "message": "认证失败，请检查 API Key 是否正确"}
    if not 200 <= response.status_code < 300:
        return {"success": False, "message": f"接口返回 {response.status_code}：{response.text[:200]}"}

    try:
        data = response.json()
    except ValueError:
        return {"success": False, "message": "返回的不是合法 JSON，请确认地址是 OpenAI 兼容端点（通常以 /v1 结尾）"}

    items = data.get("data") if isinstance(data, dict) else data
    if not isinstance(items, list):
        return {"success": False, "message": "接口未返回模型列表"}

    models = sorted({str(m.get("id")) for m in items if isinstance(m, dict) and m.get("id")})
    if not models:
        return {"success": False, "message": "该账号下没有可用模型"}
    return {"success": True, "models": models, "message": f"共获取到 {len(models)} 个模型"}
