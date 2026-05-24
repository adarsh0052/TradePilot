import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_initial_history(market_type):
    """Generates 100 candles of history so the chart isn't empty on load."""
    if "Commodity" in market_type:
        price = 59500.0
        volatility = 0.0005 # 0.05% per minute
    else:
        price = 1450.0
        volatility = 0.0008 # 0.08% per minute

    data = []
    now = datetime.now()
    current_time = now - timedelta(minutes=100)
    
    for _ in range(100):
        # Random Walk Math
        change_pct = np.random.normal(0, volatility)
        price = price * (1 + change_pct)
        
        # Candle formation
        open_p = price
        close_p = price * (1 + np.random.normal(0, volatility/2))
        high_p = max(open_p, close_p) * (1 + abs(np.random.normal(0, volatility/2)))
        low_p = min(open_p, close_p) * (1 - abs(np.random.normal(0, volatility/2)))
        vol = np.random.randint(100, 1000)
        
        data.append({
            "timestamp": current_time,
            "open": open_p, "high": high_p, "low": low_p, "close": close_p, "volume": vol
        })
        current_time += timedelta(minutes=1)
        
    return pd.DataFrame(data)

def generate_next_candle(last_row, market_type, trend, trend_duration):
    """
    Generates ONE realistic candle based on the previous candle.
    Returns: (new_candle_dict, new_trend, new_trend_duration)
    """
    prev_close = last_row['close']
    
    # 1. Update Market Trend (Randomly shift regime)
    if trend_duration <= 0:
        # Pick a new trend: -0.0005 (Bear) to +0.0005 (Bull)
        trend = np.random.uniform(-0.0005, 0.0005)
        trend_duration = np.random.randint(10, 30)
    else:
        trend_duration -= 1

    # 2. Calculate Price Move
    volatility = 0.0008 if "Equity" in market_type else 0.0005
    noise = np.random.normal(0, volatility)
    movement_pct = trend + noise
    
    curr_close = prev_close * (1 + movement_pct)
    curr_open = prev_close
    
    # 3. Wicks
    wiggle = volatility * prev_close
    curr_high = max(curr_open, curr_close) + abs(np.random.normal(0, wiggle))
    curr_low = min(curr_open, curr_close) - abs(np.random.normal(0, wiggle))
    
    # 4. Volume
    base_vol = 500
    vol_surge = int(abs(movement_pct) * 1000000)
    curr_vol = base_vol + vol_surge + np.random.randint(-100, 100)
    
    new_time = last_row['timestamp'] + timedelta(minutes=1)
    
    new_candle = {
        "timestamp": new_time,
        "open": curr_open, "high": curr_high, "low": curr_low, "close": curr_close, "volume": max(10, curr_vol)
    }
    
    return new_candle, trend, trend_duration