import React, { useState, useEffect } from 'react';
import { notifyReportRefresh } from '../hooks/useReportData';

export default function CoachingNotes() {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('wealthBlueprint_coachingNotes');
    if (saved) {
      setNotes(saved);
    }
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      const saved = localStorage.getItem('wealthBlueprint_coachingNotes');
      if (saved != null) setNotes(saved);
    };
    window.addEventListener('wealthBlueprint-notes-updated', syncFromStorage);
    return () =>
      window.removeEventListener('wealthBlueprint-notes-updated', syncFromStorage);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('wealthBlueprint_coachingNotes', notes);
      notifyReportRefresh();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [notes]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-wb-navy mb-6">Coaching notes</h2>
      <p className="text-slate-600 mb-6">
        Reflections and session notes for your Money Coaching & Education Report. Auto-saved in
        this browser.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Coaching reflections — educational guidance only. 
          These notes are for your personal use and will be included in PDF exports.
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Enter your coaching notes, reflections, and educational insights here..."
        className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
      />

      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {notes.length} characters • Auto-saved to local storage
        </p>
        <button
          onClick={() => {
            localStorage.setItem('wealthBlueprint_coachingNotes', notes);
            alert('Notes saved!');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Now
        </button>
      </div>
    </div>
  );
}

