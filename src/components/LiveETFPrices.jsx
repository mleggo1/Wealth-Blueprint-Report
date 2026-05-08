import React, { useState, useEffect, useCallback, useMemo } from 'react';
import etfConfigData from '../data/etfs.json';
import etfMetadataData from '../data/etf-metadata.json';
import { MiniLineChart } from './MiniLineChart';
import { PerformanceTable } from './PerformanceTable';
import { ETFModal } from './ETFModal';
import { PRODUCT_EXAMPLE_NOTICE } from '../constants/disclaimers';

const etfConfig = etfConfigData;
const etfMetadata = etfMetadataData;

const YAHOO_CHART_ENDPOINT = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const SPLIT_THRESHOLD = 7;
const CACHE_KEY = 'wealthBlueprint_etfDataCache';
const CACHE_TIMESTAMP_KEY = 'wealthBlueprint_etfDataTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const formatRefreshTimestamp = (date = new Date()) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${day}/${month}/${year}, ${displayHours}:${minutes}:${seconds} ${ampm}`;
};

const fetchYahooPayload = async (symbol, { interval, range }, signal) => {
  const url = new URL(symbol, YAHOO_CHART_ENDPOINT);
  url.searchParams.set('interval', interval);
  url.searchParams.set('range', range);
  
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url.toString())}`;
  
  let res;
  try {
    res = await fetch(proxyUrl, { signal, headers: { 'Accept': 'application/json' } });
  } catch (networkError) {
    try {
      res = await fetch(url.toString(), { signal, mode: 'cors' });
    } catch (directError) {
      throw new Error(`Network error: ${networkError.message || directError.message}`);
    }
  }
  
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}): ${res.statusText}`);
  }
  
  const body = await res.json();
  const chartResult = body?.chart?.result?.[0];
  if (!chartResult) {
    throw new Error(body?.chart?.error?.description || 'No chart data returned');
  }
  return chartResult;
};

const extractPricePairs = (chartResult) => {
  const timestamps = chartResult.timestamp ?? [];
  const adjCloseSeries = chartResult.indicators?.adjclose?.[0]?.adjclose;
  const closeSeries = chartResult.indicators?.quote?.[0]?.close;
  const prices = adjCloseSeries && adjCloseSeries.length ? adjCloseSeries : closeSeries ?? [];
  const pairs = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const ts = timestamps[i];
    const value = prices[i];
    if (typeof ts !== 'number') continue;
    if (value === null || value === undefined || Number.isNaN(value)) continue;
    const date = new Date(ts * 1000).toISOString().slice(0, 10);
    pairs.push([date, Number.parseFloat(Number(value).toFixed(2))]);
  }
  return pairs;
};

const normalizeForSplits = (pairs) => {
  if (!pairs.length) return [];
  const sorted = [...pairs]
    .map(([date, close]) => ({ date, close }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const adjusted = new Array(sorted.length);
  let factor = 1;
  adjusted[sorted.length - 1] = {
    ...sorted[sorted.length - 1],
    close: Number(sorted[sorted.length - 1].close.toFixed(2)),
  };

  for (let i = sorted.length - 2; i >= 0; i -= 1) {
    const current = sorted[i];
    const nextRaw = sorted[i + 1];
    if (current.close && nextRaw.close) {
      const ratio = current.close / nextRaw.close;
      const inverse = nextRaw.close / current.close;
      if (ratio > SPLIT_THRESHOLD) {
        factor *= ratio;
      } else if (inverse > SPLIT_THRESHOLD) {
        factor /= inverse;
      }
    }
    adjusted[i] = {
      ...current,
      close: Number((current.close / factor).toFixed(2)),
    };
  }

  return adjusted;
};

const fetchYahooSeries = async (symbol, signal) => {
  const [monthly, daily] = await Promise.all([
    fetchYahooPayload(symbol, { range: 'max', interval: '1mo' }, signal),
    fetchYahooPayload(symbol, { range: '10y', interval: '1d' }, signal).catch((error) => {
      console.warn(`Daily data unavailable for ${symbol}, using monthly only.`, error);
      return null;
    }),
  ]);

  const combined = extractPricePairs(monthly);
  if (daily) {
    extractPricePairs(daily).forEach((pair) => combined.push(pair));
  }
  const normalized = normalizeForSplits(combined);

  const deduped = new Map();
  normalized.forEach(({ date, close }) => {
    deduped.set(date, close);
  });

  const prices = [...deduped.entries()]
    .map(([date, close]) => ({ date, close }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (!prices.length) {
    throw new Error('No price points available');
  }

  const referenceMeta = daily ?? monthly;
  const lastUpdated =
    referenceMeta.meta?.regularMarketTime
      ? new Date(referenceMeta.meta.regularMarketTime * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  return {
    symbol,
    prices,
    currency: referenceMeta.meta?.currency || 'AUD',
    exchangeName: referenceMeta.meta?.exchangeName,
    lastUpdated,
  };
};

const loadCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (e) {
    console.warn('Failed to load cached ETF data', e);
  }
  return null;
};

const saveCachedData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));
  } catch (e) {
    console.warn('Failed to save cached ETF data', e);
  }
};

export default function LiveETFPrices() {
  const [etfData, setEtfData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(null);
  const [globalTimeframe, setGlobalTimeframe] = useState('YTD');
  const [selectedETF, setSelectedETF] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    const cached = loadCachedData();
    if (cached) {
      setEtfData(cached);
      setLoading(false);
      setLastRefreshTimestamp(formatRefreshTimestamp(new Date(parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY), 10))));
    }
  }, []);

  const loadData = useCallback(
    async ({ signal, allowFallback = true } = {}) => {
      setLoading(true);
      setErrors({});

      try {
        const liveResults = await Promise.allSettled(
          etfConfig.map(({ symbol }) => fetchYahooSeries(symbol, signal))
        );

        if (signal?.aborted) return;

        const nextData = { ...etfData }; // Start with current data
        const nextErrors = {};
        let mostRecentPriceDate = null;
        let hasNewData = false;

        liveResults.forEach((result, index) => {
          const { symbol } = etfConfig[index];
          if (result.status === 'fulfilled') {
            nextData[symbol] = result.value;
            hasNewData = true;
            const prices = result.value.prices;
            if (prices && prices.length > 0) {
              const lastPriceDate = prices[prices.length - 1].date;
              if (!mostRecentPriceDate || lastPriceDate > mostRecentPriceDate) {
                mostRecentPriceDate = lastPriceDate;
              }
            }
          } else {
            // Keep existing data for this symbol if fetch failed
            if (!nextData[symbol]) {
              nextErrors[symbol] = result.reason?.message || 'Failed to fetch live data';
            } else {
              console.warn(`Failed to refresh ${symbol}:`, result.reason?.message);
              nextErrors[symbol] = `Refresh failed, using cached data: ${result.reason?.message}`;
            }
          }
        });

        // Only update if we got at least some new data, or preserve existing
        if (hasNewData || Object.keys(nextData).length > 0) {
          setEtfData(nextData);
          saveCachedData(nextData); // Save to cache
        }
        setErrors(nextErrors);

        const refreshDataAsAtDate =
          mostRecentPriceDate ||
          (Object.values(nextData).length > 0 && Object.values(nextData)[0]?.prices?.length > 0
            ? Object.values(nextData)[0].prices[Object.values(nextData)[0].prices.length - 1].date
            : new Date().toISOString().slice(0, 10));
        setLastUpdated(refreshDataAsAtDate);

        const refreshTimestamp = formatRefreshTimestamp(new Date());
        setLastRefreshTimestamp(refreshTimestamp);
        
        // Add timestamp to each ETF data object
        Object.keys(nextData).forEach((symbol) => {
          if (nextData[symbol]) {
            nextData[symbol].dataTimestamp = new Date().toISOString();
            nextData[symbol].dataAsAtDate = nextData[symbol].prices?.[nextData[symbol].prices.length - 1]?.date || refreshDataAsAtDate;
          }
        });
      } catch (err) {
        if (!signal?.aborted) {
          console.error(err);
          setErrors({ __root: err.message || "Couldn't refresh data. Using cached data. Please try again." });
          const refreshTimestamp = formatRefreshTimestamp(new Date());
          setLastRefreshTimestamp(refreshTimestamp);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [etfData]
  );

  // Initial load
  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadData]);

  const growth = etfConfig.filter((e) => e.group === 'growth');
  const defensive = etfConfig.filter((e) => e.group === 'defensive');

  const formatCurrency = (value, currency = 'AUD') => {
    if (value === null || value === undefined) return '—';
    try {
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency || 'AUD',
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `$${value?.toFixed(2)}`;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-wb-navy">Market data — ETF prices & returns</h2>
          <p className="text-slate-600 mt-2">
            Live market data for educational illustration only (Yahoo Finance via proxy). Not an
            instruction to buy, sell, or hold. Charts may use cache when live updates fail.
          </p>
          <p className="text-sm text-slate-700 mt-3 rounded-lg bg-amber-50/90 border border-amber-200/80 p-3">
            {PRODUCT_EXAMPLE_NOTICE}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-gray-500">
            REFRESHED {lastRefreshTimestamp || 'n/a'}
          </span>
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {loading ? 'Refreshing…' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Timeframe Toolbar */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['YTD', '1Y', '2Y', '5Y', '10Y', 'ALL'].map((tf) => (
          <button
            key={tf}
            onClick={() => setGlobalTimeframe(tf)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              globalTimeframe === tf
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* ETF Cards with Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Growth ETFs</h3>
          <div className="space-y-4">
            {growth.map((etf) => {
              const data = etfData[etf.symbol];
              const latestPoint = data?.prices?.[data.prices.length - 1];
              const previousPoint = data?.prices && data.prices.length > 1 ? data.prices[data.prices.length - 2] : null;
              const latestClose = latestPoint?.close ?? null;
              const dailyPct =
                latestClose && previousPoint?.close
                  ? ((latestClose - previousPoint.close) / previousPoint.close) * 100
                  : null;

              return (
                <div
                  key={etf.symbol}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{etf.symbol}</div>
                      <div className="text-xs text-gray-600">{etf.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(latestClose, data?.currency)}</div>
                      {dailyPct !== null && (
                        <div
                          className={`text-xs font-medium ${
                            dailyPct >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {dailyPct >= 0 ? '+' : ''}
                          {dailyPct.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                  {data && data.prices && data.prices.length > 0 ? (
                    <div className="h-48">
                      <MiniLineChart timeframe={globalTimeframe} data={data} />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                      {loading ? 'Loading chart...' : 'Chart data unavailable'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Defensive ETFs</h3>
          <div className="space-y-4">
            {defensive.map((etf) => {
              const data = etfData[etf.symbol];
              const latestPoint = data?.prices?.[data.prices.length - 1];
              const previousPoint = data?.prices && data.prices.length > 1 ? data.prices[data.prices.length - 2] : null;
              const latestClose = latestPoint?.close ?? null;
              const dailyPct =
                latestClose && previousPoint?.close
                  ? ((latestClose - previousPoint.close) / previousPoint.close) * 100
                  : null;

              return (
                <div
                  key={etf.symbol}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{etf.symbol}</div>
                      <div className="text-xs text-gray-600">{etf.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(latestClose, data?.currency)}</div>
                      {dailyPct !== null && (
                        <div
                          className={`text-xs font-medium ${
                            dailyPct >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {dailyPct >= 0 ? '+' : ''}
                          {dailyPct.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </div>
                  {data && data.prices && data.prices.length > 0 ? (
                    <div
                      className="h-48 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setSelectedETF(etf);
                        setIsModalOpen(true);
                      }}
                      title="Click to view detailed chart and ETF information"
                    >
                      <MiniLineChart timeframe={globalTimeframe} data={data} />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                      {loading ? 'Loading chart...' : 'Chart data unavailable'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <PerformanceTable etfData={etfData} etfConfig={etfConfig} />

      {Object.keys(errors).length > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Some data could not be refreshed. Using cached/historical data to ensure charts remain populated.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 text-right mt-4">
        Source: Yahoo Finance · Data cached for offline viewing · Auto-refreshes every 5 minutes
        {lastUpdated && ` · Data as at: ${lastUpdated}`}
      </p>

      <ETFModal
        etf={selectedETF}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedETF(null);
        }}
        etfData={etfData}
      />
    </div>
  );
}
