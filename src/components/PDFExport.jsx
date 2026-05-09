import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import FullReport from './FullReport';
import { FOOTER_SHORT } from '../constants/disclaimers';
import { PREPARER_NAME } from '../constants/brand';

/** Reserved at bottom of each page for footer text only. */
const FOOTER_RESERVE_PT = 108;
const BODY_FOOTER_GAP_PT = 14;
const MARGIN_TOP_PT = 28;
const MARGIN_X_PT = 22;
/** Space between stacked section images. */
const SECTION_GAP_PT = 12;
/** If less than this many pt left on the page, start a new page before placing content. */
const MIN_TAIL_PT = 28;

function drawCanvasStrip(pdf, canvas, sy, srcH, x, y, destW) {
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = canvas.width;
  pageCanvas.height = Math.ceil(srcH);
  const ctx = pageCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, sy, canvas.width, srcH, 0, 0, pageCanvas.width, pageCanvas.height);
  const drawH = (srcH * destW) / canvas.width;
  pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', x, y, destW, drawH);
  return drawH;
}

export default function PDFExport() {
  const pdfRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('wealthBlueprint_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const addFootersAndMeta = (pdf) => {
    const total = pdf.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const dateStr = new Date().toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const maxW = pageWidth - MARGIN_X_PT * 2;
    const footerBandTop = pageHeight - FOOTER_RESERVE_PT;
    const lineH = 6.2;

    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFontSize(5.5);
      pdf.setTextColor(72);
      const lines = pdf.splitTextToSize(FOOTER_SHORT, maxW);

      const pageY = pageHeight - 9;
      const preparedY = pageHeight - 22;
      const disclaimerBottom = preparedY - 10;
      let disclaimerFirst = disclaimerBottom - (lines.length - 1) * lineH;

      if (disclaimerFirst < footerBandTop + 6) {
        disclaimerFirst = footerBandTop + 6;
      }

      pdf.text(lines, MARGIN_X_PT, disclaimerFirst);

      pdf.setFontSize(7);
      pdf.setTextColor(48);
      pdf.text(`Prepared by ${PREPARER_NAME} · ${dateStr}`, MARGIN_X_PT, preparedY);
      pdf.text(`Page ${i} of ${total}`, pageWidth - MARGIN_X_PT - 58, pageY);
    }
  };

  const exportPDF = async () => {
    setIsGenerating(true);
    try {
      const root = pdfRef.current;
      if (!root) {
        alert('Error: Could not find content to export');
        return;
      }

      const sectionEls = Array.from(root.querySelectorAll('.report-section'));
      const targets = sectionEls.length > 0 ? sectionEls : [root];

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - MARGIN_X_PT * 2;
      const bodyTop = MARGIN_TOP_PT;
      const bodyBottom = pageHeight - FOOTER_RESERVE_PT - BODY_FOOTER_GAP_PT;
      const fullColumnPt = bodyBottom - bodyTop;

      let cursorY = bodyTop;

      const newPage = () => {
        pdf.addPage();
        cursorY = bodyTop;
      };

      for (let ti = 0; ti < targets.length; ti++) {
        const el = targets[ti];
        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,
          width: el.scrollWidth,
          height: el.scrollHeight,
          windowWidth: el.scrollWidth,
          windowHeight: el.scrollHeight,
        });

        const pxToPt = imgWidth / canvas.width;
        let sy = 0;

        while (sy < canvas.height - 0.5) {
          const remainingPx = canvas.height - sy;
          const remainingPt = remainingPx * pxToPt;
          let available = bodyBottom - cursorY;

          /* Keep each report section intact when it fits on one page: move to a fresh page if the
           * tail of the current page is too small for the whole remaining block. */
          if (remainingPt <= fullColumnPt + 0.5 && available + 0.5 < remainingPt) {
            newPage();
            available = bodyBottom - cursorY;
          }

          if (available < MIN_TAIL_PT) {
            newPage();
            available = bodyBottom - cursorY;
          }

          const maxSrcH = available / pxToPt;
          const srcH = Math.min(maxSrcH, remainingPx);
          const drawH = drawCanvasStrip(pdf, canvas, sy, srcH, MARGIN_X_PT, cursorY, imgWidth);

          cursorY += drawH;
          sy += srcH;

          if (sy < canvas.height - 0.5) {
            newPage();
          }
        }

        cursorY += SECTION_GAP_PT;
      }

      addFootersAndMeta(pdf);

      const name = profile?.name ? profile.name.replace(/[^a-z0-9]+/gi, '_') : 'Client';
      const date = new Date().toISOString().slice(0, 10);
      const filename = `${name}_WealthBlueprint_EducationReport_${date}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-wb-navy mb-4">Export PDF</h2>
        <p className="text-slate-600 mb-4">
          Generate a print-ready Money Coaching & Education Report. Sections are placed page by page
          so text is not split arbitrarily in the middle of a paragraph.
        </p>
        <button
          type="button"
          onClick={exportPDF}
          disabled={isGenerating}
          className="px-6 py-3 bg-navy-900 text-white rounded-xl hover:bg-navy-800 disabled:bg-slate-400 font-semibold text-lg shadow-sm"
        >
          {isGenerating ? 'Generating PDF…' : 'Download PDF report'}
        </button>
      </div>

      <div
        ref={pdfRef}
        className="fixed left-[-9999px] top-0 w-[794px] bg-white p-8"
        aria-hidden
      >
        <FullReport showScreenChrome={false} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-amber-50/50 p-6 mt-6 text-sm text-slate-800">
        <p className="font-semibold text-wb-navy mb-2">Export notes</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Cover page, education notice, all report sections, and “Before You Act” are included.</li>
          <li>Each section is rendered separately so page breaks fall between sections, not through lines.</li>
          <li>Unusually long single sections may still span multiple pages.</li>
        </ul>
      </div>
    </div>
  );
}
