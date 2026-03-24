from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OTP
from django.contrib.auth.hashers import make_password

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'telegram_id')

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'telegram_id')

class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()

class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    otp_code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)

class SetMPINSerializer(serializers.Serializer):
    mpin = serializers.CharField(min_length=4, max_length=6)

class VerifyMPINSerializer(serializers.Serializer):
    mpin = serializers.CharField(min_length=4, max_length=6)
