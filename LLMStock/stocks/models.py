from django.db import models

class Stock(models.Model):
    MARKET_CHOICES = [
        ('NIFTY', 'Nifty 50'),
        ('USA', 'US Stocks'),
    ]
    symbol = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    market = models.CharField(max_length=10, choices=MARKET_CHOICES, default='USA')
    sector = models.CharField(max_length=100, blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True)
    current_price = models.DecimalField(max_digits=20, decimal_places=4, blank=True, null=True)
    open_price = models.DecimalField(max_digits=20, decimal_places=4, blank=True, null=True)
    high_price = models.DecimalField(max_digits=20, decimal_places=4, blank=True, null=True)
    low_price = models.DecimalField(max_digits=20, decimal_places=4, blank=True, null=True)
    prev_close = models.DecimalField(max_digits=20, decimal_places=4, blank=True, null=True)
    market_cap = models.BigIntegerField(blank=True, null=True)
    pe_ratio = models.FloatField(blank=True, null=True)
    dividend_yield = models.FloatField(blank=True, null=True)
    fifty_two_week_high = models.DecimalField(max_digits=20, decimal_places=4, blank=True, null=True)
    fifty_two_week_low = models.DecimalField(max_digits=20, decimal_places=4, blank=True, null=True)
    volume = models.BigIntegerField(blank=True, null=True)
    volatility = models.FloatField(blank=True, null=True)
    change_pct = models.FloatField(blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} - {self.name}"

class NewsBronze(models.Model):
    """Raw news data as fetched from source."""
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='news_bronze')
    title = models.TextField()
    content = models.TextField(blank=True, null=True)
    publisher = models.CharField(max_length=255, blank=True, null=True)
    link = models.URLField(max_length=1000)
    publish_time = models.DateTimeField()
    fetched_at = models.DateTimeField(auto_now_add=True)

class NewsSilver(models.Model):
    """Cleaned and parsed news data."""
    bronze = models.OneToOneField(NewsBronze, on_delete=models.CASCADE, related_name='silver')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='news_silver')
    cleaned_title = models.TextField()
    cleaned_content = models.TextField(blank=True, null=True)
    sentiment_score = models.FloatField(null=True, blank=True)
    processed_at = models.DateTimeField(auto_now_add=True)

class NewsGold(models.Model):
    """Aggregated business insights and recommendations."""
    stock = models.OneToOneField(Stock, on_delete=models.CASCADE, related_name='news_gold')
    summary = models.TextField()
    recommendation = models.CharField(max_length=20) # BUY, SELL, HOLD
    reasoning = models.TextField()
    overall_sentiment = models.FloatField()
    last_updated = models.DateTimeField(auto_now=True)
