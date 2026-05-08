import React, { useState, useEffect, useRef } from 'react';
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/formatCurrency';
import { parseCoachingWorkbook } from '../utils/coachingWorkbookImport';
import { notifyReportRefresh } from '../hooks/useReportData';

export default function ClientProfile() {
  const [profile, setProfile] = useState({
    name: '',
    age: 40,
    annualIncome: 100000,
    occupation: '',
    retirementAge: 60,
    passiveIncomeGoal: 50000,
    lifestyleGoals: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('wealthBlueprint_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wealthBlueprint_profile', JSON.stringify(profile));
    const id = setTimeout(() => notifyReportRefresh(), 350);
    return () => clearTimeout(id);
  }, [profile]);

  const handleChange = (field, value) => {
    if (field === 'annualIncome' || field === 'passiveIncomeGoal') {
      const numValue = parseFormattedNumber(value);
      setProfile((prev) => ({ ...prev, [field]: numValue }));
    } else {
      setProfile((prev) => ({ ...prev, [field]: value }));
    }
  };

  const [displayValues, setDisplayValues] = useState({
    annualIncome: formatNumberWithCommas(profile.annualIncome),
    passiveIncomeGoal: formatNumberWithCommas(profile.passiveIncomeGoal),
  });

  useEffect(() => {
    setDisplayValues({
      annualIncome: formatNumberWithCommas(profile.annualIncome),
      passiveIncomeGoal: formatNumberWithCommas(profile.passiveIncomeGoal),
    });
  }, [profile.annualIncome, profile.passiveIncomeGoal]);

  const fileInputRef = useRef(null);
  const [importMessage, setImportMessage] = useState(null);

  const handleCoachingWorkbookImport = async (file) => {
    setImportMessage(null);
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const { profile: imported, coachingNotes, warnings } =
        parseCoachingWorkbook(buf);

      setProfile((prev) => {
        const next = { ...prev, ...imported };
        if (prev.lifestyleGoals && imported.lifestyleGoals) {
          next.lifestyleGoals = `${imported.lifestyleGoals}\n\n---\n\n${prev.lifestyleGoals}`;
        }
        return next;
      });

      const prevNotes = localStorage.getItem('wealthBlueprint_coachingNotes') || '';
      const mergedNotes = coachingNotes
        ? `${coachingNotes}${prevNotes ? `\n\n---\n\n${prevNotes}` : ''}`
        : prevNotes;
      localStorage.setItem('wealthBlueprint_coachingNotes', mergedNotes.trim());
      window.dispatchEvent(new Event('wealthBlueprint-notes-updated'));
      notifyReportRefresh();

      const warnText = warnings.length ? ` ${warnings.join(' ')}` : '';
      setImportMessage(`Imported “${file.name}”. Review fields and coaching notes.${warnText}`);
    } catch (err) {
      setImportMessage(
        err instanceof Error ? err.message : 'Could not read that Excel file.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-wb-navy mb-6">Client snapshot & stated goals</h2>
      <p className="text-slate-600 mb-6">
        Based on the information you provide, this area feeds the Client snapshot and Stated goals
        sections in your Money Coaching & Education Report. It is for coaching and education only.
      </p>

      <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800 mb-2">
          Import from Wealth Blueprint coaching workbook (.xlsx)
        </p>
        <p className="text-sm text-slate-600 mb-3">
          Loads the <span className="font-medium">Analysis</span> sheet into this profile and
          prepends draft text to Coaching Notes. A bundled template is available at{' '}
          <a
            className="text-blue-700 underline font-medium"
            href="/coaching-blueprint-template.xlsx"
          >
            coaching-blueprint-template.xlsx
          </a>
          .
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="text-sm text-slate-700"
            onChange={(e) => handleCoachingWorkbookImport(e.target.files?.[0])}
          />
        </div>
        {importMessage && (
          <p className="mt-3 text-sm text-slate-800 whitespace-pre-wrap">{importMessage}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name (Optional)
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age
          </label>
          <input
            type="number"
            value={profile.age}
            onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="18"
            max="100"
          />
        </div>

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
                annualIncome: formatNumberWithCommas(profile.annualIncome),
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Occupation
          </label>
          <input
            type="text"
            value={profile.occupation}
            onChange={(e) => handleChange('occupation', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter occupation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planned Retirement Age
          </label>
          <input
            type="number"
            value={profile.retirementAge}
            onChange={(e) => handleChange('retirementAge', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min={profile.age + 1}
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Passive Income Goal (A$ per year)
          </label>
          <input
            type="text"
            value={displayValues.passiveIncomeGoal}
            onChange={(e) => {
              setDisplayValues((prev) => ({ ...prev, passiveIncomeGoal: e.target.value }));
              handleChange('passiveIncomeGoal', e.target.value);
            }}
            onBlur={() => {
              setDisplayValues((prev) => ({
                ...prev,
                passiveIncomeGoal: formatNumberWithCommas(profile.passiveIncomeGoal),
              }));
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stated goals & learning themes (free text)
        </label>
        <textarea
          value={profile.lifestyleGoals}
          onChange={(e) => handleChange('lifestyleGoals', e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter lifestyle goals and aspirations..."
        />
      </div>

      {/* Profile Summary Card */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-wb-navy mb-4">Snapshot summary (education only)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Years to Retirement</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.max(0, profile.retirementAge - profile.age)} years
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Annual Income</p>
            <p className="text-2xl font-bold text-gray-900">
              A${profile.annualIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Passive Income Goal</p>
            <p className="text-2xl font-bold text-gray-900">
              A${profile.passiveIncomeGoal.toLocaleString()}/year
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Retirement Age</p>
            <p className="text-2xl font-bold text-gray-900">Age {profile.retirementAge}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

