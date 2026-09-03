from fastapi import APIRouter
import requests

router = APIRouter()


@router.get("/query/{song_id}")
def query_netease_music(song_id: str):
    """閫氳繃缃戞槗浜戝叕寮€鎺ュ彛鏌ヨ姝屾洸璇︽儏"""
    print(f"\n[API] 馃幍 鏀跺埌鏌ヨ缃戞槗浜戦煶涔愯姹? ID: {song_id}")
    try:
        api_url = f"https://music.163.com/api/song/detail/?id={song_id}&ids=[{song_id}]"
        headers = {
            # 浼寰楁洿鍍忕湡瀹炴祻瑙堝櫒
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Referer": "https://music.163.com/"
        }
        response = requests.get(api_url, headers=headers, timeout=5)

        # 鎶?HTTP 鐘舵€佺爜鎵撳嚭鏉ワ紝濡傛灉鏄?403 灏辨槸琚綉鏄撲簯鎷︽埅浜?
        print(f"[API] 馃摗 缃戞槗浜戝搷搴旂姸鎬佺爜: {response.status_code}")

        data = response.json()

        if data.get("songs") and len(data["songs"]) > 0:
            song = data["songs"][0]
            print(f"[API] 鉁?鏌ヨ鎴愬姛: {song['name']} - {song['artists'][0]['name']}")
            return {
                "success": True,
                "data": {
                    "id": song_id,
                    "name": song["name"],
                    "artist": song["artists"][0]["name"],
                    "album": song["album"]["name"],
                    "cover": song["album"]["picUrl"]
                }
            }
        print(f"[API] 鉂?鏌ユ棤姝ゆ瓕 (ID: {song_id})")
        return {"success": False, "message": "鏈壘鍒拌姝屾洸锛屽彲鑳芥槸 VIP 姝屾洸鎴?ID 閿欒"}

    except Exception as e:
        # 銆愬叧閿€戯細鍦ㄧ粓绔噷鎶婄湡姝ｇ殑鎶ラ敊鍘熷洜鎵撳嵃鍑烘潵锛?
        print(f"[API] 馃挜 缃戞槗浜戞帴鍙ｅ彂鐢熶弗閲嶉敊璇? {str(e)}")
        return {"success": False, "message": f"鍚庣璇锋眰澶辫触: {str(e)}"}
