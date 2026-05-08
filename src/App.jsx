import React, { useState, useEffect } from 'react';
import DisclaimerGate from './components/DisclaimerGate';
import FullReport from './components/FullReport';
import ClientProfile from './components/ClientProfile';
import CashflowTax from './components/CashflowTax';
import CompoundInterestPro from './components/CompoundInterestPro';
import ExampleETFMix from './components/ExampleETFMix';
import LiveETFPrices from './components/LiveETFPrices';
import CoachingNotes from './components/CoachingNotes';
import EducationNextStepsForm from './components/EducationNextStepsForm';
import ComplianceChecker from './components/ComplianceChecker';
import PDFExport from './components/PDFExport';
import FooterDisclaimer from './components/FooterDisclaimer';
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from './constants/brand';

const NAV = [
  { id: 'report', label: 'Money coaching report' },
  { id: 'profile', label: 'Client snapshot' },
  { id: 'cashflow', label: 'Cash flow lab' },
  { id: 'compound', label: 'Compounding lab' },
  { id: 'etf', label: 'Investment Educator' },
  { id: 'live', label: 'Market data' },
  { id: 'notes', label: 'Coaching notes' },
  { id: 'next', label: 'Education path' },
  { id: 'compliance', label: 'Language checker' },
  { id: 'export', label: 'Export PDF' },
];

function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('report');

  useEffect(() => {
    const accepted = localStorage.getItem('wealthBlueprint_disclaimerAccepted');
    if (accepted === 'true') {
      setDisclaimerAccepted(true);
    }
  }, []);

  const handleDisclaimerAccept = () => {
    setDisclaimerAccepted(true);
    localStorage.setItem('wealthBlueprint_disclaimerAccepted', 'true');
  };

  if (!disclaimerAccepted) {
    return <DisclaimerGate onAccept={handleDisclaimerAccept} />;
  }

  return (
    <div className="min-h-screen bg-wb-ocean text-charcoal-900 print:bg-white">
      <header className="border-b border-navy-900/10 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-navy-900/5 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
              {PRODUCT_SUBTITLE}
            </p>
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="logo-wealth">{PRODUCT_NAME}</span>
              <span className="text-navy-900"> — Report builder</span>
            </h1>
          </div>
          <p className="text-xs text-charcoal-700 max-w-md leading-relaxed">
            Updated to reduce financial advice and compliance risk. Education and coaching only.
          </p>
        </div>
        <nav className="max-w-7xl mx-auto px-2 pb-3 overflow-x-auto print:hidden">
          <div className="flex gap-1 min-w-max md:flex-wrap md:min-w-0">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentScreen(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  currentScreen === item.id
                    ? 'bg-navy-900 text-white shadow-md shadow-navy-900/20'
                    : 'bg-white/80 text-navy-800 border border-navy-200/80 hover:bg-ocean-50 hover:border-teal-600/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div
          className={`rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm p-6 md:p-8 shadow-lg shadow-navy-900/5 mb-8 print:border-0 print:shadow-none print:bg-white ${
            currentScreen === 'report' ? 'print:block' : 'print:hidden'
          }`}
        >
          {currentScreen === 'report' && <FullReport showScreenChrome />}
          {currentScreen === 'profile' && <ClientProfile />}
          {currentScreen === 'cashflow' && <CashflowTax />}
          {currentScreen === 'compound' && <CompoundInterestPro />}
          {currentScreen === 'etf' && <ExampleETFMix />}
          {currentScreen === 'live' && <LiveETFPrices />}
          {currentScreen === 'notes' && <CoachingNotes />}
          {currentScreen === 'next' && <EducationNextStepsForm />}
          {currentScreen === 'compliance' && <ComplianceChecker />}
          {currentScreen === 'export' && <PDFExport />}
        </div>

        <FooterDisclaimer />
      </main>
    </div>
  );
}

export default App;
