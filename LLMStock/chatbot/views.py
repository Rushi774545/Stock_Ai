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
    permission_classes = [permissions.AllowAny]

    def transcribe_audio(self, audio_file):
        """Mock transcribing audio to text."""
        # Real implementation would use Google Cloud Speech-to-Text
        # For now, we mock the transcription to "What is the price of AAPL?"
        return "What is the price of AAPL?"

    def post(self, request):
        message = request.data.get('message')
        audio_file = request.FILES.get('audio')
        
        if audio_file:
            message = self.transcribe_audio(audio_file)
            
        if not message:
            return Response({"error": "Message or audio required."}, status=status.HTTP_400_BAD_REQUEST)

        # Index stocks if collection is empty
        if rag_service.collection.count() == 0:
            rag_service.index_stocks()

        user = request.user
        intent = gemini_service.classify_intent(message)
        
        # Public mode restrictions
        if not user.is_authenticated:
            if intent == "add stock" or intent == "portfolio analysis":
                response_text = "Please log in to manage your portfolio or analyze holdings."
                audio = tts_service.text_to_speech(response_text)
                return Response({
                    "response": response_text,
                    "intent": intent,
                    "audio": audio
                })
            
            # Allow only general market questions for public users
            response_text = rag_service.query_rag(message, user=None)
            audio = tts_service.text_to_speech(response_text)
            self.log_chat(user, message, response_text, intent)
            return Response({"response": response_text, "intent": intent, "audio": audio})

        # Intent: "add stock"
        if intent == "add stock":
            # Mock extracting symbol and quantity from message using Gemini
            extract_prompt = f"Extract the stock symbol and quantity to add from this message: '{message}'. Return as 'SYMBOL,QUANTITY'."
            extraction = gemini_service.get_gemini_response(extract_prompt)
            try:
                symbol, quantity = extraction.split(',')
                stock = Stock.objects.get(symbol=symbol.strip().upper())
                portfolio, created = Portfolio.objects.get_or_create(
                    user=user, 
                    stock=stock,
                    defaults={'quantity': int(quantity.strip()), 'purchase_price': stock.current_price}
                )
                if not created:
                    portfolio.quantity += int(quantity.strip())
                    portfolio.save()
                response_text = f"Successfully added {quantity.strip()} shares of {symbol.strip()} to your portfolio."
            except Exception as e:
                response_text = f"Failed to process 'add stock' request. Error: {str(e)}"
            
            audio = tts_service.text_to_speech(response_text)
            self.log_chat(user, message, response_text, intent)
            return Response({"response": response_text, "intent": intent, "audio": audio})

        # Intent: "portfolio analysis" or "stock info" or "general market"
        # Index user data into ChromaDB for personalized RAG
        if intent == "portfolio analysis":
            rag_service.index_user_portfolio(user)
            
        response_text = rag_service.query_rag(message, user=user)
        audio = tts_service.text_to_speech(response_text)
        self.log_chat(user, message, response_text, intent)
        return Response({"response": response_text, "intent": intent, "audio": audio})

    def log_chat(self, user, message, response, intent):
        ChatLog.objects.create(
            user=user if user.is_authenticated else None,
            message=message,
            response=response,
            intent=intent
        )
