import React, { useState, useEffect } from 'react';
import { notifyReportRefresh } from '../hooks/useReportData';

export default function EducationNextStepsForm() {
  const [educationNextSteps, setEducationNextSteps] = useState('');
  const [appendixNotes, setAppendixNotes] = useState('');
  const [proQuestionsExtra, setProQuestionsExtra] = useState('');

  useEffect(() => {
    setEducationNextSteps(localStorage.getItem('wealthBlueprint_educationNextSteps') || '');
    setAppendixNotes(localStorage.getItem('wealthBlueprint_appendixNotes') || '');
    setProQuestionsExtra(localStorage.getItem('wealthBlueprint_proQuestionsExtra') || '');
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem('wealthBlueprint_educationNextSteps', educationNextSteps);
      localStorage.setItem('wealthBlueprint_appendixNotes', appendixNotes);
      localStorage.setItem('wealthBlueprint_proQuestionsExtra', proQuestionsExtra);
      notifyReportRefresh();
    }, 300);
    return () => clearTimeout(t);
  }, [educationNextSteps, appendixNotes, proQuestionsExtra]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-wb-navy mb-2">Education path & appendix</h2>
      <p className="text-slate-600 mb-6">
        Capture education next steps, your own sources, and extra questions for licensed
        professionals. This text flows into the Money Coaching & Education Report.
      </p>

      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-wb-navy mb-2">Education next steps</h3>
          <p className="text-sm text-slate-600 mb-3">
            Topics to research, documents to gather, and areas to review before making
            decisions — not instructions to buy products or open accounts.
          </p>
          <textarea
            value={educationNextSteps}
            onChange={(e) => setEducationNextSteps(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-wb-gold focus:ring-1 focus:ring-wb-gold"
            placeholder="e.g. Learn how broad-market ETFs work. Review your super fees and insurance in the product disclosure materials."
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-wb-navy mb-2">
            Questions for licensed professionals (extra)
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            Add your own questions for an adviser, accountant, tax agent, lawyer, or mortgage
            broker. The report includes a standard prompt list plus this field.
          </p>
          <textarea
            value={proQuestionsExtra}
            onChange={(e) => setProQuestionsExtra(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-wb-gold focus:ring-1 focus:ring-wb-gold"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-wb-navy mb-2">Appendix — sources & notes</h3>
          <textarea
            value={appendixNotes}
            onChange={(e) => setAppendixNotes(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-wb-gold focus:ring-1 focus:ring-wb-gold"
            placeholder="Links, reading, and session notes (education only)."
          />
        </div>
      </div>
    </div>
  );
}
