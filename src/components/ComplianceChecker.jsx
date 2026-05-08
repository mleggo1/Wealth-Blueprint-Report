import React, { useMemo, useState, useEffect } from 'react';
import { scanAllSources } from '../utils/complianceChecker';
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '../constants/brand';
import { normalizeEtfMixSaved } from '../data/etfScenarios';

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function ComplianceChecker() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('storage', bump);
    window.addEventListener('wealthBlueprint-report-refresh', bump);
    window.addEventListener('wealthBlueprint-notes-updated', bump);
    window.addEventListener('focus', bump);
    document.addEventListener('visibilitychange', bump);
    return () => {
      window.removeEventListener('storage', bump);
      window.removeEventListener('wealthBlueprint-report-refresh', bump);
      window.removeEventListener('wealthBlueprint-notes-updated', bump);
      window.removeEventListener('focus', bump);
      document.removeEventListener('visibilitychange', bump);
    };
  }, []);

  const findings = useMemo(() => {
    void tick;
    const profile = readJSON('wealthBlueprint_profile') || {};
    const cashflow = readJSON('wealthBlueprint_cashflow');
    const compoundInputs = readJSON('wealthBlueprint_compoundInputs');
    const coachingNotes = localStorage.getItem('wealthBlueprint_coachingNotes') || '';
    const educationNextSteps = localStorage.getItem('wealthBlueprint_educationNextSteps') || '';
    const appendixNotes = localStorage.getItem('wealthBlueprint_appendixNotes') || '';
    const proQuestionsExtra = localStorage.getItem('wealthBlueprint_proQuestionsExtra') || '';
    const etf = normalizeEtfMixSaved(readJSON('wealthBlueprint_etfMix') || {});

    const sources = {
      'App title (static)': `${PRODUCT_NAME} ${PRODUCT_SUBTITLE}`,
      'Client name': String(profile.name ?? ''),
      'Age': String(profile.age ?? ''),
      'Retirement age': String(profile.retirementAge ?? ''),
      'Annual income (stated)': String(profile.annualIncome ?? ''),
      'Passive income goal (stated)': String(profile.passiveIncomeGoal ?? ''),
      'Occupation / context': String(profile.occupation ?? ''),
      'Lifestyle & goals': String(profile.lifestyleGoals ?? ''),
      'Cash flow lab (saved fields)': JSON.stringify(cashflow ?? {}),
      'Compounding lab (saved fields)': JSON.stringify(compoundInputs ?? {}),
      'Coaching notes': coachingNotes,
      'Education next steps': educationNextSteps,
      'Appendix notes': appendixNotes,
      'Questions for professionals (extra)': proQuestionsExtra,
      'ETF scenario (serialized)': JSON.stringify(etf),
    };

    return scanAllSources(sources);
  }, [tick]);

  const totalHits = findings.reduce((n, f) => n + f.hits.length, 0);

  return (
    <div>
      <h2 className="text-3xl font-bold text-wb-navy mb-2">Compliance language checker</h2>
      <p className="text-slate-600 mb-6">
        This tool highlights wording that may increase financial advice or compliance risk. It is a
        drafting aid only. Updated to reduce financial advice and compliance risk — not a
        substitute for legal review.
      </p>

      {totalHits === 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-emerald-900">
          No flagged phrases detected in scanned fields. Sections that reference ETFs, super,
          property, or debt should still include the education-only banners shown in the report.
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-amber-900">
            {totalHits} flag{totalHits === 1 ? '' : 's'} — review and rewrite where needed.
          </p>
          {findings.map(({ label, hits }) => (
            <div
              key={label}
              className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-wb-navy mb-3">{label}</h3>
              <ul className="space-y-2 text-sm">
                {hits.map((h) => (
                  <li key={`${label}-${h.phrase}`} className="border-l-2 border-amber-400 pl-3">
                    <span className="font-medium text-slate-900">“{h.phrase}”</span>
                    <span className="text-slate-600"> — {h.reason}</span>
                    {h.suggestion && (
                      <p className="text-xs text-slate-500 mt-1">Suggestion: {h.suggestion}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
        <p className="font-semibold text-wb-navy mb-2">Still worth a professional pass</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Any live tool output that could read as “matching” a person to a product.</li>
          <li>Imported spreadsheets or pasted notes with platform-specific “how to” steps.</li>
          <li>PDF exports after you change branding, footers, or section order.</li>
        </ul>
      </div>
    </div>
  );
}
