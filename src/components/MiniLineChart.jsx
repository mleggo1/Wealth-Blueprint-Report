import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const filterByTimeframe = (prices, timeframe) => {
  if (!prices) return [];
  if (timeframe === 'ALL') return prices;

  const lastDate = new Date(prices[prices.length - 1].date);
  const start = new Date(lastDate);

  switch (timeframe) {
    case 'YTD':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case '1Y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    case '2Y':
      start.setFullYear(start.getFullYear() - 2);
      break;
    case '5Y':
      start.setFullYear(start.getFullYear() - 5);
      break;
    case '10Y':
      start.setFullYear(start.getFullYear() - 10);
      break;
    default:
      break;
  }

  return prices.filter((p) => new Date(p.date) >= start);
};

const formatCurrency = (value, currency) => {
  if (value === undefined || value === null) return '';
  try {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency || 'AUD',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value}`;
  }
};

const formatDateLabel = (dateString, timeframe) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  switch (timeframe) {
    case 'YTD':
    case '1Y':
      return date.toLocaleDateString('en-AU', { month: 'short' });
    case '2Y':
    case '5Y':
      return date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
    case '10Y':
    case 'ALL':
    default:
      return date.getFullYear().toString();
  }
};

export const MiniLineChart = ({ timeframe, data }) => {
  if (!data) {
    return <div className="text-xs text-gray-400">Loading chart...</div>;
  }

  if (data.error) {
    return <div className="text-xs text-red-500">Data unavailable: {data.error}</div>;
  }

  const filtered = filterByTimeframe(data.prices, timeframe);
  if (!filtered.length) {
    return <div className="text-xs text-gray-400">Not enough data for {timeframe}</div>;
  }

  const first = filtered[0];
  const last = filtered[filtered.length - 1];
  const pct =
    first && last ? (((last.close - first.close) / first.close) * 100).toFixed(2) : null;

  const gradientId = React.useMemo(
    () => `lineGradient-${data?.symbol?.replace(/[^a-zA-Z0-9]/g, '') ?? 'default'}`,
    [data?.symbol]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">{timeframe}</span>
        <span className={pct >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {pct ? `${pct >= 0 ? '+' : ''}${pct}%` : ''}
        </span>
      </div>
      <div className="flex-1 min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 6, right: 6, bottom: 24, left: 6 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatDateLabel(value, timeframe)}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#e5e7eb"
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              minTickGap={14}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => formatCurrency(value, data.currency)}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#e5e7eb"
              axisLine={false}
              tickLine={false}
              width={50}
              orientation="right"
            />
            <Tooltip
              formatter={(v) => formatCurrency(v, data.currency)}
              labelFormatter={(l) => `Date: ${l}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                color: '#1f2937',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              itemStyle={{ color: '#1f2937' }}
              labelStyle={{ color: '#4b5563' }}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={`url(#${gradientId})`}
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 3, strokeWidth: 0, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

