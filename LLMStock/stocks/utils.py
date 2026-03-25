import pandas as pd
import numpy as np
import yfinance as yf
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from statsmodels.tsa.arima.model import ARIMA
import warnings

import google.generativeai as google_genai
import os
import json

# Suppress convergence warnings from statsmodels
warnings.filterwarnings("ignore")

def get_ai_analysis(symbol, news_articles):
    """
    Uses Gemini to analyze news articles and provide a recommendation.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return {
            "summary": "AI summary unavailable (API key missing).",
            "recommendation": "HOLD",
            "reasoning": "Unable to analyze news due to missing AI configuration.",
            "sentiment_score": 0.5
        }
    
    try:
        google_genai.configure(api_key=api_key)
        model = google_genai.GenerativeModel('gemini-1.5-flash')
        
        news_text = "\n".join([f"- {n.get('title')} (Source: {n.get('publisher')})" for n in news_articles[:8]])
        
        prompt = f"""
        Analyze the following recent news for stock {symbol} and provide a professional investment analysis:
        1. A concise 2-sentence summary of the overall news impact.
        2. A clear recommendation: BUY, SELL, or HOLD.
        3. Detailed reasoning (Bullet points for: Why to Buy, Risks/Why not to Buy, and Why to Hold).
        4. A sentiment score between 0.0 and 1.0 (0=Very Negative, 0.5=Neutral, 1=Very Positive).

        News Headlines:
        {news_text}

        IMPORTANT: Return ONLY a valid JSON object with the following structure:
        {{
            "summary": "Concise summary here",
            "recommendation": "BUY/SELL/HOLD",
            "reasoning": "Detailed points here",
            "sentiment_score": 0.75
        }}
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"AI Error for {symbol}: {e}")
        return {
            "summary": "Could not generate AI summary at this time.",
            "recommendation": "HOLD",
            "reasoning": f"Technical error during AI analysis: {e}",
            "sentiment_score": 0.5
        }

def get_advanced_forecast(df, model_type='linear', timeframe='daily', horizon=30):
    """
    Advanced forecasting supporting multiple models and timeframes.
    horizon: number of periods to forecast
    """
    if len(df) < 20:
        return []

    # Prepare historical data
    # Ensure index is datetime for ARIMA
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)
    
    # Resample based on timeframe if needed
    # Hourly needs data with intraday timestamps
    if timeframe == 'hourly':
        # Assuming hourly data is provided, otherwise we'd need to fetch it
        pass 
    elif timeframe == 'monthly':
        df = df.resample('M').last()
    elif timeframe == 'yearly':
        df = df.resample('A').last()
    
    y = df['Close'].values
    dates = df.index.tolist()
    
    forecast_values = []
    
    if model_type == 'arima':
        try:
            model = ARIMA(y, order=(5, 1, 0))
            model_fit = model.fit()
            forecast = model_fit.forecast(steps=horizon)
            forecast_values = forecast.tolist()
        except:
            # Fallback to linear if ARIMA fails
            model_type = 'linear'
            
    if model_type == 'linear':
        X = np.arange(len(y)).reshape(-1, 1)
        model = LinearRegression()
        model.fit(X, y)
        
        last_idx = len(y)
        X_future = np.arange(last_idx, last_idx + horizon).reshape(-1, 1)
        forecast_values = model.predict(X_future).tolist()

    # Generate future dates
    last_date = dates[-1]
    future_dates = []
    for i in range(1, horizon + 1):
        if timeframe == 'hourly':
            next_date = last_date + timedelta(hours=i)
        elif timeframe == 'monthly':
            # Approximate monthly
            next_date = last_date + timedelta(days=30*i)
        elif timeframe == 'yearly':
            next_date = last_date + timedelta(days=365*i)
        else: # daily
            next_date = last_date + timedelta(days=i)
        future_dates.append(next_date.strftime('%Y-%m-%d %H:%M'))

    return [
        {'date': date, 'price': float(val)} 
        for date, val in zip(future_dates, forecast_values)
    ]

def calculate_technical_indicators(df):
    """
    Calculates RSI, MACD, Bollinger Bands, and Moving Averages for a given DataFrame of stock data.
    """
    if df.empty:
        return {}

    # 1. RSI (14-day)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    # 2. Moving Averages
    df['ma_20'] = df['Close'].rolling(window=20).mean()
    df['ma_50'] = df['Close'].rolling(window=50).mean()
    df['ma_200'] = df['Close'].rolling(window=200).mean()

    # 3. MACD
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['macd'] = exp1 - exp2
    df['signal_line'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['signal_line']

    # 4. Bollinger Bands
    df['bb_mid'] = df['Close'].rolling(window=20).mean()
    df['bb_std'] = df['Close'].rolling(window=20).std()
    df['bb_upper'] = df['bb_mid'] + (df['bb_std'] * 2)
    df['bb_lower'] = df['bb_mid'] - (df['bb_std'] * 2)

    latest = df.iloc[-1]
    return {
        'rsi': float(latest['rsi']) if not pd.isna(latest['rsi']) else None,
        'ma_20': float(latest['ma_20']) if not pd.isna(latest['ma_20']) else None,
        'ma_50': float(latest['ma_50']) if not pd.isna(latest['ma_50']) else None,
        'ma_200': float(latest['ma_200']) if not pd.isna(latest['ma_200']) else None,
        'macd': float(latest['macd']) if not pd.isna(latest['macd']) else None,
        'macd_signal': float(latest['signal_line']) if not pd.isna(latest['signal_line']) else None,
        'macd_hist': float(latest['macd_hist']) if not pd.isna(latest['macd_hist']) else None,
        'bb_upper': float(latest['bb_upper']) if not pd.isna(latest['bb_upper']) else None,
        'bb_lower': float(latest['bb_lower']) if not pd.isna(latest['bb_lower']) else None,
        'current_close': float(latest['Close'])
    }

def get_linear_forecast(df, periods):
    """
    Simple linear regression forecast for future prices.
    periods: list of future days (e.g., [90, 365] for 3 months and 1 year)
    """
    if len(df) < 30: # Need enough data
        return {}

    # Prepare data
    df = df.reset_index()
    df['day_index'] = np.arange(len(df))
    
    X = df[['day_index']].values
    y = df['Close'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    forecasts = {}
    last_index = df['day_index'].iloc[-1]
    
    for p in periods:
        future_index = last_index + p
        pred = model.predict([[future_index]])[0]
        forecasts[f'{p}_days'] = float(pred)
        
    return forecasts

def get_stock_details(symbol):
    """
    Combines technical indicators, trends, and forecasts.
    """
    ticker = yf.Ticker(symbol)
    
    # Fetch historical data (2 years for better analysis)
    hist = ticker.history(period="2y")
    if hist.empty:
        return None

    # 1. Technical Indicators Calculation on the full series
    # We'll calculate indicators and keep them in the DataFrame
    # 1.1 RSI (14-day)
    delta = hist['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    hist['rsi'] = 100 - (100 / (1 + rs))

    # 1.2 Moving Averages
    hist['ma_20'] = hist['Close'].rolling(window=20).mean()
    hist['ma_50'] = hist['Close'].rolling(window=50).mean()
    hist['ma_200'] = hist['Close'].rolling(window=200).mean()

    # 1.3 MACD
    exp1 = hist['Close'].ewm(span=12, adjust=False).mean()
    exp2 = hist['Close'].ewm(span=26, adjust=False).mean()
    hist['macd'] = exp1 - exp2
    hist['macd_signal'] = hist['macd'].ewm(span=9, adjust=False).mean()
    hist['macd_hist'] = hist['macd'] - hist['macd_signal']

    # 2. Performance Trend (Last 30 days)
    last_30_days = hist.tail(30)
    trend_data = last_30_days['Close'].tolist()
    start_price = trend_data[0]
    end_price = trend_data[-1]
    trend_pct = ((end_price - start_price) / start_price * 100) if start_price > 0 else 0
    
    # 3. Forecasts
    forecasts = get_linear_forecast(hist.copy(), [90, 365])
    
    # 4. Detailed History for Charts (Last 1 year for performance)
    chart_data = hist.tail(252).reset_index()
    chart_data['Date'] = chart_data['Date'].dt.strftime('%Y-%m-%d')
    
    history_list = []
    for _, row in chart_data.iterrows():
        history_list.append({
            'date': row['Date'],
            'open': float(row['Open']),
            'high': float(row['High']),
            'low': float(row['Low']),
            'close': float(row['Close']),
            'volume': int(row['Volume']),
            'rsi': float(row['rsi']) if not pd.isna(row['rsi']) else None,
            'ma_20': float(row['ma_20']) if not pd.isna(row['ma_20']) else None,
            'ma_50': float(row['ma_50']) if not pd.isna(row['ma_50']) else None,
            'ma_200': float(row['ma_200']) if not pd.isna(row['ma_200']) else None,
            'macd': float(row['macd']) if not pd.isna(row['macd']) else None,
            'macd_signal': float(row['macd_signal']) if not pd.isna(row['macd_signal']) else None,
            'macd_hist': float(row['macd_hist']) if not pd.isna(row['macd_hist']) else None,
        })

    info = ticker.info
    current_pe = info.get('trailingPE')
    
    # 5. News-based AI Analysis
    news = ticker.news
    ai_analysis = get_ai_analysis(symbol, news)
    
    return {
        'symbol': symbol,
        'indicators': calculate_technical_indicators(hist.copy()),
        'forecasts': forecasts,
        'performance_trend': {
            'trend_30d_pct': trend_pct,
            'prices': trend_data
        },
        'historical_data': history_list,
        'pe_data': {
            'current_pe': current_pe,
            'historical_pe_mock': [current_pe * (1 + (np.random.random()-0.5)*0.2) for _ in range(5)] if current_pe else []
        },
        'news': news[:5], # Last 5 news articles
        'ai_analysis': ai_analysis,
        'sentiment_score': ai_analysis.get('sentiment_score', 0.5)
    }
