import React, { useState, useEffect } from 'react';
import { EnlargedChart } from './EnlargedChart';
import { ETFInfoPanel } from './ETFInfoPanel';
import etfMetadataData from '../data/etf-metadata.json';

const etfMetadata = etfMetadataData;

export const ETFModal = ({ etf, isOpen, onClose, etfData }) => {
  const [localTimeframe, setLocalTimeframe] = useState('1Y');
  const data = etfData?.[etf?.symbol];
  const metadata = etfMetadata[etf?.symbol];

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-7xl max-h-[90vh] rounded-2xl border border-gray-300 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {etf.symbol} – {etf.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-[2] flex flex-col border-r border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Price Chart</span>
                  <div className="flex gap-2">
                    {['YTD', '1Y', '2Y', '5Y', '10Y', 'ALL'].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setLocalTimeframe(tf)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                          localTimeframe === tf
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-auto bg-white">
                <EnlargedChart timeframe={localTimeframe} data={data} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              <ETFInfoPanel etf={etf} metadata={metadata} data={data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

