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
            print(f"Fetching data for {symbol}...")
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Fetch 1mo history to calculate volatility
            hist = ticker.history(period="1mo")
            volatility = 0
            if not hist.empty:
                volatility = hist['Close'].pct_change().std() * (252**0.5) * 100 # Annualized volatility

            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
            
            change_pct = 0
            if current_price and prev_close:
                change_pct = ((current_price - prev_close) / prev_close) * 100

            Stock.objects.update_or_create(
                symbol=symbol,
                defaults={
                    'name': info.get('longName', symbol),
                    'market': 'NIFTY',
                    'sector': info.get('sector', 'Unknown'),
                    'industry': info.get('industry', 'Unknown'),
                    'current_price': current_price,
                    'open_price': info.get('open') or info.get('regularMarketOpen'),
                    'high_price': info.get('dayHigh') or info.get('regularMarketDayHigh'),
                    'low_price': info.get('dayLow') or info.get('regularMarketDayLow'),
                    'prev_close': prev_close,
                    'market_cap': info.get('marketCap'),
                    'pe_ratio': info.get('trailingPE'),
                    'dividend_yield': info.get('dividendYield'),
                    'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                    'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
                    'volume': info.get('volume') or info.get('regularMarketVolume'),
                    'volatility': volatility,
                    'change_pct': change_pct,
                }
            )
            print(f"Successfully populated {symbol}")
        except Exception as e:
            print(f"Could not populate {symbol}: {e}")

    for symbol in TOP_US_STOCKS:
        try:
            print(f"Fetching data for {symbol}...")
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Fetch 1mo history to calculate volatility
            hist = ticker.history(period="1mo")
            volatility = 0
            if not hist.empty:
                volatility = hist['Close'].pct_change().std() * (252**0.5) * 100

            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
            
            change_pct = 0
            if current_price and prev_close:
                change_pct = ((current_price - prev_close) / prev_close) * 100

            Stock.objects.update_or_create(
                symbol=symbol,
                defaults={
                    'name': info.get('longName', symbol),
                    'market': 'USA',
                    'sector': info.get('sector', 'Unknown'),
                    'industry': info.get('industry', 'Unknown'),
                    'current_price': current_price,
                    'open_price': info.get('open') or info.get('regularMarketOpen'),
                    'high_price': info.get('dayHigh') or info.get('regularMarketDayHigh'),
                    'low_price': info.get('dayLow') or info.get('regularMarketDayLow'),
                    'prev_close': prev_close,
                    'market_cap': info.get('marketCap'),
                    'pe_ratio': info.get('trailingPE'),
                    'dividend_yield': info.get('dividendYield'),
                    'fifty_two_week_high': info.get('fiftyTwoWeekHigh'),
                    'fifty_two_week_low': info.get('fiftyTwoWeekLow'),
                    'volume': info.get('volume') or info.get('regularMarketVolume'),
                    'volatility': volatility,
                    'change_pct': change_pct,
                }
            )
            print(f"Successfully populated {symbol}")
        except Exception as e:
            print(f"Could not populate {symbol}: {e}")

if __name__ == '__main__':
    populate_stocks()
