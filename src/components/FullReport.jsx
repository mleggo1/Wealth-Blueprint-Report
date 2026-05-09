import React from 'react';
import { useReportData } from '../hooks/useReportData';
import {
  MASTER_DISCLAIMER,
  IMPORTANT_EDUCATION_NOTICE,
  FOOTER_SHORT,
  EXTERNAL_TOOLS_NOTICE,
  PRODUCT_EXAMPLE_NOTICE,
  PORTFOLIO_EXAMPLE_NOTICE,
  DEBT_SECTION_NOTICE,
  SUPER_SECTION_NOTICE,
  PROPERTY_SECTION_NOTICE,
  CRYPTO_SECTION_NOTICE,
  INVESTMENT_EDUCATOR_NOTICE,
  BEFORE_YOU_ACT,
} from '../constants/disclaimers';
import { PRODUCT_NAME, PRODUCT_SUBTITLE, PRODUCT_TAGLINE, PREPARER_NAME } from '../constants/brand';
import etfMetadataData from '../data/etf-metadata.json';
import etfListData from '../data/etfs.json';
import { SCENARIO_LABELS, normalizeEtfMixSaved } from '../data/etfScenarios';

const etfMeta = etfMetadataData;
const ETF_LIST_NAME = Object.fromEntries(etfListData.map((e) => [e.symbol, e.name]));

function etfFullName(symbol) {
  if (!symbol) return '';
  return (
    ETF_LIST_NAME[symbol] ||
    etfMeta[symbol]?.description?.split('.')[0]?.trim() ||
    symbol
  );
}

function SectionCard({ id, title, children, banner }) {
  return (
    <section id={id} className="report-section break-inside-avoid mb-10 scroll-mt-24">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none print:border-slate-300">
        <h2 className="text-xl font-bold text-wb-navy border-b border-amber-200/80 pb-3 mb-4">
          {title}
        </h2>
        {banner && (
          <div className="mb-4 rounded-xl bg-amber-50/90 border border-amber-200/80 px-4 py-3 text-sm text-slate-800 leading-relaxed">
            {banner}
          </div>
        )}
        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </section>
  );
}

export default function FullReport({ showScreenChrome = true }) {
  const d = useReportData();
  const p = d.profile || {};
  const cf = d.cashflow || {};
  const ci = d.compoundInputs || {};
  const etfNorm = normalizeEtfMixSaved(d.etfMix);
  const scenarioLabel = SCENARIO_LABELS[etfNorm.comfortScenario] || etfNorm.comfortScenario;

  const reportDate = new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className={`money-coaching-report ${showScreenChrome ? 'rounded-2xl border border-slate-200 bg-slate-50/50 p-6 md:p-10' : ''}`}
    >
      {showScreenChrome && (
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-700/90 mb-1">
            {PRODUCT_SUBTITLE}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-wb-navy">{PRODUCT_NAME}</h1>
          <p className="text-slate-600 mt-2 max-w-2xl mx-auto">{PRODUCT_TAGLINE}</p>
        </header>
      )}

      {/* 1 Cover (always first in export) */}
      <SectionCard id="cover" title="Cover page">
        <div className="text-center space-y-4 py-4">
          <p className="text-2xl font-bold text-wb-navy">{PRODUCT_NAME}</p>
          <p className="text-lg text-slate-700">{PRODUCT_SUBTITLE}</p>
          <p className="text-slate-500 italic">{PRODUCT_TAGLINE}</p>
          <div className="pt-6 space-y-2 text-base">
            <p>
              <span className="font-semibold text-wb-navy">Prepared for:</span>{' '}
              {p.name?.trim() ? p.name : '—'}
            </p>
            <p>
              <span className="font-semibold text-wb-navy">Prepared by:</span> {PREPARER_NAME}
            </p>
            <p>
              <span className="font-semibold text-wb-navy">Date:</span> {reportDate}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 2 Notice */}
      <SectionCard id="notice" title="Important education notice">
        <p>{IMPORTANT_EDUCATION_NOTICE}</p>
        <p className="mt-4 font-medium text-wb-navy">Master disclaimer</p>
        <p>{MASTER_DISCLAIMER}</p>
      </SectionCard>

      {/* 3 Client snapshot */}
      <SectionCard id="snapshot" title="Client snapshot">
        <p>
          Based on the information you provided, this section summarises your current financial
          picture for coaching and education purposes.
        </p>
        <ul className="list-disc pl-5 space-y-1 mt-3">
          <li>
            <strong>Name:</strong> {p.name?.trim() || '—'}
          </li>
          <li>
            <strong>Age:</strong> {p.age ?? '—'}
          </li>
          <li>
            <strong>Occupation / context:</strong> {p.occupation?.trim() || '—'}
          </li>
          <li>
            <strong>Retirement age (stated):</strong> {p.retirementAge ?? '—'}
          </li>
          <li>
            <strong>Income (modelling field):</strong>{' '}
            {p.annualIncome != null ? `A$${Number(p.annualIncome).toLocaleString()}` : '—'}
          </li>
          <li>
            <strong>Passive income goal (stated, annual):</strong>{' '}
            {p.passiveIncomeGoal != null
              ? `A$${Number(p.passiveIncomeGoal).toLocaleString()}`
              : '—'}
          </li>
        </ul>
      </SectionCard>

      {/* 4 Stated goals */}
      <SectionCard id="goals" title="Stated goals">
        <p>Your stated goals and reflections captured in this builder include:</p>
        <div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4">
          {p.lifestyleGoals?.trim() ? p.lifestyleGoals : '— Add goals and learning themes in Client snapshot.'}
        </div>
        <p className="mt-3">
          This report organises those themes into education sections. It does not tell you what you
          must implement.
        </p>
      </SectionCard>

      {/* 5 Financial clarity */}
      <SectionCard id="clarity" title="Financial clarity summary">
        <p>
          The main opportunity is to improve clarity, organisation, and education before making
          financial decisions.
        </p>
        <p>
          Use this report as a <strong>learning framework</strong> and{' '}
          <strong>decision-support summary</strong> for your own research and professional
          conversations — not as a directive to adopt a specific product or structure.
        </p>
      </SectionCard>

      {/* 6 Cash flow education */}
      <SectionCard id="cashflow" title="Cash flow education">
        <p>
          This section summarises cash-flow concepts using figures you entered for illustration.
          Tax outcomes here are simplified and educational only.
        </p>
        <ul className="list-disc pl-5 mt-3 space-y-1">
          <li>
            <strong>Annual income (lab field):</strong>{' '}
            {cf.annualIncome != null ? `A$${Number(cf.annualIncome).toLocaleString()}` : '—'}
          </li>
          <li>
            <strong>Lifestyle spending (lab field):</strong>{' '}
            {cf.lifestyleSpending != null
              ? `A$${Number(cf.lifestyleSpending).toLocaleString()}`
              : '—'}
          </li>
          <li>
            <strong>Savings / investments (lab field):</strong>{' '}
            {cf.savingsInvestments != null
              ? `A$${Number(cf.savingsInvestments).toLocaleString()}`
              : '—'}
          </li>
        </ul>
        <p className="mt-3">
          Potential areas to review include budgeting concepts, surplus patterns, emergency-fund
          education, and automation ideas. Questions about tax or structure are best discussed with
          a registered tax agent or accountant.
        </p>
      </SectionCard>

      {/* 7 Debt */}
      <SectionCard id="debt" title="Debt and mortgage education" banner={DEBT_SECTION_NOTICE}>
        <p>
          Allowed topics for self-study include interest rates, offset and redraw concepts,
          repayment frequency, principal-and-interest vs interest-only (definitions), loan-to-value
          ratio, refinancing concepts, and debt reduction ideas.
        </p>
        <p>
          Debt structure may be worth reviewing with a licensed mortgage broker, financial
          adviser, or accountant if you choose to seek personal guidance.
        </p>
      </SectionCard>

      {/* 8 Investment education */}
      <SectionCard
        id="invest-edu"
        title="Investment education"
        banner={PRODUCT_EXAMPLE_NOTICE}
      >
        <p>
          Common investment concepts include diversification, volatility, fees, time horizon,
          liquidity, income vs growth, compounding, and dollar-cost averaging. Some investors
          research broad-market ETFs, diversified funds, property, cash, bonds, or other asset
          classes — as general information, not as a prompt to act.
        </p>
        <p className="font-medium text-wb-navy mt-3">{INVESTMENT_EDUCATOR_NOTICE}</p>
      </SectionCard>

      {/* 9 Example scenarios */}
      <SectionCard
        id="examples"
        title="Example education scenarios"
        banner={
          <>
            <p className="mb-2">{PORTFOLIO_EXAMPLE_NOTICE}</p>
            <p>{PRODUCT_EXAMPLE_NOTICE}</p>
          </>
        }
      >
        <p>
          Hypothetical education example selected in the Investment Educator:{' '}
          <strong>{scenarioLabel}</strong>.
        </p>
        {etfNorm.annualInvest != null && (
          <p className="mt-2">
            Illustrative annual amount used in the lab:{' '}
            <strong>A${Number(etfNorm.annualInvest).toLocaleString()}</strong> (not an instruction to
            invest that amount).
          </p>
        )}
        <p className="mt-3 font-medium text-wb-navy">Example weights (education only)</p>
        <div className="overflow-x-auto mt-2 rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3">Holding (example)</th>
                <th className="text-right p-3">Weight %</th>
              </tr>
            </thead>
            <tbody>
              {(etfNorm.allocations || []).length ? (
                etfNorm.allocations.map((row) => (
                  <tr key={row.symbol} className="border-t border-slate-100">
                    <td className="p-3">
                      {row.symbol} — {etfFullName(row.symbol)}
                    </td>
                    <td className="p-3 text-right">{row.allocation}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-4 text-slate-500">
                    Open the Investment Educator tool and choose a scenario to populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 10 Super */}
      <SectionCard id="super" title="Superannuation education" banner={SUPER_SECTION_NOTICE}>
        <p>
          Superannuation is an important area to understand and, where appropriate, review with a
          licensed adviser. Educational concepts include fees, historical performance (with
          limitations), insurance, investment options, contribution types, preservation rules, tax
          treatment, and retirement income rules.
        </p>
      </SectionCard>

      {/* 11 Property */}
      <SectionCard id="property" title="Property education" banner={PROPERTY_SECTION_NOTICE}>
        <p>
          Property can be discussed as education only: cash flow, yield, vacancy, maintenance,
          insurance, liquidity, leverage, location risk, interest-rate risk, tax considerations
          (general), management, and due diligence.
        </p>
        <p>ROI examples are estimates only and should not be treated as guaranteed returns.</p>
      </SectionCard>

      {/* 12 Crypto */}
      <SectionCard id="crypto" title="Crypto / digital asset education" banner={CRYPTO_SECTION_NOTICE}>
        <p>
          Topics may include volatility, custody, regulation, tax treatment (general), loss risk,
          security, and speculation risk.
        </p>
      </SectionCard>

      {/* 13 Tools */}
      <SectionCard
        id="tools"
        title="Wealth Blueprint tools used"
        banner={EXTERNAL_TOOLS_NOTICE}
      >
        <ul className="list-disc pl-5 space-y-3">
          <li>
            <strong>Compounding lab</strong> — Explore hypothetical growth paths with editable
            assumptions (not forecasts).
          </li>
          <li>
            <strong>Investment Educator (ETF examples)</strong> — {INVESTMENT_EDUCATOR_NOTICE}
          </li>
          <li>
            <strong>Market data (live prices)</strong> — Third-party data for learning; not an
            instruction to trade.
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-600">
          Starting balance (lab):{' '}
          {ci.startingBalance != null
            ? `A$${Number(ci.startingBalance).toLocaleString()}`
            : '—'}
          ; monthly contribution:{' '}
          {ci.monthlyContribution != null
            ? `A$${Number(ci.monthlyContribution).toLocaleString()}`
            : '—'}
          ; horizon: {ci.timeHorizon != null ? `${ci.timeHorizon} yrs` : '—'}; assumed return
          (illustrative): {ci.expectedReturn != null ? `${ci.expectedReturn}%` : '—'}.
        </p>
      </SectionCard>

      {/* 14 Coaching notes */}
      <SectionCard id="coaching" title="Coaching notes">
        <div className="whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4 min-h-[120px]">
          {d.coachingNotes?.trim() || '—'}
        </div>
      </SectionCard>

      {/* 15 Education next steps */}
      <SectionCard id="next-steps" title="Education next steps">
        <div className="whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4 min-h-[100px]">
          {d.educationNextSteps?.trim() || (
            <span className="text-slate-500">
              Add education next steps in the Education path screen.
            </span>
          )}
        </div>
      </SectionCard>

      {/* 16 Questions for professionals */}
      <SectionCard id="questions-pro" title="Questions for licensed professionals">
        <ul className="list-disc pl-5 space-y-2">
          <li>Does my current super structure fit my stated goals after considering fees and insurance?</li>
          <li>What are the tax trade-offs of different structures for my situation?</li>
          <li>How should I think about debt repayment vs investing surplus (conceptually)?</li>
          <li>What risks am I not seeing in this education example?</li>
        </ul>
        {d.proQuestionsExtra?.trim() && (
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4">
            {d.proQuestionsExtra}
          </div>
        )}
      </SectionCard>

      {/* 17 Before you act */}
      <SectionCard id="before-you-act" title={BEFORE_YOU_ACT.title}>
        <p>{BEFORE_YOU_ACT.intro}</p>
        <ol className="list-decimal pl-5 space-y-2 mt-3">
          {BEFORE_YOU_ACT.points.map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ol>
      </SectionCard>

      {/* 18 Appendix */}
      <SectionCard id="appendix" title="Appendix / sources / notes">
        <div className="whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-4 min-h-[80px]">
          {d.appendixNotes?.trim() || '—'}
        </div>
        <p className="mt-4 text-xs text-slate-500">{FOOTER_SHORT}</p>
      </SectionCard>
    </div>
  );
}
