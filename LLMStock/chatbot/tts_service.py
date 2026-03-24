import os
import requests
import base64

class ElevenLabsService:
    def __init__(self):
        self.api_key = os.getenv('ELEVENLABS_API_KEY')
        self.voice_id = os.getenv('ELEVENLABS_VOICE_ID', '21m00Tcm4TlvDq8ikWAM') # Default Rachel voice
        self.url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"

    def text_to_speech(self, text):
        if not self.api_key:
            return None

        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }

        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }

        try:
            response = requests.post(self.url, json=data, headers=headers)
            if response.status_code == 200:
                # Return base64 encoded audio to send in JSON response
                return base64.b64encode(response.content).decode('utf-8')
            else:
                print(f"ElevenLabs Error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"TTS Exception: {e}")
            return None

tts_service = ElevenLabsService()
