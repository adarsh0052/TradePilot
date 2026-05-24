import pandas_ta as ta
import pandas as pd

def get_strategy_signal(df, strategy_type, params):
    """
    Analyzes the DataFrame and returns a signal (BUY/SELL/HOLD) and UI text.
    params: dict of strategy settings (rsi_limit, sma_window, etc.)
    """
    signal = "HOLD"
    text = ""
    curr_price = df['close'].iloc[-1]
    
    if strategy_type == "RSI Reversal":
        df['RSI'] = ta.rsi(df['close'], length=14)
        rsi = df['RSI'].iloc[-1]
        text = f"RSI: {rsi:.1f}"
        
        if rsi < params['rsi_buy']: signal = "BUY"
        elif rsi > params['rsi_sell']: signal = "SELL"
        
    elif strategy_type == "SMA Crossover":
        df['SMA_S'] = ta.sma(df['close'], length=params['sma_s'])
        df['SMA_L'] = ta.sma(df['close'], length=params['sma_l'])
        s, l = df['SMA_S'].iloc[-1], df['SMA_L'].iloc[-1]
        text = f"S:{s:.1f} L:{l:.1f}"
        
        if s > l: signal = "BUY"
        elif s < l: signal = "SELL"

    elif strategy_type == "EMA Crossover":
        df['EMA_S'] = ta.ema(df['close'], length=params['ema_s'])
        df['EMA_L'] = ta.ema(df['close'], length=params['ema_l'])
        s, l = df['EMA_S'].iloc[-1], df['EMA_L'].iloc[-1]
        text = f"S:{s:.1f} L:{l:.1f}"
        
        if s > l: signal = "BUY"
        elif s < l: signal = "SELL"
        
    elif strategy_type == "Volume Breakout":
        vol = df['volume'].iloc[-1]
        avg_vol = df['volume'].rolling(20).mean().iloc[-1]
        text = f"V:{vol} Avg:{int(avg_vol)}"
        
        if vol > avg_vol * params['vol_multi']:
            if curr_price > df['close'].iloc[-2]: signal = "BUY"
            else: signal = "SELL"
            
    return signal, text