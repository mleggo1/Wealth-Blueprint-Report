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
    <div className="min-h-screen bg-gradient-to-br from-wb-navy via-[#0f2744] to-wb-navy flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-amber-200/40">
        <div className="bg-wb-navy text-white px-8 py-10 text-center">
          <p className="text-amber-400/95 text-sm font-semibold tracking-wide uppercase mb-2">
            {PRODUCT_SUBTITLE}
          </p>
          <h1 className="text-4xl font-bold mb-3">{PRODUCT_NAME}</h1>
          <p className="text-blue-100/90 text-lg">{PRODUCT_TAGLINE}</p>
        </div>

        <div className="p-8">
          <div className="bg-slate-50 rounded-xl p-6 mb-6 max-h-80 overflow-y-auto border border-slate-100">
            <h2 className="text-lg font-semibold text-wb-navy mb-3">Important — read before you continue</h2>
            <p className="text-slate-700 whitespace-pre-line leading-relaxed text-sm">
              {MASTER_DISCLAIMER}
            </p>
          </div>

          <div className="flex items-start gap-3 mb-6 p-4 bg-amber-50/80 rounded-xl border border-amber-200/80">
            <input
              type="checkbox"
              id="accept-checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 text-wb-navy border-slate-300 rounded focus:ring-wb-gold"
            />
            <label htmlFor="accept-checkbox" className="text-slate-700 cursor-pointer text-sm leading-relaxed">
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
                ? 'bg-wb-navy text-white hover:opacity-95 shadow-lg'
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
