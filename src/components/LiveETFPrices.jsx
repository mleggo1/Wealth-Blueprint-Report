import React, { useState, useEffect, useCallback, useRef } from 'react';
import etfConfigData from '../data/etfs.json';
import { MiniLineChart } from './MiniLineChart';
import { PerformanceTable } from './PerformanceTable';
import { ETFModal } from './ETFModal';
import { PRODUCT_EXAMPLE_NOTICE } from '../constants/disclaimers';

const etfConfig = etfConfigData;

const YAHOO_CHART_ENDPOINT = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const REMOTE_FALLBACK_URL = 'https://etf-dashboards.vercel.app/data/etf-prices.json';
const SPLIT_THRESHOLD = 7;
const CACHE_KEY = 'wealthBlueprint_etfDataCache';
const CACHE_TIMESTAMP_KEY = 'wealthBlueprint_etfDataTimestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

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

const parseChartBody = (body) => {
  const chartResult = body?.chart?.result?.[0];
  if (!chartResult) {
    throw new Error(body?.chart?.error?.description || 'No chart data returned');
  }
  return chartResult;
};

const fetchYahooPayload = async (symbol, { interval, range }, signal) => {
  const url = new URL(symbol, YAHOO_CHART_ENDPOINT);
  url.searchParams.set('interval', interval);
  url.searchParams.set('range', range);
  const target = url.toString();

  const attempts = [
    async () => {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
      const res = await fetch(proxyUrl, { signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`allorigins raw ${res.status}`);
      const text = await res.text();
      return parseChartBody(JSON.parse(text));
    },
    async () => {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(target)}`;
      const res = await fetch(proxyUrl, { signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`corsproxy ${res.status}`);
      const text = await res.text();
      return parseChartBody(JSON.parse(text));
    },
    async () => {
      const wrapUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`;
      const res = await fetch(wrapUrl, { signal });
      if (!res.ok) throw new Error(`allorigins get ${res.status}`);
      const wrap = await res.json();
      if (!wrap.contents) throw new Error('allorigins empty contents');
      return parseChartBody(JSON.parse(wrap.contents));
    },
    async () => {
      const res = await fetch(target, {
        signal,
        mode: 'cors',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`direct ${res.status}`);
      return parseChartBody(await res.json());
    },
  ];

  let lastErr;
  for (const fn of attempts) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('All Yahoo fetch strategies failed');
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

async function fetchRemoteFallback(signal) {
  try {
    const res = await fetch(REMOTE_FALLBACK_URL, { signal, mode: 'cors' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch (e) {
    console.warn('ETF fallback dataset unavailable', e);
    return null;
  }
}

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

  const etfDataRef = useRef(etfData);
  useEffect(() => {
    etfDataRef.current = etfData;
  }, [etfData]);

  useEffect(() => {
    const cached = loadCachedData();
    if (cached) {
      setEtfData(cached);
      setLoading(false);
      const ts = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (ts) {
        setLastRefreshTimestamp(formatRefreshTimestamp(new Date(parseInt(ts, 10))));
      }
    }
  }, []);

  const loadData = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setErrors({});
    const prev = { ...etfDataRef.current };

    try {
      const liveResults = await Promise.allSettled(
        etfConfig.map(({ symbol }) => fetchYahooSeries(symbol, signal))
      );

      if (signal?.aborted) return;

      const nextData = { ...prev };
      const nextErrors = {};
      let mostRecentPriceDate = null;
      let successCount = 0;

      liveResults.forEach((result, index) => {
        const { symbol } = etfConfig[index];
        if (result.status === 'fulfilled') {
          nextData[symbol] = result.value;
          successCount += 1;
          const prices = result.value.prices;
          if (prices?.length) {
            const lastPriceDate = prices[prices.length - 1].date;
            if (!mostRecentPriceDate || lastPriceDate > mostRecentPriceDate) {
              mostRecentPriceDate = lastPriceDate;
            }
          }
        } else if (!nextData[symbol]) {
          nextErrors[symbol] = result.reason?.message || 'Failed to fetch live data';
        } else {
          console.warn(`Failed to refresh ${symbol}:`, result.reason?.message);
          nextErrors[symbol] = `Refresh failed, using cached data: ${result.reason?.message}`;
        }
      });

      const hasAnySeries = etfConfig.some(
        ({ symbol }) => nextData[symbol]?.prices?.length > 0
      );

      if (!hasAnySeries && successCount === 0) {
        const remote = await fetchRemoteFallback(signal);
        if (remote && typeof remote === 'object') {
          etfConfig.forEach(({ symbol }) => {
            const row = remote[symbol];
            if (row?.prices?.length) {
              nextData[symbol] = { ...row, symbol };
            }
          });
        }
      }

      const refreshDataAsAtDate =
        mostRecentPriceDate ||
        etfConfig
          .map(({ symbol }) => {
            const p = nextData[symbol]?.prices;
            return p?.length ? p[p.length - 1].date : null;
          })
          .filter(Boolean)
          .sort()
          .pop() ||
        new Date().toISOString().slice(0, 10);

      const refreshTimestamp = formatRefreshTimestamp(new Date());
      const tsIso = new Date().toISOString();
      etfConfig.forEach(({ symbol }) => {
        if (nextData[symbol]) {
          const p = nextData[symbol].prices;
          nextData[symbol] = {
            ...nextData[symbol],
            dataTimestamp: tsIso,
            dataAsAtDate: p?.length ? p[p.length - 1].date : refreshDataAsAtDate,
          };
        }
      });

      setEtfData(nextData);
      saveCachedData(nextData);
      setErrors(nextErrors);
      setLastUpdated(refreshDataAsAtDate);
      setLastRefreshTimestamp(refreshTimestamp);
    } catch (err) {
      if (!signal?.aborted) {
        console.error(err);
        setErrors({
          __root:
            err.message || "Couldn't refresh data. Using cached data. Please try again.",
        });
        setLastRefreshTimestamp(formatRefreshTimestamp(new Date()));
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal });
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDataRef.current();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const dataAsAtLabel = lastUpdated || 'n/a';

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-navy-900/50 bg-gradient-to-br from-navy-900 via-navy-900 to-slate-950 px-5 py-5 md:px-6 md:py-6 shadow-[0_25px_60px_-35px_rgba(15,118,110,0.65)]">
        <div className="absolute inset-y-0 right-[-40px] w-48 rounded-full bg-teal-500/20 blur-[80px]" />
        <div className="absolute inset-y-0 left-[-30px] w-36 rounded-full bg-ocean-200/40 blur-[70px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-teal-200 via-emerald-200 to-ocean-200 bg-clip-text text-transparent leading-tight">
              Market data — ETF prices & returns
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300/90 max-w-2xl leading-relaxed">
              Live market data for educational illustration only (Yahoo Finance via proxy). Not an
              instruction to buy, sell, or hold. Charts use cache or a public fallback dataset if
              live updates fail.
            </p>
            <p className="mt-2 text-[10px] sm:text-[11px] text-slate-400">
              <span className="uppercase tracking-[0.18em] text-slate-500">Data as at</span>{' '}
              {dataAsAtLabel}
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500 text-right">
              Refreshed {lastRefreshTimestamp || 'n/a'}
            </span>
            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex justify-center items-center rounded-full border border-teal-400/60 bg-teal-400/10 px-4 py-2 text-xs font-semibold text-teal-100 backdrop-blur transition hover:border-teal-300 hover:bg-teal-300/15 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-800/60 disabled:text-slate-500"
            >
              {loading ? 'Refreshing…' : 'Refresh data'}
            </button>
          </div>
        </div>
      </header>

      <p className="text-sm text-charcoal-800 rounded-xl bg-gold-50/90 border border-gold-200/80 p-3">
        {PRODUCT_EXAMPLE_NOTICE}
      </p>

      <div className="flex gap-2 flex-wrap">
        {['YTD', '1Y', '2Y', '5Y', '10Y', 'ALL'].map((tf) => (
          <button
            key={tf}
            type="button"
            onClick={() => setGlobalTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              globalTimeframe === tf
                ? 'bg-navy-900 text-white shadow-md'
                : 'bg-white/90 text-navy-800 border border-navy-200/70 hover:bg-ocean-50'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-xl font-semibold text-navy-900 mb-4">Growth ETFs</h3>
          <div className="space-y-4">
            {growth.map((etf) => {
              const data = etfData[etf.symbol];
              const latestPoint = data?.prices?.[data.prices.length - 1];
              const previousPoint =
                data?.prices && data.prices.length > 1 ? data.prices[data.prices.length - 2] : null;
              const latestClose = latestPoint?.close ?? null;
              const dailyPct =
                latestClose && previousPoint?.close
                  ? ((latestClose - previousPoint.close) / previousPoint.close) * 100
                  : null;

              return (
                <div
                  key={etf.symbol}
                  className="bg-white border border-navy-200/40 rounded-xl p-4 shadow-sm shadow-navy-900/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-navy-900">{etf.symbol}</div>
                      <div className="text-xs text-charcoal-700">{etf.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-navy-900">
                        {formatCurrency(latestClose, data?.currency)}
                      </div>
                      {dailyPct !== null && (
                        <div
                          className={`text-xs font-medium ${
                            dailyPct >= 0 ? 'text-teal-600' : 'text-red-600'
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
                      className="h-48 cursor-pointer hover:opacity-90 transition-opacity md:cursor-default"
                      onClick={() => {
                        setSelectedETF(etf);
                        setIsModalOpen(true);
                      }}
                      title="Click for detailed chart"
                      role="presentation"
                    >
                      <MiniLineChart timeframe={globalTimeframe} data={data} />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                      {loading ? 'Loading chart…' : 'Chart data unavailable'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-navy-900 mb-4">Defensive ETFs</h3>
          <div className="space-y-4">
            {defensive.map((etf) => {
              const data = etfData[etf.symbol];
              const latestPoint = data?.prices?.[data.prices.length - 1];
              const previousPoint =
                data?.prices && data.prices.length > 1 ? data.prices[data.prices.length - 2] : null;
              const latestClose = latestPoint?.close ?? null;
              const dailyPct =
                latestClose && previousPoint?.close
                  ? ((latestClose - previousPoint.close) / previousPoint.close) * 100
                  : null;

              return (
                <div
                  key={etf.symbol}
                  className="bg-white border border-navy-200/40 rounded-xl p-4 shadow-sm shadow-navy-900/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-navy-900">{etf.symbol}</div>
                      <div className="text-xs text-charcoal-700">{etf.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-navy-900">
                        {formatCurrency(latestClose, data?.currency)}
                      </div>
                      {dailyPct !== null && (
                        <div
                          className={`text-xs font-medium ${
                            dailyPct >= 0 ? 'text-teal-600' : 'text-red-600'
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
                      role="presentation"
                    >
                      <MiniLineChart timeframe={globalTimeframe} data={data} />
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                      {loading ? 'Loading chart…' : 'Chart data unavailable'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PerformanceTable etfData={etfData} etfConfig={etfConfig} />

      {Object.keys(errors).length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-950">
            <strong>Note:</strong> Some data could not be refreshed. Cached, fallback, or historical
            data may be shown so charts stay populated.
          </p>
        </div>
      )}

      <p className="text-xs text-charcoal-700 text-right">
        Source: Yahoo Finance (when available) · Fallback: public ETF dashboard dataset · Cached
        locally · Auto-refresh every 5 minutes
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
