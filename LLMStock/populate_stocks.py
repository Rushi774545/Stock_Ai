import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stock_platform.settings')
django.setup()

from stocks.models import Stock
import yfinance as yf

NIFTY_50 = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS',
    'BAJFINANCE.NS', 'BHARTIARTL.NS', 'HCLTECH.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'LT.NS', 'MARUTI.NS',
    'WIPRO.NS', 'ULTRACEMCO.NS', 'SUNPHARMA.NS', 'ADANIPORTS.NS', 'TITAN.NS', 'ONGC.NS', 'NTPC.NS', 'POWERGRID.NS',
    'INDUSINDBK.NS', 'NESTLEIND.NS', 'TECHM.NS', 'GRASIM.NS', 'CIPLA.NS', 'DRREDDY.NS', 'HINDALCO.NS',
    'JSWSTEEL.NS', 'SBILIFE.NS', 'TATAMOTORS.NS', 'TATASTEEL.NS', 'UPL.NS', 'BAJAJFINSV.NS', 'BRITANNIA.NS',
    'COALINDIA.NS', 'EICHERMOT.NS', 'HEROMOTOCO.NS', 'IOC.NS', 'M&M.NS', 'SHREECEM.NS', 'BPCL.NS', 'DIVISLAB.NS',
    'BAJAJ-AUTO.NS', 'ADANIGREEN.NS', 'HDFCLIFE.NS', 'TATACOMSUM.NS'
]

TOP_US_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK-B', 'JPM', 'JNJ', 'V', 'UNH', 'PG', 'MA',
    'HD', 'DIS', 'BAC', 'PYPL', 'ADBE', 'CMCSA', 'NFLX', 'PEP', 'KO', 'CSCO', 'INTC', 'PFE', 'MRK', 'WMT',
    'XOM', 'CVX', 'ABBV', 'LLY', 'TMO', 'AVGO', 'COST', 'ACN', 'ORCL', 'DHR', 'MCD', 'NEE', 'LIN', 'TXN',
    'HON', 'UPS', 'PM', 'MS', 'GS', 'RTX', 'CAT', 'IBM'
]

def populate_stocks():
    for symbol in NIFTY_50:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            Stock.objects.update_or_create(
                symbol=symbol,
                defaults={
                    'name': info.get('longName', symbol),
                    'market': 'NIFTY',
                    'sector': info.get('sector', 'Unknown'),
                    'industry': info.get('industry', 'Unknown'),
                    'current_price': info.get('currentPrice'),
                    'market_cap': info.get('marketCap'),
                    'pe_ratio': info.get('trailingPE'),
                    'dividend_yield': info.get('dividendYield'),
                }
            )
            print(f"Successfully populated {symbol}")
        except Exception as e:
            print(f"Could not populate {symbol}: {e}")

    for symbol in TOP_US_STOCKS:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            Stock.objects.update_or_create(
                symbol=symbol,
                defaults={
                    'name': info.get('longName', symbol),
                    'market': 'USA',
                    'sector': info.get('sector', 'Unknown'),
                    'industry': info.get('industry', 'Unknown'),
                    'current_price': info.get('currentPrice'),
                    'market_cap': info.get('marketCap'),
                    'pe_ratio': info.get('trailingPE'),
                    'dividend_yield': info.get('dividendYield'),
                }
            )
            print(f"Successfully populated {symbol}")
        except Exception as e:
            print(f"Could not populate {symbol}: {e}")

if __name__ == '__main__':
    populate_stocks()
