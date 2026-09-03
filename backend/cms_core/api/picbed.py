from fastapi import APIRouter, Body, UploadFile, File, Form
import httpx

router = APIRouter()


@router.post("/test")
async def test_picbed_connection(payload: dict = Body(...)):
    url = payload.get("url", "").strip().rstrip('/')
    token = payload.get("token", "").strip()

    if not url or not token:
        return {"success": False, "message": "鍥惧簥 API 鍦板潃鍜?Token 涓嶈兘涓虹┖"}

    test_endpoint = f"{url}/api/v1/profile"
    if not token.startswith("Bearer "):
        token = f"Bearer {token}"

    headers = {"Authorization": token, "Accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(test_endpoint, headers=headers)
            if response.status_code != 200:
                return {"success": False, "message": f"鏍￠獙澶辫触锛屾湇鍔″櫒杩斿洖浜?{response.status_code} 閿欒"}

            data = response.json()
            if data.get("status") is True:
                user_email = data.get("data", {}).get("email", "鏈煡鐢ㄦ埛")
                return {"success": True, "message": f"杩炴帴鎴愬姛锛佸綋鍓嶈处鎴? {user_email}"}
            else:
                return {"success": False, "message": f"Token 鏃犳晥: {data.get('message', '鏈煡閿欒')}"}
    except Exception as e:
        return {"success": False, "message": f"缃戠粶寮傚父: {str(e)}"}


# 馃憞 銆愬叏鏂拌拷鍔犮€戯細鐪熷疄鐨勫浘搴婂浘鐗囦笂浼犳帴鍙?
@router.post("/upload")
async def upload_image(
        file: UploadFile = File(...),
        url: str = Form(...),
        token: str = Form(...)
):
    url = url.strip().rstrip('/')
    token = token.strip()

    if not token.startswith("Bearer "):
        token = f"Bearer {token}"

    upload_endpoint = f"{url}/api/v1/upload"
    headers = {
        "Authorization": token,
        "Accept": "application/json"
    }

    try:
        content = await file.read()
        # 灏佽涓?httpx 鏀寔鐨勬枃浠朵笂浼犳牸寮?
        files = {'file': (file.filename, content, file.content_type)}

        # 涓婁紶鍥剧墖鍙兘杈冩參锛屽皢瓒呮椂璁剧疆涓?30 绉?
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(upload_endpoint, headers=headers, files=files)

            if response.status_code != 200:
                return {"success": False, "message": f"涓婁紶澶辫触锛屽浘搴婅繑鍥炰簡 {response.status_code} 閿欒"}

            data = response.json()
            # 鍏煎 Lsky Pro 鐨勮繑鍥炴牸寮?
            if data.get("status") is True:
                img_url = data.get("data", {}).get("links", {}).get("url")
                return {"success": True, "message": "涓婁紶鎴愬姛", "url": img_url}
            else:
                return {"success": False, "message": f"鍥惧簥鎷掔粷鎺ユ敹: {data.get('message', '鏈煡')}"}
    except httpx.ReadTimeout:
        return {"success": False, "message": "鍥剧墖涓婁紶瓒呮椂锛岃妫€鏌ョ綉缁滄垨鍥剧墖鏄惁杩囧ぇ"}
    except Exception as e:
        return {"success": False, "message": f"鏈嶅姟鍣ㄥ紓甯? {str(e)}"}
