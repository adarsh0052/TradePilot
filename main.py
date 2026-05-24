import streamlit as st
import pandas as pd
import time
from datetime import datetime

# Import Custom Modules
from simulation import generate_initial_history, generate_next_candle
from strategies import get_strategy_signal
from utils import render_chart

# --- CONFIG ---
st.set_page_config(page_title="Adaptive_Trading_Bot", layout="wide")
st.title("🤖 Adaptive Trading Bot")


# --- SIDEBAR ---
st.sidebar.header("1. Market Configuration")
market_type = st.sidebar.selectbox("Select Market", ["Equity (NSE)", "Commodity (MCX)"])
product_type = st.sidebar.selectbox("Product Type", ["INTRADAY (MIS)", "CARRY FORWARD (NRML/CNC)"])

st.sidebar.header("2. Strategy & Indicators")
strategy_type = st.sidebar.selectbox("Select Strategy", ["RSI Reversal", "SMA Crossover", "EMA Crossover"])

# Strategy Params Dictionary
params = {'rsi_buy': 30, 'rsi_sell': 70, 'sma_s': 10, 'sma_l': 20, 'ema_s': 9, 'ema_l': 21, 'vol_multi': 1.5}

if strategy_type == "RSI Reversal":
    params['rsi_buy'] = st.sidebar.number_input("Buy if RSI Below", 30)
    params['rsi_sell'] = st.sidebar.number_input("Sell if RSI Above", 70)
elif strategy_type == "SMA Crossover":
    params['sma_s'] = st.sidebar.number_input("Short Window", 10)
    params['sma_l'] = st.sidebar.number_input("Long Window", 20)
elif strategy_type == "EMA Crossover":
    params['ema_s'] = st.sidebar.number_input("Short Window (Fast)", value=9, min_value=2)
    params['ema_l'] = st.sidebar.number_input("Long Window (Slow)", value=21, min_value=5)

st.sidebar.header("3. Execution Settings")
quantity = st.sidebar.number_input("Trade Quantity", min_value=1, value=1)
poll_interval = st.sidebar.slider("Speed (sec/candle)", 0.5, 3.0, 1.0)
allow_shorts = st.sidebar.checkbox("Allow Shorting", False)

# --- STATE INIT ---
if 'logs' not in st.session_state: st.session_state.logs = []
if 'held_quantity' not in st.session_state: st.session_state.held_quantity = 0
if 'avg_price' not in st.session_state: st.session_state.avg_price = 0.0
if 'realized_pnl' not in st.session_state: st.session_state.realized_pnl = 0.0
if 'bot_running' not in st.session_state: st.session_state.bot_running = False
if 'last_signal' not in st.session_state: st.session_state.last_signal = "HOLD"

# Simulation State
if 'chart_data' not in st.session_state: st.session_state.chart_data = generate_initial_history(market_type)
if 'market_trend' not in st.session_state: st.session_state.market_trend = 0
if 'trend_duration' not in st.session_state: st.session_state.trend_duration = 0

# --- LAYOUT ---
col1, col2 = st.columns([3, 1])

with col1:
    st.subheader(f"📈 HDFC {market_type}")
    chart_spot = st.empty()
    m1, m2 = st.columns(2)
    price_spot = m1.empty()
    pnl_spot = m2.empty()

with col2:
    st.subheader("📋 Log")
    status_spot = st.empty()
    log_spot = st.empty()

# Initial Render
log_spot.code("\n".join(st.session_state.logs) if st.session_state.logs else "Ready...", language="text")
chart_spot.altair_chart(render_chart(st.session_state.chart_data, strategy_type), use_container_width=True)

start_btn = st.button("🚀 Start Simulation", type="primary")
stop_btn = st.button("🛑 Stop")

if start_btn: st.session_state.bot_running = True
if stop_btn: st.session_state.bot_running = False

# --- MAIN LOOP ---
if st.session_state.bot_running:
    while st.session_state.bot_running:
        
        # 1. GENERATE NEW DATA
        last_row = st.session_state.chart_data.iloc[-1]
        new_candle, trend, duration = generate_next_candle(
            last_row, market_type, 
            st.session_state.market_trend, 
            st.session_state.trend_duration
        )
        
        # Update Trend State
        st.session_state.market_trend = trend
        st.session_state.trend_duration = duration
        
        # Update Dataframe
        new_df = pd.DataFrame([new_candle])
        st.session_state.chart_data = pd.concat([st.session_state.chart_data, new_df], ignore_index=True).tail(200)
        df = st.session_state.chart_data.copy()
        curr_price = new_candle['close']

        # 2. STRATEGY ANALYSIS
        signal, ind_text = get_strategy_signal(df, strategy_type, params)

        # 3. EXECUTION & PNL
        executed = False
        trade_pnl = 0.0

        if signal != st.session_state.last_signal and signal in ["BUY", "SELL"]:
            if signal == "BUY":
                old_qty = st.session_state.held_quantity
                if old_qty < 0:
                    trade_pnl = (st.session_state.avg_price - curr_price) * quantity
                    st.session_state.realized_pnl += trade_pnl
                
                total_qty = old_qty + quantity
                if total_qty != 0:
                    if old_qty >= 0:
                        st.session_state.avg_price = ((old_qty * st.session_state.avg_price) + (quantity * curr_price)) / total_qty
                    else:
                        if total_qty > 0: st.session_state.avg_price = curr_price
                
                st.session_state.held_quantity += quantity
                executed = True

            elif signal == "SELL":
                can_sell = st.session_state.held_quantity >= quantity or allow_shorts
                if can_sell:
                    old_qty = st.session_state.held_quantity
                    if old_qty > 0:
                        trade_pnl = (curr_price - st.session_state.avg_price) * quantity
                        st.session_state.realized_pnl += trade_pnl
                    
                    new_qty = old_qty - quantity
                    if new_qty < 0 and old_qty <= 0:
                        total_short = abs(new_qty)
                        st.session_state.avg_price = ((abs(old_qty) * st.session_state.avg_price) + (quantity * curr_price)) / total_short
                    elif new_qty < 0 and old_qty > 0:
                        st.session_state.avg_price = curr_price
                        
                    st.session_state.held_quantity -= quantity
                    executed = True
            # LOGIC END

            if executed:
                st.session_state.last_signal = signal
                ts = datetime.now().strftime('%H:%M:%S')
                pnl_str = f" | PnL: {trade_pnl:+.2f}" if trade_pnl != 0 else ""
                st.session_state.logs.insert(0, f"[{ts}] {signal} {quantity} @ {curr_price:.2f}{pnl_str}")

        # 4. UI UPDATES
        chart_spot.altair_chart(render_chart(df, strategy_type), use_container_width=True)
        
        p_col = "inverse" if signal == "BUY" else ("off" if signal == "SELL" else "normal")
        price_spot.metric("Price", f"₹{curr_price:,.2f}", ind_text, delta_color=p_col)
        
        unrealized = (curr_price - st.session_state.avg_price) * st.session_state.held_quantity
        total_pnl = st.session_state.realized_pnl + unrealized
        pnl_spot.metric(f"Total PnL (Qty: {st.session_state.held_quantity})", 
                        f"₹{total_pnl:,.2f}", 
                        f"Realized: ₹{st.session_state.realized_pnl:,.2f}")
        
        log_spot.code("\n".join(st.session_state.logs[:10]), language="text")
        status_spot.info(f"Market Trend: {'Bullish 🐂' if st.session_state.market_trend > 0 else 'Bearish 🐻'}")
        
        if not st.session_state.bot_running: break
        time.sleep(poll_interval)