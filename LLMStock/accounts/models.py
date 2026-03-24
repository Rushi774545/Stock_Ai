from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
import random

class User(AbstractUser):
    email = models.EmailField(unique=True)
    telegram_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    mpin_hash = models.CharField(max_length=128, blank=True, null=True)

    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.user.username} - {self.code}"
