import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/formatCurrency';
import { formatCompactAud } from '../utils/formatCompactAud';
import { notifyReportRefresh } from '../hooks/useReportData';

// Simulation function (adapted from Ultimate Target)
function simulate({
  currentAge,
  retirementAge,
  horizonYears,
  startAssets,
  monthlySave,
  preAnnualGross,
  postRealAnnualGross,
  inflationAnnual,
  annualSpendToday,
}) {
  const months = Math.max(1, Math.round(horizonYears * 12));
  const postNominal = (1 + postRealAnnualGross) * (1 + inflationAnnual) - 1;
  const mPre = Math.pow(1 + preAnnualGross, 1 / 12) - 1;
  const mPost = Math.pow(1 + postNominal, 1 / 12) - 1;
  const mInfl = Math.pow(1 + inflationAnnual, 1 / 12) - 1;
  const toRet = Math.max(0, Math.round((retirementAge - currentAge) * 12));

  const rows = [];
  let bal = Math.max(0, startAssets);
  rows.push({ age: Math.floor(currentAge), balance: bal });

  for (let m = 1; m <= months; m++) {
    const age = currentAge + m / 12;
    const pre = m <= toRet;
    const r = pre ? mPre : mPost;
    const c = pre ? monthlySave : 0;
    const msr = Math.max(0, m - toRet);
    const sp = msr > 0 ? (annualSpendToday / 12) * Math.pow(1 + mInfl, msr) : 0;

    bal = bal * (1 + r) + c - sp;
    if (bal < 0) bal = 0;

    if (m % 12 === 0) {
      rows.push({ age: Math.floor(age), balance: bal });
    }
  }

  return { rows, endBalance: bal };
}

export default function CompoundInterestPro() {
  const [inputs, setInputs] = useState({
    startingBalance: 200000,
    monthlyContribution: 1500,
    expectedReturn: 8.0,
    timeHorizon: 30,
    inflation: 2.5,
    annualSpend: 60000,
  });

  const [profile, setProfile] = useState({
    currentAge: 40,
    retirementAge: 60,
  });

  useEffect(() => {
    const savedInputs = localStorage.getItem('wealthBlueprint_compoundInputs');
    const savedProfile = localStorage.getItem('wealthBlueprint_profile');
    if (savedInputs) setInputs(JSON.parse(savedInputs));
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      setProfile({ currentAge: p.age || 40, retirementAge: p.retirementAge || 60 });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wealthBlueprint_compoundInputs', JSON.stringify(inputs));
    const id = setTimeout(() => notifyReportRefresh(), 350);
    return () => clearTimeout(id);
  }, [inputs]);

  const handleInputChange = (field, value) => {
    if (field === 'startingBalance' || field === 'monthlyContribution' || field === 'annualSpend') {
      const numValue = parseFormattedNumber(value);
      setInputs((prev) => ({ ...prev, [field]: numValue }));
    } else {
      setInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const [displayValues, setDisplayValues] = useState({
    startingBalance: formatNumberWithCommas(inputs.startingBalance),
    monthlyContribution: formatNumberWithCommas(inputs.monthlyContribution),
    annualSpend: formatNumberWithCommas(inputs.annualSpend),
  });

  useEffect(() => {
    setDisplayValues({
      startingBalance: formatNumberWithCommas(inputs.startingBalance),
      monthlyContribution: formatNumberWithCommas(inputs.monthlyContribution),
      annualSpend: formatNumberWithCommas(inputs.annualSpend),
    });
  }, [inputs.startingBalance, inputs.monthlyContribution, inputs.annualSpend]);

  const horizonYears = Math.max(1, profile.retirementAge - profile.currentAge + (inputs.timeHorizon - (profile.retirementAge - profile.currentAge)));

  const simulation = useMemo(
    () =>
      simulate({
        currentAge: profile.currentAge,
        retirementAge: profile.retirementAge,
        horizonYears: Math.max(horizonYears, inputs.timeHorizon),
        startAssets: inputs.startingBalance,
        monthlySave: inputs.monthlyContribution,
        preAnnualGross: inputs.expectedReturn / 100,
        postRealAnnualGross: (inputs.expectedReturn - inputs.inflation) / 100,
        inflationAnnual: inputs.inflation / 100,
        annualSpendToday: inputs.annualSpend,
      }),
    [profile, inputs, horizonYears]
  );

  const retirementBalance = simulation.rows.find((r) => r.age >= profile.retirementAge)?.balance || 0;
  const projectedIncome = retirementBalance * 0.04; // 4% rule (educational)

  const fmtAUD = (n) => 'A$' + (n || 0).toLocaleString('en-AU', { maximumFractionDigits: 0 });

  return (
    <div>
      <h2 className="text-3xl font-bold text-wb-navy mb-6">Compounding lab</h2>
      <p className="text-slate-600 mb-6">
        Hypothetical projections for education only. All figures are examples and may not reflect
        actual future outcomes. Past performance is not indicative of future results.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Educational Note:</strong> Hypothetical projection for education only. 
          Actual investment returns will vary and may be negative. Past performance is not indicative of future results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Starting Balance (A$)
          </label>
          <input
            type="text"
            value={displayValues.startingBalance}
            onChange={(e) => {
              setDisplayValues((prev) => ({ ...prev, startingBalance: e.target.value }));
              handleInputChange('startingBalance', e.target.value);
            }}
            onBlur={() => {
              setDisplayValues((prev) => ({
                ...prev,
                startingBalance: formatNumberWithCommas(inputs.startingBalance),
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Contributions (A$)
          </label>
          <input
            type="text"
            value={displayValues.monthlyContribution}
            onChange={(e) => {
              setDisplayValues((prev) => ({ ...prev, monthlyContribution: e.target.value }));
              handleInputChange('monthlyContribution', e.target.value);
            }}
            onBlur={() => {
              setDisplayValues((prev) => ({
                ...prev,
                monthlyContribution: formatNumberWithCommas(inputs.monthlyContribution),
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Return (% p.a.)
          </label>
          <input
            type="number"
            value={inputs.expectedReturn}
            onChange={(e) => handleInputChange('expectedReturn', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            max="20"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Horizon (Years)
          </label>
          <input
            type="range"
            value={inputs.timeHorizon}
            onChange={(e) => handleInputChange('timeHorizon', parseInt(e.target.value))}
            className="w-full"
            min="5"
            max="50"
            step="1"
          />
          <div className="text-center mt-1 text-sm text-gray-600">{inputs.timeHorizon} years</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inflation (% p.a.)
          </label>
          <input
            type="number"
            value={inputs.inflation}
            onChange={(e) => handleInputChange('inflation', parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="0"
            max="10"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Spend in Retirement (A$)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={inputs.annualSpend}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                handleInputChange('annualSpend', value);
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(inputs.annualSpend / 500000) * 100}%, #e5e7eb ${(inputs.annualSpend / 500000) * 100}%, #e5e7eb 100%)`
              }}
              min="0"
              max="500000"
              step="1000"
            />
            <input
              type="text"
              value={displayValues.annualSpend}
              onChange={(e) => {
                setDisplayValues((prev) => ({ ...prev, annualSpend: e.target.value }));
                handleInputChange('annualSpend', e.target.value);
              }}
              onBlur={() => {
                const numValue = parseFormattedNumber(displayValues.annualSpend);
                const clampedValue = Math.min(500000, Math.max(0, numValue));
                handleInputChange('annualSpend', clampedValue);
                setDisplayValues((prev) => ({
                  ...prev,
                  annualSpend: formatNumberWithCommas(clampedValue),
                }));
              }}
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg bg-white text-center font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>A$0</span>
            <span>A$500,000</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-1">Balance at Retirement (Age {profile.retirementAge})</p>
          <p className="text-3xl font-bold text-blue-900">{fmtAUD(retirementBalance)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-1">Projected Income (4% Rule - Educational)</p>
          <p className="text-3xl font-bold text-green-900">{fmtAUD(projectedIncome)}/year</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-1">End Balance (Age {profile.currentAge + inputs.timeHorizon})</p>
          <p className="text-3xl font-bold text-purple-900">{fmtAUD(simulation.endBalance)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 pl-2 pr-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance Over Time (Hypothetical Projection)</h3>
        <ResponsiveContainer width="100%" height={420}>
          <LineChart
            data={simulation.rows}
            margin={{ left: 8, right: 28, top: 20, bottom: 52 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              label={{
                value: 'Age (years)',
                position: 'bottom',
                offset: 36,
                style: { textAnchor: 'middle', fill: '#374151', fontSize: 13 },
              }}
            />
            <YAxis
              width={76}
              tick={{ fontSize: 11 }}
              tickMargin={10}
              tickFormatter={(v) => formatCompactAud(v)}
              label={{
                value: 'Balance',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#374151', fontSize: 13 },
                offset: 2,
              }}
            />
            <Tooltip formatter={(value) => fmtAUD(value)} labelFormatter={(l) => `Age ${l}`} />
            <Legend verticalAlign="top" height={28} wrapperStyle={{ paddingBottom: 8 }} />
            <ReferenceLine
              x={profile.retirementAge}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{
                value: `Retirement (${profile.retirementAge})`,
                position: 'top',
                fill: '#b45309',
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#0d9488"
              strokeWidth={3}
              dot={false}
              name="Projected balance (illustrative)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Balance Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 p-4 bg-gray-50">
          Balance at Selected Ages (Example Projection)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance (A$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {simulation.rows
                .filter((r, i) => i % 5 === 0 || r.age === profile.retirementAge)
                .map((row) => (
                  <tr key={row.age} className={row.age === profile.retirementAge ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {fmtAUD(row.balance)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

