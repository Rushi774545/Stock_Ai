from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, 
    ForgotPasswordView, 
    ResetPasswordView, 
    SetMPINView, 
    VerifyMPINView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('set-mpin/', SetMPINView.as_view(), name='set_mpin'),
    path('verify-mpin/', VerifyMPINView.as_view(), name='verify_mpin'),
]
