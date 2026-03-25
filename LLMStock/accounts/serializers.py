from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import OTP
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    telegram_id = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'telegram_id')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_telegram_id(self, value):
        # UNIQUE(telegram_id) treats duplicate '' as conflicts; store NULL instead for "no Telegram"
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        cleaned = value.strip()
        if User.objects.filter(telegram_id=cleaned).exists():
            raise serializers.ValidationError('This Telegram ID is already registered.')
        return cleaned

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        try:
            validated_data['password'] = make_password(validated_data['password'])
            return super().create(validated_data)
        except IntegrityError as e:
            # Handle potential race conditions where data was inserted between validation and creation
            raise serializers.ValidationError({"detail": "An account with these details already exists."})
        except Exception as e:
            # Catch other unexpected errors to prevent 500 and help debugging
            raise serializers.ValidationError({"detail": str(e)})

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
