import * as XLSX from 'xlsx';

function cellText(sheet, a1) {
  const c = sheet[a1];
  if (!c) return '';
  const raw = c.w != null ? c.w : c.v;
  if (raw == null) return '';
  return String(raw).trim();
}

function parseAud(text) {
  if (text == null || text === '') return null;
  const s = String(text).replace(/[$,\s]/g, '').replace(/AUD/gi, '');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function parseIntSafe(text) {
  if (text == null || text === '') return null;
  const n = Number.parseInt(String(text).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function joinNonEmpty(lines) {
  return lines
    .map((l) => (typeof l === 'string' ? l.trim() : ''))
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Reads the legacy "Wealth & Retirement Blueprint" coaching workbook (Analysis sheet)
 * and returns profile fields + draft coaching notes for the in-app report builder.
 *
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ profile: Record<string, unknown>, coachingNotes: string, warnings: string[] }}
 */
export function parseCoachingWorkbook(arrayBuffer) {
  const warnings = [];
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets.Analysis;
  if (!sheet) {
    throw new Error(
      'This workbook does not contain an "Analysis" sheet. Please use a Wealth Blueprint coaching workbook export.'
    );
  }

  const name = cellText(sheet, 'D55');
  const age = parseIntSafe(cellText(sheet, 'D57'));
  const location = cellText(sheet, 'D58');
  const employer = cellText(sheet, 'D59');
  const email = cellText(sheet, 'D60');

  const incomeLow = parseAud(cellText(sheet, 'D62'));
  const incomeHigh = parseAud(cellText(sheet, 'E62'));
  let annualIncome = incomeLow;
  if (incomeLow != null && incomeHigh != null && incomeHigh !== incomeLow) {
    annualIncome = Math.round((incomeLow + incomeHigh) / 2);
    warnings.push(
      'Annual income was a range in Excel; the app imported the midpoint for educational modelling.'
    );
  }

  const retirementAge = parseIntSafe(cellText(sheet, 'D63'));
  const passiveIncomeGoal = parseAud(cellText(sheet, 'D64'));

  const occupationParts = [employer, location].filter(Boolean);
  const occupation = occupationParts.join(' · ');

  const lifestyleLines = [];
  if (location) lifestyleLines.push(`Location (from workbook): ${location}`);
  if (employer) lifestyleLines.push(`Employer / role context (from workbook): ${employer}`);
  if (email) lifestyleLines.push(`Email (from workbook): ${email}`);
  if (incomeLow != null && incomeHigh != null && incomeHigh !== incomeLow) {
    lifestyleLines.push(
      `Stated income range (from workbook): $${incomeLow.toLocaleString()} – $${incomeHigh.toLocaleString()}`
    );
  }

  const exampleTitle = cellText(sheet, 'B126');
  const exampleBody = joinNonEmpty([
    exampleTitle && `Example label (from workbook): ${exampleTitle}`,
    cellText(sheet, 'B128'),
    cellText(sheet, 'B129'),
    cellText(sheet, 'B130'),
    cellText(sheet, 'B131'),
  ]);
  if (exampleBody) lifestyleLines.push(exampleBody);

  const superNote = cellText(sheet, 'B433');
  if (superNote) {
    lifestyleLines.push(
      `Superannuation reflection (from workbook — education only, not advice):\n${superNote}`
    );
  }

  const profile = {
    ...(name ? { name } : {}),
    ...(age != null ? { age } : {}),
    ...(annualIncome != null ? { annualIncome } : {}),
    ...(occupation ? { occupation } : {}),
    ...(retirementAge != null ? { retirementAge } : {}),
    ...(passiveIncomeGoal != null ? { passiveIncomeGoal } : {}),
    ...(lifestyleLines.length
      ? { lifestyleGoals: joinNonEmpty(lifestyleLines) }
      : {}),
  };

  const nextSteps = joinNonEmpty([
    cellText(sheet, 'B469'),
    cellText(sheet, 'B471'),
    cellText(sheet, 'B473'),
    cellText(sheet, 'B475'),
  ]);

  const footnoteTitle = cellText(sheet, 'B196');
  const footnotes = joinNonEmpty([
    footnoteTitle && `${footnoteTitle}`,
    cellText(sheet, 'B197'),
    cellText(sheet, 'B198'),
    cellText(sheet, 'B199'),
  ]);

  const coachingNotes = joinNonEmpty([
    'Imported from Wealth Blueprint coaching workbook (draft text for your review).',
    'Education only — replace product-specific steps with neutral “questions to research” where needed.',
    nextSteps && `Education next steps (from workbook checklist):\n${nextSteps}`,
    footnotes &&
      `Long-term context (hypothetical / general information only — not predictive):\n${footnotes}`,
  ]);

  return { profile, coachingNotes, warnings };
}
