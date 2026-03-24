from django.db import models
from django.conf import settings
from stocks.models import Stock

class PortfolioGroup(models.Model):
    GROUP_TYPES = [
        ('SECTOR', 'Sector-based'),
        ('CUSTOM', 'Custom Portfolio'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolio_groups')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    group_type = models.CharField(max_length=20, choices=GROUP_TYPES, default='CUSTOM')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.group_type})"

class Portfolio(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolios')
    group = models.ForeignKey(PortfolioGroup, on_delete=models.CASCADE, related_name='holdings', null=True, blank=True)
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    purchase_price = models.DecimalField(max_digits=20, decimal_places=4)
    purchase_date = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'stock', 'group')

    def __str__(self):
        return f"{self.user.username}'s portfolio: {self.stock.symbol}"

    @property
    def current_value(self):
        if self.stock.current_price:
            return self.quantity * self.stock.current_price
        return 0

    @property
    def profit_loss(self):
        if self.stock.current_price:
            return (self.stock.current_price - self.purchase_price) * self.quantity
        return 0
