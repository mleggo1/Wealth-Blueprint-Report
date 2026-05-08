import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/formatCurrency';
import { notifyReportRefresh } from '../hooks/useReportData';

// Simplified tax calculation (educational only)
const calculateTax = (income) => {
  if (income <= 18200) return 0;
  if (income <= 45000) return (income - 18200) * 0.19;
  if (income <= 120000) return 5092 + (income - 45000) * 0.325;
  if (income <= 180000) return 29467 + (income - 120000) * 0.37;
  return 51667 + (income - 180000) * 0.45;
};

export default function CashflowTax() {
  const [cashflow, setCashflow] = useState({
    annualIncome: 100000,
    lifestyleSpending: 50000,
    savingsInvestments: 20000,
  });

  useEffect(() => {
    const saved = localStorage.getItem('wealthBlueprint_cashflow');
    if (saved) {
      setCashflow(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wealthBlueprint_cashflow', JSON.stringify(cashflow));
    const id = setTimeout(() => notifyReportRefresh(), 350);
    return () => clearTimeout(id);
  }, [cashflow]);

  const handleChange = (field, value) => {
    const numValue = parseFormattedNumber(value);
    setCashflow((prev) => ({ ...prev, [field]: numValue }));
  };

  const [displayValues, setDisplayValues] = useState({
    annualIncome: formatNumberWithCommas(cashflow.annualIncome),
    lifestyleSpending: formatNumberWithCommas(cashflow.lifestyleSpending),
    savingsInvestments: formatNumberWithCommas(cashflow.savingsInvestments),
  });

  useEffect(() => {
    setDisplayValues({
      annualIncome: formatNumberWithCommas(cashflow.annualIncome),
      lifestyleSpending: formatNumberWithCommas(cashflow.lifestyleSpending),
      savingsInvestments: formatNumberWithCommas(cashflow.savingsInvestments),
    });
  }, [cashflow]);

  const tax = calculateTax(cashflow.annualIncome);
  const afterTax = cashflow.annualIncome - tax;
  const invested = cashflow.savingsInvestments;
  const lifestyle = cashflow.lifestyleSpending;
  const remaining = afterTax - invested - lifestyle;

  const breakdownData = [
    { name: 'Tax', value: tax },
    { name: 'Invested', value: invested },
    { name: 'Lifestyle', value: lifestyle },
    { name: 'Remaining', value: Math.max(0, remaining) },
  ];

  const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b'];

  const tableData = [
    { category: 'Annual Income', amount: cashflow.annualIncome },
    { category: 'Tax (Simplified Estimate)', amount: tax },
    { category: 'After Tax Income', amount: afterTax },
    { category: 'Invested Amount', amount: invested },
    { category: 'Lifestyle Spending', amount: lifestyle },
    { category: 'Remaining', amount: Math.max(0, remaining) },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-wb-navy mb-6">Cash flow education lab</h2>
      <p className="text-slate-600 mb-6">
        Illustrative cash-flow and simplified tax estimates for education only. Tax outcomes depend
        on personal circumstances and should be reviewed with a registered tax agent or accountant.
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Educational Disclaimer:</strong> Tax calculations are simplified and for general educational purposes only. 
          Actual tax obligations may vary based on individual circumstances, deductions, and other factors. 
          Consult a qualified tax professional for accurate tax advice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Income (A$)
          </label>
          <input
            type="text"
            value={displayValues.annualIncome}
            onChange={(e) => {
              setDisplayValues((prev) => ({ ...prev, annualIncome: e.target.value }));
              handleChange('annualIncome', e.target.value);
            }}
            onBlur={() => {
              setDisplayValues((prev) => ({
                ...prev,
                annualIncome: formatNumberWithCommas(cashflow.annualIncome),
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lifestyle Spending (A$)
          </label>
          <input
            type="text"
            value={displayValues.lifestyleSpending}
            onChange={(e) => {
              setDisplayValues((prev) => ({ ...prev, lifestyleSpending: e.target.value }));
              handleChange('lifestyleSpending', e.target.value);
            }}
            onBlur={() => {
              setDisplayValues((prev) => ({
                ...prev,
                lifestyleSpending: formatNumberWithCommas(cashflow.lifestyleSpending),
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Savings/Investments (A$)
          </label>
          <input
            type="text"
            value={displayValues.savingsInvestments}
            onChange={(e) => {
              setDisplayValues((prev) => ({ ...prev, savingsInvestments: e.target.value }));
              handleChange('savingsInvestments', e.target.value);
            }}
            onBlur={() => {
              setDisplayValues((prev) => ({
                ...prev,
                savingsInvestments: formatNumberWithCommas(cashflow.savingsInvestments),
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Table View */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount (A$)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.category}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  A${row.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cashflow Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `A$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Proportion View</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={breakdownData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {breakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `A$${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

