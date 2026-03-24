import yfinance as yf
from django.core.management.base import BaseCommand
from stocks.models import Stock, NewsBronze, NewsSilver, NewsGold
from stocks.utils import get_ai_analysis
from decimal import Decimal
import time
import requests
import os
from django.utils import timezone
from datetime import datetime

from django.db import connections

class Command(BaseCommand):
    help = 'Fetch live stock data and news, then process through Medallion pipeline'

    def handle(self, *args, **kwargs):
        # Force close old connections to avoid "unable to open database file" in some environments
        for conn in connections.all():
            conn.close()
            
        # Set cache dir
        cache_path = os.path.abspath(os.path.join(os.getcwd(), 'yfinance_cache'))
        os.environ['YFINANCE_CACHE_DIR'] = cache_path
        if not os.path.exists(cache_path):
            os.makedirs(cache_path)

        # Nifty 50 and Top 50 US symbols
        nifty_50 = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS",
            "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
            "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "SUNPHARMA.NS",
            "TITAN.NS", "ULTRACEMCO.NS", "HCLTECH.NS", "ONGC.NS", "BAJFINANCE.NS",
            "WIPRO.NS", "M&M.NS", "JSWSTEEL.NS", "ADANIENT.NS", "NTPC.NS",
            "TATASTEEL.NS", "POWERGRID.NS", "HINDALCO.NS", "TATAMOTORS.NS", "INDUSINDBK.NS",
            "GRASIM.NS", "ADANIPORTS.NS", "NESTLEIND.NS", "COALINDIA.NS", "SBILIFE.NS",
            "HDFCLIFE.NS", "BRITANNIA.NS", "DRREDDY.NS", "CIPLA.NS", "APOLLOHOSP.NS",
            "BAJAJFINSV.NS", "DIVISLAB.NS", "EICHERMOT.NS", "BPCL.NS", "HEROMOTOCO.NS",
            "TECHM.NS", "UPL.NS", "TATACONSUM.NS", "SHREECEM.NS"
        ]
        us_50 = [
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "BRK-B", "TSLA", "V", "UNH",
            "LLY", "JPM", "MA", "XOM", "AVGO", "HD", "PG", "ORCL", "COST", "ADBE",
            "JNJ", "CVX", "CRM", "ABBV", "MRK", "AMD", "PEP", "KO", "BAC", "TMO",
            "WMT", "NFLX", "ACN", "CSCO", "MCD", "ABT", "LIN", "INTU", "INTC", "DIS",
            "VZ", "AMAT", "PFE", "CMCSA", "DHR", "TXN", "NKE", "IBM", "NEE", "LOW"
        ]

        self.stdout.write(f"Fetching data for {len(nifty_50) + len(us_50)} core symbols...")

        for market, symbols in [('NIFTY', nifty_50), ('USA', us_50)]:
            for symbol in symbols:
                try:
                    ticker = yf.Ticker(symbol)
                    info = ticker.info
                    
                    # 1. FETCH LIVE DATA
                    fast_info = ticker.fast_info
                    price = fast_info.get('lastPrice') or info.get('currentPrice')
                    open_price = fast_info.get('open')
                    high_price = fast_info.get('dayHigh')
                    low_price = fast_info.get('dayLow')
                    prev_close = fast_info.get('previousClose')
                    vol = fast_info.get('lastVolume') or info.get('volume')
                    
                    # Calculate change % and volatility (simplified)
                    change_pct = 0
                    if price and prev_close:
                        change_pct = ((float(price) - float(prev_close)) / float(prev_close)) * 100
                    
                    # Simplified volatility: (High - Low) / Low
                    volatility = 0
                    if high_price and low_price and low_price > 0:
                        volatility = ((float(high_price) - float(low_price)) / float(low_price)) * 100

                    stock, created = Stock.objects.update_or_create(
                        symbol=symbol,
                        defaults={
                            'name': info.get('longName', symbol),
                            'market': market,
                            'sector': info.get('sector', 'Unknown'),
                            'industry': info.get('industry', 'Unknown'),
                            'current_price': Decimal(str(price)) if price else None,
                            'open_price': Decimal(str(open_price)) if open_price else None,
                            'high_price': Decimal(str(high_price)) if high_price else None,
                            'low_price': Decimal(str(low_price)) if low_price else None,
                            'prev_close': Decimal(str(prev_close)) if prev_close else None,
                            'market_cap': info.get('marketCap'),
                            'pe_ratio': info.get('trailingPE'),
                            'dividend_yield': info.get('dividendYield'),
                            'volume': vol,
                            'change_pct': change_pct,
                            'volatility': volatility,
                        }
                    )

                    # 2. MEDALLION NEWS PIPELINE
                    news_items = ticker.news[:5] # Bronze: Raw News
                    processed_bronze = []
                    for item in news_items:
                        pub_time = timezone.make_aware(datetime.fromtimestamp(item.get('providerPublishTime')))
                        bronze, _ = NewsBronze.objects.get_or_create(
                            stock=stock,
                            link=item.get('link'),
                            defaults={
                                'title': item.get('title'),
                                'publisher': item.get('publisher'),
                                'publish_time': pub_time
                            }
                        )
                        processed_bronze.append(bronze)
                        
                        # Silver: Cleaned & Basic Sentiment (Mocked for speed in bulk)
                        NewsSilver.objects.get_or_create(
                            bronze=bronze,
                            defaults={
                                'stock': stock,
                                'cleaned_title': item.get('title'),
                                'sentiment_score': 0.5 # Default neutral
                            }
                        )

                    # Gold: Aggregated Analysis using Gemini
                    if news_items:
                        ai_result = get_ai_analysis(symbol, news_items)
                        NewsGold.objects.update_or_create(
                            stock=stock,
                            defaults={
                                'summary': ai_result.get('summary'),
                                'recommendation': ai_result.get('recommendation'),
                                'reasoning': ai_result.get('reasoning'),
                                'overall_sentiment': ai_result.get('sentiment_score', 0.5)
                            }
                        )

                    self.stdout.write(self.style.SUCCESS(f"Processed {symbol}"))
                    time.sleep(1)
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error {symbol}: {str(e)}"))

        self.stdout.write(self.style.SUCCESS("Medallion Pipeline Completed."))
