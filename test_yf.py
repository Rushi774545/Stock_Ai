import yfinance as yf
try:
    ticker = yf.Ticker('AAPL')
    hist = ticker.history(period='1d')
    print(hist)
    if hist.empty:
        print("HIST_EMPTY")
except Exception as e:
    print(f"ERROR: {e}")
