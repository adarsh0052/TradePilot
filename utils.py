import altair as alt

def render_chart(df, strategy):
    # Show last 60 candles
    display_df = df.iloc[-60:].copy()
    
    base = alt.Chart(display_df).encode(
        x=alt.X('timestamp:T', axis=alt.Axis(title=None, format='%H:%M:%S'))
    )

    # Candles
    rule = base.mark_rule().encode(
        y=alt.Y('low:Q', scale=alt.Scale(zero=False), axis=alt.Axis(title='Price')),
        y2='high:Q'
    )
    bar = base.mark_bar().encode(
        y='open:Q',
        y2='close:Q',
        color=alt.condition("datum.open < datum.close", alt.value("#22c55e"), alt.value("#ef4444"))
    )
    chart = rule + bar

    # Indicators Overlay
    if strategy == "SMA Crossover" and 'SMA_S' in display_df:
        line_s = base.mark_line(color='#3b82f6', strokeWidth=2).encode(y='SMA_S')
        line_l = base.mark_line(color='#f97316', strokeWidth=2).encode(y='SMA_L')
        chart = (chart + line_s + line_l)
    elif strategy == "EMA Crossover" and 'EMA_S' in display_df:
        line_s = base.mark_line(color='#3b82f6').encode(y='EMA_S')
        line_l = base.mark_line(color='#f97316').encode(y='EMA_L')
        chart = (chart + line_s + line_l)

    return chart.properties(height=350).interactive()