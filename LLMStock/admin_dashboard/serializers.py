from rest_framework import serializers
from django.contrib.auth import get_user_model
from stocks.models import Stock
from portfolio.models import Portfolio
from chatbot.models import ChatLog

User = get_user_model()

class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'telegram_id', 'is_staff', 'date_joined']

class AdminStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = '__all__'

class AdminPortfolioSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    stock_symbol = serializers.CharField(source='stock.symbol', read_only=True)
    
    class Meta:
        model = Portfolio
        fields = ['id', 'user', 'user_name', 'stock', 'stock_symbol', 'quantity', 'purchase_price', 'purchase_date']

class AdminChatLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ChatLog
        fields = ['id', 'user', 'user_name', 'message', 'response', 'intent', 'timestamp']
