import React, { useState } from 'react';
import { MASTER_DISCLAIMER } from '../constants/disclaimers';
import { PRODUCT_NAME, PRODUCT_SUBTITLE, PRODUCT_TAGLINE } from '../constants/brand';

export default function DisclaimerGate({ onAccept }) {
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <div className="min-h-screen bg-wb-ocean flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-navy-200/40">
        <div className="bg-navy-900 text-white px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-y-0 right-[-40px] w-40 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute inset-y-0 left-[-30px] w-32 rounded-full bg-ocean-200/30 blur-3xl" />
          <div className="relative">
            <p className="text-gold-500 text-sm font-semibold tracking-wide uppercase mb-2">
              {PRODUCT_SUBTITLE}
            </p>
            <h1 className="text-4xl font-bold mb-3 logo-wealth tracking-tight">{PRODUCT_NAME}</h1>
            <p className="text-slate-200 text-lg leading-snug">{PRODUCT_TAGLINE}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-ocean-50/80 rounded-xl p-6 mb-6 max-h-80 overflow-y-auto border border-ocean-100">
            <h2 className="text-lg font-semibold text-navy-900 mb-3">
              Important — read before you continue
            </h2>
            <p className="text-charcoal-800 whitespace-pre-line leading-relaxed text-sm">
              {MASTER_DISCLAIMER}
            </p>
          </div>

          <div className="flex items-start gap-3 mb-6 p-4 bg-gold-50/90 rounded-xl border border-gold-200/80">
            <input
              type="checkbox"
              id="accept-checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 text-navy-900 border-slate-300 rounded focus:ring-gold-500"
            />
            <label
              htmlFor="accept-checkbox"
              className="text-charcoal-800 cursor-pointer text-sm leading-relaxed"
            >
              I understand this is for general education and money coaching only. It is not financial
              advice or a personal recommendation. I am responsible for my own decisions.
            </label>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!accepted}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition ${
              accepted
                ? 'bg-navy-900 text-white hover:bg-navy-800 shadow-lg shadow-navy-900/25'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            Continue to report builder
          </button>
        </div>
      </div>
    </div>
  );
}
