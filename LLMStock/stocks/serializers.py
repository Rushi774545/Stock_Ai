from rest_framework import serializers
from .models import Stock, NewsGold

class NewsGoldSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsGold
        fields = ['summary', 'recommendation', 'reasoning', 'overall_sentiment', 'last_updated']

class StockSerializer(serializers.ModelSerializer):
    news_gold = NewsGoldSerializer(read_only=True)

    class Meta:
        model = Stock
        fields = '__all__'
