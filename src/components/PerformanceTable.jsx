import React from 'react';

const calculateReturns = (prices, periods) => {
  if (!prices || prices.length < 2) return null;
  
  const sortedPrices = [...prices].sort((a, b) => new Date(a.date) - new Date(b.date));
  const currentPrice = sortedPrices[sortedPrices.length - 1].close;
  const results = {};

  periods.forEach((period) => {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() - period);
    targetDate.setHours(0, 0, 0, 0);
    
    // Find the closest price point to the target date (before or on that date)
    let pastPrice = null;
    let pastDate = null;
    
    for (let i = sortedPrices.length - 1; i >= 0; i--) {
      const priceDate = new Date(sortedPrices[i].date);
      if (priceDate <= targetDate) {
        pastPrice = sortedPrices[i].close;
        pastDate = priceDate;
        break;
      }
    }
    
    if (pastPrice && pastPrice > 0 && pastDate) {
      // Calculate actual years between dates
      const yearsDiff = (new Date(sortedPrices[sortedPrices.length - 1].date) - pastDate) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (yearsDiff > 0.1) { // At least 0.1 years (about 36 days)
        const annualized = Math.pow(currentPrice / pastPrice, 1 / yearsDiff) - 1;
        results[`${period}Y`] = (annualized * 100).toFixed(1);
      }
    }
  });

  return results;
};

export const PerformanceTable = ({ etfData, etfConfig }) => {
  const rows = etfConfig.map((etf) => {
    const data = etfData[etf.symbol];
    const returns = data?.prices ? calculateReturns(data.prices, [1, 3, 5, 10]) : null;

    return {
      etf: `${etf.symbol} – ${etf.name}`,
      y1: returns?.['1Y'] ? `${returns['1Y']}%` : '—',
      y3: returns?.['3Y'] ? `${returns['3Y']}%` : '—',
      y5: returns?.['5Y'] ? `${returns['5Y']}%` : '—',
      y10: returns?.['10Y'] ? `${returns['10Y']}%` : '—',
    };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
          Historical Performance (Annualised)
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ETF
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              1 YR
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              3 YRS
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              5 YRS
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              10 YRS
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row) => (
            <tr key={row.etf} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.etf}</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{row.y1}</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{row.y3}</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{row.y5}</td>
              <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">{row.y10}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-1">
          Note: Returns calculated from available price data. Some ETFs may not have full 5/10-year history.
        </p>
        {etfData && Object.values(etfData).length > 0 && (
          <p className="text-xs text-gray-500">
            Data timestamp: {Object.values(etfData)[0]?.dataTimestamp 
              ? new Date(Object.values(etfData)[0].dataTimestamp).toLocaleString('en-AU')
              : 'N/A'}
          </p>
        )}
      </div>
    </div>
  );
};

