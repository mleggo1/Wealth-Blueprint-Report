import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import FullReport from './FullReport';
import { FOOTER_SHORT } from '../constants/disclaimers';
import { PREPARER_NAME } from '../constants/brand';

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

    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFontSize(6.5);
      pdf.setTextColor(90);
      const lines = pdf.splitTextToSize(FOOTER_SHORT, pageWidth - 40);
      pdf.text(lines, 20, pageHeight - 42);
      pdf.setFontSize(7);
      pdf.text(`Page ${i} of ${total}`, pageWidth - 78, pageHeight - 22);
      pdf.text(`Prepared by ${PREPARER_NAME} · ${dateStr}`, 20, pageHeight - 22);
    }
  };

  const exportPDF = async () => {
    setIsGenerating(true);
    try {
      const element = pdfRef.current;
      if (!element) {
        alert('Error: Could not find content to export');
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        let remainingHeight = imgHeight;
        const ratio = imgWidth / canvas.width;
        const sliceHeight = (pageHeight - margin * 2) / ratio;
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        let sy = 0;
        while (remainingHeight > 0) {
          pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0,
            sy,
            canvas.width,
            sliceHeight,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );
          const pageImg = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImg, 'PNG', margin, margin, imgWidth, pageHeight - margin * 2);
          remainingHeight -= pageHeight - margin * 2;
          sy += sliceHeight;
          if (remainingHeight > 0) pdf.addPage();
        }
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
          Generate a print-ready Money Coaching & Education Report. The export follows the section
          order in the report preview, with a short footer on every page.
        </p>
        <button
          type="button"
          onClick={exportPDF}
          disabled={isGenerating}
          className="px-6 py-3 bg-wb-navy text-white rounded-xl hover:opacity-95 disabled:bg-slate-400 font-semibold text-lg shadow-sm"
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
          <li>Footer text is added on every PDF page after rendering.</li>
          <li>For best print layout, use the in-browser print dialog on the Report tab if needed.</li>
        </ul>
      </div>
    </div>
  );
}
