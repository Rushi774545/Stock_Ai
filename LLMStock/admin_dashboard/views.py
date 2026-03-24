from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from stocks.models import Stock
from portfolio.models import Portfolio
from chatbot.models import ChatLog
from .serializers import (
    AdminUserSerializer, 
    AdminStockSerializer, 
    AdminPortfolioSerializer, 
    AdminChatLogSerializer
)
from django.contrib.auth.hashers import make_password

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email']

class AdminUserResetPasswordView(generics.UpdateAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        new_password = request.data.get('password')
        if not new_password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
        user.password = make_password(new_password)
        user.save()
        return Response({"message": f"Password reset for {user.username} successful"}, status=status.HTTP_200_OK)

class AdminStockCRUDView(generics.ListCreateAPIView, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Stock.objects.all().order_by('symbol')
    serializer_class = AdminStockSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['symbol', 'name', 'sector']
    ordering_fields = ['current_price', 'market_cap']

    def get_object(self):
        pk = self.kwargs.get('pk')
        if pk:
            return generics.get_object_or_404(Stock, pk=pk)
        return super().get_object()

class AdminPortfolioListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = Portfolio.objects.all().order_by('-purchase_date')
    serializer_class = AdminPortfolioSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__username', 'stock__symbol']

class AdminChatLogListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = ChatLog.objects.all().order_by('-timestamp')
    serializer_class = AdminChatLogSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__username', 'message', 'intent']
