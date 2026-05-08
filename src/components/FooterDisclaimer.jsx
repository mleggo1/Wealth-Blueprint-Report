import React from 'react';
import { FOOTER_SHORT } from '../constants/disclaimers';

export default function FooterDisclaimer() {
  return (
    <footer className="text-center py-8 text-xs text-slate-600 border-t border-slate-200/80 mt-8 max-w-4xl mx-auto leading-relaxed px-4">
      <p>{FOOTER_SHORT}</p>
    </footer>
  );
}
