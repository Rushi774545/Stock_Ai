from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from .models import OTP
from .serializers import (
    UserRegistrationSerializer, 
    UserSerializer, 
    ForgotPasswordSerializer, 
    ResetPasswordSerializer,
    SetMPINSerializer,
    VerifyMPINSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
import random
import requests
import os

User = get_user_model()

def send_telegram_otp(telegram_id, otp_code):
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    message = f"Your OTP for password reset is: {otp_code}. It expires in 10 minutes."
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        'chat_id': telegram_id,
        'text': message
    }
    try:
        response = requests.post(url, data=payload)
        return response.status_code == 200
    except Exception:
        return False

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class ForgotPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            try:
                user = User.objects.get(username=username)
                if not user.telegram_id:
                    return Response({"error": "User has no Telegram ID associated."}, status=status.HTTP_400_BAD_REQUEST)
                
                otp_code = str(random.randint(100000, 999999))
                OTP.objects.create(user=user, code=otp_code)
                
                if send_telegram_otp(user.telegram_id, otp_code):
                    return Response({"message": "OTP sent to Telegram."}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Failed to send OTP via Telegram."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            otp_code = serializer.validated_data['otp_code']
            new_password = serializer.validated_data['new_password']
            
            try:
                user = User.objects.get(username=username)
                otp = OTP.objects.filter(user=user, code=otp_code, is_verified=False).last()
                
                if otp and not otp.is_expired:
                    user.password = make_password(new_password)
                    user.save()
                    otp.is_verified = True
                    otp.save()
                    return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SetMPINView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = SetMPINSerializer(data=request.data)
        if serializer.is_valid():
            mpin = serializer.validated_data['mpin']
            request.user.mpin_hash = make_password(mpin)
            request.user.save()
            return Response({"message": "MPIN set successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyMPINView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = VerifyMPINSerializer(data=request.data)
        if serializer.is_valid():
            mpin = serializer.validated_data['mpin']
            if request.user.mpin_hash and check_password(mpin, request.user.mpin_hash):
                return Response({"message": "MPIN verified."}, status=status.HTTP_200_OK)
            return Response({"error": "Invalid MPIN."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
