from django.urls import path
from .views import (
    AdminUserListView, 
    AdminUserResetPasswordView, 
    AdminStockCRUDView, 
    AdminPortfolioListView, 
    AdminChatLogListView
)

urlpatterns = [
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('users/<int:pk>/reset-password/', AdminUserResetPasswordView.as_view(), name='admin-user-reset-password'),
    path('stocks/', AdminStockCRUDView.as_view(), name='admin-stocks'),
    path('stocks/<int:pk>/', AdminStockCRUDView.as_view(), name='admin-stock-detail'),
    path('portfolios/', AdminPortfolioListView.as_view(), name='admin-portfolios'),
    path('chat-logs/', AdminChatLogListView.as_view(), name='admin-chat-logs'),
]
