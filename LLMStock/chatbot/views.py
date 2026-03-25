from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.conf import settings
from .models import ChatLog
from .gemini_service import gemini_service
from .rag_utils import rag_service
from django.contrib.auth.hashers import check_password
from portfolio.models import Portfolio
from stocks.models import Stock
import os
import tempfile
from google.cloud import speech

from .tts_service import tts_service

class ChatView(views.APIView):
    permission_classes = [permissions.IsAuthenticated] # Require auth

    def post(self, request):
        message = request.data.get('message')
        if not message:
            return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        intent = gemini_service.classify_intent(message)

        # Get chat history for the user
        chat_history = ChatLog.objects.filter(user=user).order_by('timestamp')
        gemini_history = []
        for log in chat_history:
            gemini_history.append({"role": "user", "parts": [log.message]})
            gemini_history.append({"role": "model", "parts": [log.response]})

        # Start a chat session with history
        chat_session = gemini_service.start_chat(history=gemini_history)

        # RAG query for context
        context = rag_service.query_rag(message, user=user)
        
        # Construct a more detailed prompt
        full_prompt = (
            f"You are MORPHEUS, a stock assistant. Here is some context:\n\n"
            f"--- CONTEXT ---\n{context}\n--- END CONTEXT ---\n\n"
            f"Based on this context and our past conversation, answer the following question: {message}"
        )

        # Send message to Gemini and get response
        response = chat_session.send_message(full_prompt)
        response_text = response.text

        # Log the new chat message
        self.log_chat(user, message, response_text, intent)

        # Get TTS audio
        audio = tts_service.text_to_speech(response_text)

        return Response({"response": response_text, "intent": intent, "audio": audio})

    def log_chat(self, user, message, response, intent):
        ChatLog.objects.create(
            user=user,
            message=message,
            response=response,
            intent=intent
        )
