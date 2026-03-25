import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stock_platform.settings')
django.setup()

from stocks.models import Stock
try:
    s = Stock.objects.get(id=7)
    print(f"SYMBOL: {s.symbol}")
except Exception as e:
    print(f"ERROR: {e}")
