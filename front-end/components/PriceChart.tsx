import { useEffect, useRef } from 'react';

export default function PriceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const dataPoints = 50;
    const data: number[] = [];
    let currentPrice = 19500;

    for (let i = 0; i < dataPoints; i++) {
      currentPrice += (Math.random() - 0.48) * 150;
      data.push(currentPrice);
    }

    const maxPrice = Math.max(...data);
    const minPrice = Math.min(...data);
    const priceRange = maxPrice - minPrice;

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const xStep = chartWidth / (dataPoints - 1);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((price, index) => {
      const x = padding + index * xStep;
      const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    data.forEach((price, index) => {
      const x = padding + index * xStep;
      const y = padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      const price = maxPrice - (priceRange / 4) * i;
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`₹${price.toFixed(0)}`, padding - 10, y + 4);
      ctx.setLineDash([5, 5]);
    }

    ctx.setLineDash([]);
  }, []);

  return (
    <div className="w-full h-80 relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={320}
        className="w-full h-full"
      />
    </div>
  );
}
