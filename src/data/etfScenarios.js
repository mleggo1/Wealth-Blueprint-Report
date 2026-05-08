/** Hypothetical education examples only — not personal advice. */

export const ETF_COMFORT_SCENARIOS = {
  stabilityWeighted: [
    { symbol: 'VAF.AX', allocation: 40 },
    { symbol: 'VHY.AX', allocation: 30 },
    { symbol: 'VAP.AX', allocation: 20 },
    { symbol: 'IVV.AX', allocation: 10 },
  ],
  balanced: [
    { symbol: 'IVV.AX', allocation: 40 },
    { symbol: 'VHY.AX', allocation: 25 },
    { symbol: 'VAP.AX', allocation: 15 },
    { symbol: 'VAF.AX', allocation: 20 },
  ],
  growthWeighted: [
    { symbol: 'IVV.AX', allocation: 35 },
    { symbol: 'NDQ.AX', allocation: 25 },
    { symbol: 'VHY.AX', allocation: 20 },
    { symbol: 'EBTC.XA', allocation: 10 },
    { symbol: 'EETH.XA', allocation: 10 },
  ],
  highVolatilityEducation: [
    { symbol: 'NDQ.AX', allocation: 30 },
    { symbol: 'IVV.AX', allocation: 25 },
    { symbol: 'EBTC.XA', allocation: 20 },
    { symbol: 'EETH.XA', allocation: 15 },
    { symbol: 'VHY.AX', allocation: 10 },
  ],
};

export const SCENARIO_LABELS = {
  stabilityWeighted: 'Stability-weighted education example',
  balanced: 'Balanced education example',
  growthWeighted: 'Growth-weighted education example',
  highVolatilityEducation: 'High-volatility education example',
};

/** Backward compatibility for older saves */
const LEGACY_RISK_TO_SCENARIO = {
  Conservative: 'stabilityWeighted',
  Balanced: 'balanced',
  'High Growth': 'growthWeighted',
  'Very Aggressive': 'highVolatilityEducation',
};

export function normalizeEtfMixSaved(raw) {
  if (!raw || typeof raw !== 'object') {
    return { comfortScenario: 'growthWeighted', annualInvest: 24000 };
  }
  let comfortScenario = raw.comfortScenario;
  if (!comfortScenario && raw.riskProfile && LEGACY_RISK_TO_SCENARIO[raw.riskProfile]) {
    comfortScenario = LEGACY_RISK_TO_SCENARIO[raw.riskProfile];
  }
  if (!comfortScenario || !ETF_COMFORT_SCENARIOS[comfortScenario]) {
    comfortScenario = 'growthWeighted';
  }
  const annualInvest = Number(raw.annualInvest) || 24000;
  let allocations = raw.allocations;
  if (!Array.isArray(allocations) || allocations.length === 0) {
    allocations = ETF_COMFORT_SCENARIOS[comfortScenario];
  }
  return { comfortScenario, annualInvest, allocations };
}
