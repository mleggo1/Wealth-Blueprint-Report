/**
 * Flags language that may increase financial advice / compliance risk.
 * Updated to reduce financial advice and compliance risk — not a guarantee of compliance.
 */

const PATTERNS = [
  { phrase: 'financial plan', reason: 'Prefer “education report” framing.' },
  { phrase: 'investment plan', reason: 'Prefer “education roadmap” framing.' },
  { phrase: 'personal advice', reason: 'Avoid advice framing in headings or summaries.' },
  { phrase: 'recommended portfolio', reason: 'Prefer “hypothetical education example”.' },
  { phrase: 'recommendation', reason: 'Review context; prefer “example” or “education example”.' },
  { phrase: 'you should invest', reason: 'Prefer “you may wish to learn more about”.' },
  { phrase: 'you should buy', reason: 'Instructional / advice-like.' },
  { phrase: 'you should sell', reason: 'Instructional / advice-like.' },
  { phrase: 'you should switch', reason: 'Instructional / advice-like.' },
  { phrase: 'best investment', reason: 'Prefer neutral research language.' },
  { phrase: 'suitable for you', reason: 'Suitability / personal advice risk.' },
  { phrase: 'matched to you', reason: 'Matching / personalisation risk.' },
  { phrase: 'risk profile', reason: 'Prefer “investment comfort level” or “volatility comfort”.' },
  { phrase: 'investor profile', reason: 'Prefer “learning preference”.' },
  { phrase: 'ideal allocation', reason: 'Personalised allocation risk.' },
  { phrase: 'your portfolio should', reason: 'Directive portfolio language.' },
  { phrase: 'guaranteed return', reason: 'Misleading if used with investments.' },
  { phrase: 'safe investment', reason: 'Absolute safety claims risk.' },
  { phrase: 'low risk guaranteed', reason: 'Absolute safety claims risk.' },
  { phrase: 'open this account', reason: 'Product instruction risk.' },
  { phrase: 'use this platform', reason: 'Product instruction risk.' },
  { phrase: 'switch super', reason: 'Super directive risk.' },
  { phrase: 'consolidate super', reason: 'Super directive risk.' },
  { phrase: 'salary sacrifice this amount', reason: 'Contribution directive risk.' },
  { phrase: 'refinance to', reason: 'Credit product directive risk.' },
  { phrase: 'borrow to invest', reason: 'Credit / gearing directive risk.' },
  { phrase: 'debt recycling strategy', reason: 'Structured credit strategy directive risk.' },
  { phrase: 'statement of advice', reason: 'Regulated document label.' },
  { phrase: 'soa', reason: 'Regulated document label (check context).' },
  { phrase: 'tailored investment strategy', reason: 'Personal advice implication.' },
  { phrase: 'suitability assessment', reason: 'Personal advice implication.' },
];

export function scanText(text) {
  if (text == null || String(text).trim() === '') return [];
  const lower = String(text).toLowerCase();
  const hits = [];
  for (const { phrase, reason } of PATTERNS) {
    const isShort = phrase.length <= 4;
    const found = isShort
      ? new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower)
      : lower.includes(phrase);
    if (found) {
      hits.push({
        phrase,
        reason,
        suggestion: suggestReplacement(phrase),
      });
    }
  }
  return hits;
}

function suggestReplacement(phrase) {
  const map = {
    'financial plan': 'education report',
    'investment plan': 'education roadmap',
    recommendation: 'example / education example',
    'recommended portfolio': 'hypothetical education example',
    'risk profile': 'investment comfort level',
    'investor profile': 'learning preference',
    'best investment': 'commonly researched investment example',
    'matched to you': 'selected for educational exploration',
    'you should invest': 'you may wish to learn more about',
    'portfolio recommendation': 'hypothetical education example',
    'personalised strategy': 'education roadmap',
    suitable: 'may be relevant to understand',
    'action plan': 'education next steps',
  };
  return map[phrase] || 'Review wording for neutral education-only tone.';
}

/**
 * @param {Record<string, string>} sources - label -> text
 * @returns {{ label: string, hits: ReturnType<typeof scanText> }[]}
 */
export function scanAllSources(sources) {
  return Object.entries(sources)
    .map(([label, text]) => ({ label, hits: scanText(text) }))
    .filter((x) => x.hits.length > 0);
}
