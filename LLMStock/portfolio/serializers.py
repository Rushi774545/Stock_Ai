from rest_framework import serializers
from .models import Portfolio, PortfolioGroup
from stocks.models import Stock
from stocks.serializers import StockSerializer

class PortfolioGroupSerializer(serializers.ModelSerializer):
    total_value = serializers.SerializerMethodField()
    total_profit_loss = serializers.SerializerMethodField()

    class Meta:
        model = PortfolioGroup
        fields = ['id', 'name', 'description', 'group_type', 'created_at', 'total_value', 'total_profit_loss']

    def get_total_value(self, obj):
        return sum(h.current_value for h in obj.holdings.all())

    def get_total_profit_loss(self, obj):
        return sum(h.profit_loss for h in obj.holdings.all())

class PortfolioSerializer(serializers.ModelSerializer):
    stock = StockSerializer(read_only=True)
    stock_symbol = serializers.SlugRelatedField(
        queryset=Stock.objects.all(),
        slug_field='symbol',
        source='stock',
        write_only=True
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=PortfolioGroup.objects.all(),
        source='group',
        required=False,
        allow_null=True
    )
    current_value = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)
    profit_loss = serializers.DecimalField(max_digits=20, decimal_places=4, read_only=True)

    class Meta:
        model = Portfolio
        fields = ['id', 'stock', 'stock_symbol', 'group_id', 'quantity', 'purchase_price', 'purchase_date', 'current_value', 'profit_loss']
