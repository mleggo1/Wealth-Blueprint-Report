# Wealth Blueprint Pro

Interactive Educational Wealth Planner - A comprehensive web application that combines wealth planning, compound interest projections, ETF analysis, and coaching notes into a single ASIC-compliant educational tool.

## Features

- **Disclaimer Gate**: Full legal disclaimer with acceptance checkbox
- **Client Profile & Goals**: Capture client information and retirement goals
- **Cashflow & Tax View**: Simplified tax calculations and cashflow breakdown
- **Compound Interest Pro**: Advanced retirement projections with time sliders
- **Example ETF Mix**: Risk-based ETF allocation examples with charts
- **Live ETF Prices**: Real-time ETF data from Yahoo Finance
- **Coaching Notes**: Auto-saving notes section
- **PDF Export**: Comprehensive PDF report generation

## Tech Stack

- **React 18** with Vite
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **html2canvas + jsPDF** for PDF export
- **Zustand** for state management (optional)

## Installation

1. Navigate to the project directory:
```bash
cd wealth-blueprint-pro
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## ASIC Compliance

This application is designed to be ASIC-compliant for educational purposes:

- All content is clearly marked as "educational only"
- No financial advice language is used
- All examples are explicitly labeled as "hypothetical" or "illustrative"
- Full legal disclaimers are included on every page
- No implementation buttons (no "Buy", "Open account", etc.)

## Project Structure

```
wealth-blueprint-pro/
├── src/
│   ├── components/
│   │   ├── DisclaimerGate.jsx
│   │   ├── ClientProfile.jsx
│   │   ├── CashflowTax.jsx
│   │   ├── CompoundInterestPro.jsx
│   │   ├── ExampleETFMix.jsx
│   │   ├── LiveETFPrices.jsx
│   │   ├── CoachingNotes.jsx
│   │   ├── PDFExport.jsx
│   │   └── FooterDisclaimer.jsx
│   ├── data/
│   │   ├── etfs.json
│   │   └── etf-metadata.json
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Usage

1. **First Visit**: Users must accept the disclaimer before accessing the application
2. **Navigation**: Use the top navigation bar to switch between sections
3. **Data Persistence**: All inputs are automatically saved to localStorage
4. **PDF Export**: Click "Export PDF" to generate a comprehensive report

## Notes

- ETF data is fetched from Yahoo Finance via a CORS proxy
- All calculations are for educational purposes only
- Tax calculations are simplified and should not be used for actual tax planning
- Investment projections are hypothetical and may not reflect actual outcomes

## Push to GitHub

1. Create a **new empty** repository on GitHub (no README/license), e.g. `NEWWealthblueprint-report`.
2. In this folder:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Use your real GitHub username and repo name. If `origin` already exists, run `git remote set-url origin <url>` instead.

## License

Educational use only. Not for commercial distribution without proper licensing.

