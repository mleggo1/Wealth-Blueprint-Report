import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import etfMetadataData from '../data/etf-metadata.json';
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/formatCurrency';
import {
  ETF_COMFORT_SCENARIOS,
  SCENARIO_LABELS,
  normalizeEtfMixSaved,
} from '../data/etfScenarios';
import { PRODUCT_EXAMPLE_NOTICE, INVESTMENT_EDUCATOR_NOTICE } from '../constants/disclaimers';
import { notifyReportRefresh } from '../hooks/useReportData';

const etfMetadata = etfMetadataData;

export default function ExampleETFMix() {
  const [comfortScenario, setComfortScenario] = useState('growthWeighted');
  const [annualInvest, setAnnualInvest] = useState(24000);
  const [displayAnnualInvest, setDisplayAnnualInvest] = useState(formatNumberWithCommas(24000));

  useEffect(() => {
    const saved = localStorage.getItem('wealthBlueprint_etfMix');
    if (saved) {
      const n = normalizeEtfMixSaved(JSON.parse(saved));
      setComfortScenario(n.comfortScenario);
      setAnnualInvest(n.annualInvest);
      setDisplayAnnualInvest(formatNumberWithCommas(n.annualInvest));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'wealthBlueprint_etfMix',
      JSON.stringify({
        comfortScenario,
        annualInvest,
        allocations: ETF_COMFORT_SCENARIOS[comfortScenario] || ETF_COMFORT_SCENARIOS.growthWeighted,
      })
    );
    setDisplayAnnualInvest(formatNumberWithCommas(annualInvest));
    notifyReportRefresh();
  }, [comfortScenario, annualInvest]);

  const selectedMix =
    ETF_COMFORT_SCENARIOS[comfortScenario] || ETF_COMFORT_SCENARIOS.growthWeighted;

  const growthETFs = ['IVV.AX', 'NDQ.AX', 'EBTC.XA', 'EETH.XA'];

  const growthAllocation = selectedMix
    .filter((etf) => growthETFs.includes(etf.symbol))
    .reduce((sum, etf) => sum + etf.allocation, 0);
  const defensiveAllocation = 100 - growthAllocation;

  const growthDefensiveData = [
    { name: 'Growth-style (example)', value: growthAllocation },
    { name: 'Defensive-style (example)', value: defensiveAllocation },
  ];

  const allocationData = selectedMix.map((etf) => ({
    name: etfMetadata[etf.symbol]?.name || etf.symbol,
    allocation: etf.allocation,
    amount: (annualInvest * etf.allocation) / 100,
  }));

  return (
    <div>
      <h2 className="text-3xl font-bold text-wb-navy mb-2">Investment Educator — ETF examples</h2>
      <p className="text-slate-600 mb-2">
        Explore common investment concepts and example asset classes for education only. This tool
        does not recommend financial products or tell users what to invest in.
      </p>
      <p className="text-sm text-slate-700 mb-4 font-medium">{INVESTMENT_EDUCATOR_NOTICE}</p>

      <div className="rounded-xl bg-amber-50/90 border border-amber-200/80 p-4 mb-6 text-sm text-slate-800">
        {PRODUCT_EXAMPLE_NOTICE}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Investment comfort level (education scenario)
          </label>
          <select
            value={comfortScenario}
            onChange={(e) => setComfortScenario(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-wb-gold focus:border-wb-gold"
          >
            {Object.keys(ETF_COMFORT_SCENARIOS).map((key) => (
              <option key={key} value={key}>
                {SCENARIO_LABELS[key] || key}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            You selected an interest in exploring this hypothetical education example — not a label
            about who you are as an investor.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Illustrative annual amount (A$)
          </label>
          <input
            type="text"
            value={displayAnnualInvest}
            onChange={(e) => {
              setDisplayAnnualInvest(e.target.value);
              const numValue = parseFormattedNumber(e.target.value);
              setAnnualInvest(numValue);
            }}
            onBlur={() => {
              setDisplayAnnualInvest(formatNumberWithCommas(annualInvest));
            }}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-wb-gold"
            placeholder="0"
          />
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
        <h3 className="text-lg font-semibold text-wb-navy mb-4">
          Growth-style vs defensive-style weights (hypothetical)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={growthDefensiveData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={({ name, value }) => name + ': ' + value + '%'}
            >
              {growthDefensiveData.map((entry, index) => (
                <Cell key={'cell-' + index} fill={index === 0 ? '#0f766e' : '#0c4a6e'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
        <h3 className="text-lg font-semibold text-wb-navy mb-4">Example weights by holding</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={allocationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip formatter={(value) => String(value) + '%'} />
            <Legend />
            <Bar dataKey="allocation" fill="#0c4a6e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {selectedMix.map((etf) => {
          const metadata = etfMetadata[etf.symbol];
          const amount = (annualInvest * etf.allocation) / 100;
          return (
            <div
              key={etf.symbol}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-wb-navy">{etf.symbol}</h4>
                <span className="text-sm font-bold text-amber-800">{etf.allocation}%</span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{metadata?.name || 'ETF'}</p>
              <p className="text-xs text-slate-500 mb-2">{metadata?.description || ''}</p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">Illustrative annual slice</p>
                <p className="text-lg font-bold text-slate-900">A${amount.toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <h3 className="text-lg font-semibold text-wb-navy p-4 bg-slate-50 border-b border-slate-100">
          Hypothetical education example — summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  ETF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Weight %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Illustrative A$/yr
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedMix.map((etf) => {
                const metadata = etfMetadata[etf.symbol];
                const amount = (annualInvest * etf.allocation) / 100;
                return (
                  <tr key={etf.symbol}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {etf.symbol}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">{metadata?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                      {etf.allocation}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right">
                      A${amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
