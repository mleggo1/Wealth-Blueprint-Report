import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const file =
  process.argv[2] ||
  path.join(
    root,
    'Coaching - Ali Wealth and Retirement Blueprint 23 Oct 2025 v2.xlsx'
  );

const wb = XLSX.readFile(file, { cellDates: true });
console.log('Sheets:', wb.SheetNames);
const sh = wb.Sheets.Analysis || wb.Sheets[wb.SheetNames[0]];
const refs = [
  'B2',
  'B55',
  'D55',
  'D57',
  'D58',
  'D59',
  'D60',
  'B62',
  'D62',
  'E62',
  'B63',
  'D63',
  'E63',
  'B64',
  'D64',
  'B70',
  'D70',
  'F70',
  'B126',
  'B128',
  'B129',
  'B130',
  'B131',
  'B196',
  'B197',
  'B198',
  'B199',
  'B433',
  'B469',
  'B471',
  'B473',
  'B475',
];
for (const c of refs) {
  const cell = sh[c];
  const val = cell ? (cell.w != null ? cell.w : cell.v) : undefined;
  console.log(c, JSON.stringify(val));
}
