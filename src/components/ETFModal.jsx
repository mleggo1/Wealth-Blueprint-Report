import React, { useState, useEffect, useRef } from 'react';
import { EnlargedChart } from './EnlargedChart';
import { ETFInfoPanel } from './ETFInfoPanel';
import etfMetadataData from '../data/etf-metadata.json';

const etfMetadata = etfMetadataData;

export const ETFModal = ({ etf, isOpen, onClose, etfData }) => {
  const [localTimeframe, setLocalTimeframe] = useState('1Y');
  const data = etfData?.[etf?.symbol];
  const metadata = etfMetadata[etf?.symbol];
  const closeBtnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !etf) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-4 sm:py-8 px-3 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="etf-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-default"
        aria-label="Close chart overlay"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-6xl max-h-[min(92vh,880px)] my-auto rounded-2xl border-2 border-navy-200 bg-white shadow-2xl shadow-navy-900/25 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 bg-navy-900 text-white shrink-0 sticky top-0 z-20">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] uppercase tracking-widest text-teal-200/90 mb-1">ETF detail</p>
            <h2 id="etf-modal-title" className="text-lg sm:text-xl font-bold truncate">
              {etf.symbol}
              <span className="font-semibold text-slate-200"> — {etf.name}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white text-navy-900 px-4 py-2.5 text-sm font-bold shadow hover:bg-teal-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2.5 text-white/90 hover:bg-white/15 border border-white/25 transition"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto">
          <div className="flex-[2] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 min-h-[280px] lg:min-h-0">
            <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-slate-800">Price chart</span>
                <div className="flex flex-wrap gap-1.5">
                  {['YTD', '1Y', '2Y', '5Y', '10Y', 'ALL'].map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setLocalTimeframe(tf)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                        localTimeframe === tf
                          ? 'bg-navy-900 text-white'
                          : 'bg-white text-navy-800 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6 overflow-auto bg-white min-h-[240px]">
              <div className="h-[min(360px,45vh)] sm:h-[380px] w-full">
                <EnlargedChart timeframe={localTimeframe} data={data} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50 max-h-[40vh] lg:max-h-none">
            <ETFInfoPanel etf={etf} metadata={metadata} data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};
