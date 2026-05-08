import React, { useMemo } from 'react';
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

const formatDateLabel = (dateString, timeframe) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  switch (timeframe) {
    case 'YTD':
    case '1Y':
      return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    case '2Y':
    case '5Y':
      return date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
    case '10Y':
    case 'ALL':
    default:
      return date.getFullYear().toString();
  }
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

export const EnlargedChart = ({ timeframe, data }) => {
  const gradientId = useMemo(
    () => `enlargedGradient-${data?.symbol?.replace(/[^a-zA-Z0-9]/g, '') ?? 'default'}`,
    [data?.symbol]
  );

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[240px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-400">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[240px]">
        <div className="text-center text-red-500">
          <p className="text-sm">Data unavailable: {data.error}</p>
        </div>
      </div>
    );
  }

  const filtered = filterByTimeframe(data.prices, timeframe);
  if (!filtered.length) {
    return (
      <div className="flex items-center justify-center h-full min-h-[240px]">
        <div className="text-center text-gray-400">
          <p className="text-sm">Not enough data for {timeframe}</p>
        </div>
      </div>
    );
  }

  const first = filtered[0];
  const last = filtered[filtered.length - 1];
  const cumulativeReturn =
    first && last ? (((last.close - first.close) / first.close) * 100).toFixed(2) : null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const point = filtered.find((p) => p.date === label);
      const periodReturn =
        point && first ? (((point.close - first.close) / first.close) * 100).toFixed(2) : null;

      return (
        <div className="rounded-lg border border-blue-300 bg-white p-3 shadow-lg">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-semibold text-gray-900 mb-1">{formatCurrency(value, data.currency)}</p>
          {periodReturn !== null && (
            <p className="text-xs text-blue-600">
              {periodReturn >= 0 ? '+' : ''}
              {periodReturn}% since period start
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full min-h-[280px]">
      <div className="mb-2 flex items-center justify-between shrink-0">
        <div className="text-sm text-gray-600">
          <span className="text-gray-500">Period return: </span>
          <span className={cumulativeReturn >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            {cumulativeReturn !== null ? `${cumulativeReturn >= 0 ? '+' : ''}${cumulativeReturn}%` : '—'}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filtered} margin={{ top: 12, right: 16, bottom: 56, left: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDateLabel(value, timeframe)}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#e5e7eb"
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(value) => formatCurrency(value, data.currency)}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            stroke="#e5e7eb"
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={{ stroke: '#e5e7eb' }}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
          />
        </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

