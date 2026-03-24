import google.generativeai as genai
import os
from django.conf import settings

class GeminiService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def get_gemini_response(self, prompt, context=""):
        full_prompt = f"Context: {context}\n\nQuestion: {prompt}"
        response = self.model.generate_content(full_prompt)
        return response.text

    def classify_intent(self, message):
        prompt = f"""
        Classify the user intent for a stock platform.
        Options: "add stock", "general market", "portfolio analysis", "stock info".
        Message: "{message}"
        Return only the intent label.
        """
        response = self.model.generate_content(prompt)
        return response.text.strip().lower()

gemini_service = GeminiService()
