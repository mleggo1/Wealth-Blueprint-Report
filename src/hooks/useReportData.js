import { useState, useEffect } from 'react';

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function useReportData() {
  const [snapshot, setSnapshot] = useState(() => ({
    profile: readJSON('wealthBlueprint_profile', {}),
    cashflow: readJSON('wealthBlueprint_cashflow', {}),
    compoundInputs: readJSON('wealthBlueprint_compoundInputs', {}),
    etfMix: readJSON('wealthBlueprint_etfMix', {}),
    coachingNotes: localStorage.getItem('wealthBlueprint_coachingNotes') || '',
    educationNextSteps: localStorage.getItem('wealthBlueprint_educationNextSteps') || '',
    appendixNotes: localStorage.getItem('wealthBlueprint_appendixNotes') || '',
    proQuestionsExtra: localStorage.getItem('wealthBlueprint_proQuestionsExtra') || '',
  }));

  useEffect(() => {
    const refresh = () => {
      setSnapshot({
        profile: readJSON('wealthBlueprint_profile', {}),
        cashflow: readJSON('wealthBlueprint_cashflow', {}),
        compoundInputs: readJSON('wealthBlueprint_compoundInputs', {}),
        etfMix: readJSON('wealthBlueprint_etfMix', {}),
        coachingNotes: localStorage.getItem('wealthBlueprint_coachingNotes') || '',
        educationNextSteps: localStorage.getItem('wealthBlueprint_educationNextSteps') || '',
        appendixNotes: localStorage.getItem('wealthBlueprint_appendixNotes') || '',
        proQuestionsExtra: localStorage.getItem('wealthBlueprint_proQuestionsExtra') || '',
      });
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('wealthBlueprint-report-refresh', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('wealthBlueprint-report-refresh', refresh);
    };
  }, []);

  return snapshot;
}

export function notifyReportRefresh() {
  window.dispatchEvent(new Event('wealthBlueprint-report-refresh'));
}
