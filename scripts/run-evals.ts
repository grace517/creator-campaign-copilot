/**
 * Runs evals/cases.json against the message checks and prints per-case results and the pass rate.
 *
 *   npm run evals            exact checks in code, plus the model's claim judgment when ANTHROPIC_API_KEY is set
 *
 * A violation is one expected failure (case × check). It's caught when that check fails. A false flag is a clean
 * case (expected_fail: []) with any failure. Gate (exit 1 on a miss):
 * - Always: the exact checks catch every violation code can catch, with no false flags.
 * - With the model: every violation is caught (100%), and no more than 10% of clean cases are flagged.
 * Without a key, violations only the model can catch are reported as "not run", never as passed.
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JUDGMENT_MODEL, judgeClaims, type Ruling } from '../api/_lib/claimJudgment';
import { parseBrief } from '../src/data/parse';
import { captionChecks, exactChecks, type CheckName } from '../src/lib/checks';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brief = parseBrief(readFileSync(join(root, 'data/brief.json'), 'utf8'));
const evals = JSON.parse(readFileSync(join(root, 'evals/cases.json'), 'utf8')) as {
  keyword: string;
  cases: { id: number; dm: string; expected_fail: CheckName[]; note?: string; rulings?: Ruling[] }[];
  caption_cases: { id: string; caption_cta: string; expected_fail: CheckName[] }[];
};

const key = process.env.ANTHROPIC_API_KEY?.trim();
const client = key ? new Anthropic({ apiKey: key }) : null;

/**
 * Whether a violation can only be caught by the model: an unapproved claim, or a banned claim whose exact phrase
 * isn't in the text. Decided by plain substring search, independent of the checks under test, so a broken exact
 * check shows up as a miss instead of quietly becoming "needs the model".
 */
function needsModel(text: string, check: CheckName): boolean {
  if (check === 'unapproved_claim') return true;
  if (check !== 'banned_claim') return false;
  const lower = text.toLowerCase();
  return !brief.banned_claims.some((c) => lower.includes(c.toLowerCase()));
}

interface Row {
  id: string;
  expected: CheckName[];
  actual: CheckName[];
  modelRan: boolean;
  modelNote?: string;
}

const rows: Row[] = [];

for (const c of evals.cases) {
  const exact = exactChecks({ dm: c.dm, code: evals.keyword }, brief);
  const actual = exact.filter((x) => !x.passed).map((x) => x.name);
  let modelRan = false;
  let modelNote: string | undefined;
  // docs/PROMPTS.md: the claim judgment runs after the exact checks pass.
  if (client && actual.length === 0) {
    const j = await judgeClaims(
      { message: c.dm, approved_claims: brief.approved_claims, banned_claims: brief.banned_claims, product: brief.product, offer: brief.offer, rulings: c.rulings },
      client,
    );
    modelRan = true;
    if (j.verdict !== 'pass') {
      const types = new Set(j.findings.map((f) => (f.type === 'banned_paraphrase' ? 'banned_claim' : 'unapproved_claim')));
      // "unsure" with no findings blocks approval for a person to decide; it counts as a flag on either claim check.
      if (types.size === 0) types.add('banned_claim').add('unapproved_claim');
      actual.push(...types);
      modelNote = `${j.verdict}: ${j.findings.map((f) => `"${f.phrase}" (${f.type})`).join(', ') || j.note}`;
    }
  }
  rows.push({ id: String(c.id), expected: c.expected_fail, actual, modelRan, modelNote });
}

for (const c of evals.caption_cases) {
  const actual = captionChecks(c.caption_cta, evals.keyword, brief)
    .filter((x) => !x.passed)
    .map((x) => x.name);
  rows.push({ id: c.id, expected: c.expected_fail, actual, modelRan: false });
}

const textOf = (id: string) =>
  evals.cases.find((c) => String(c.id) === id)?.dm ?? evals.caption_cases.find((c) => c.id === id)!.caption_cta;

let codeViolations = 0;
let codeCaught = 0;
let modelViolations = 0;
let modelCaught = 0;
let modelNotRun = 0;
const misses: string[] = [];
const clean = rows.filter((r) => r.expected.length === 0);
const falseFlags = clean.filter((r) => r.actual.length > 0);

console.log(`Evals: ${rows.length} cases against data/brief.json; claim judgment ${client ? `on (${JUDGMENT_MODEL})` : 'not run (no ANTHROPIC_API_KEY)'}\n`);
console.log('case  expected                            got                                 result');
for (const r of rows) {
  const results: string[] = [];
  for (const check of r.expected) {
    const caught = r.actual.includes(check);
    if (needsModel(textOf(r.id), check)) {
      modelViolations++;
      if (!client) {
        modelNotRun++;
        results.push(`${check}: not run (model)`);
        continue;
      }
      if (caught) modelCaught++;
    } else {
      codeViolations++;
      if (caught) codeCaught++;
    }
    if (!caught) misses.push(`case ${r.id}: missed ${check}`);
    results.push(`${check}: ${caught ? 'caught' : 'MISSED'}`);
  }
  const extra = r.actual.filter((a) => !r.expected.includes(a));
  if (extra.length) results.push(`${r.expected.length ? 'extra' : 'FALSE FLAG'}: ${[...new Set(extra)].join(', ')}`);
  if (results.length === 0) results.push('clean, passed');
  const fmt = (xs: string[]) => (xs.length ? [...new Set(xs)].join(', ') : '–').padEnd(36);
  console.log(`${r.id.padEnd(6)}${fmt(r.expected)}${fmt(r.actual)}${results.join('; ')}`);
  if (r.modelNote) console.log(`      model said ${r.modelNote}`);
}

const pct = (a: number, b: number) => (b === 0 ? '–' : `${Math.round((a / b) * 100)}%`);
const totalViolations = codeViolations + modelViolations;
const caughtTotal = codeCaught + modelCaught;
console.log(`
Violations caught by exact checks:  ${codeCaught}/${codeViolations} (${pct(codeCaught, codeViolations)})
Violations needing the model:       ${client ? `${modelCaught}/${modelViolations} (${pct(modelCaught, modelViolations)})` : `${modelNotRun} not run`}
All violations caught:              ${client ? `${caughtTotal}/${totalViolations} (${pct(caughtTotal, totalViolations)})` : `${caughtTotal}/${totalViolations} (${pct(caughtTotal, totalViolations)}), ${modelNotRun} not run`}
False flags on clean cases:         ${falseFlags.length}/${clean.length} (${pct(falseFlags.length, clean.length)})`);

const codeOk = codeCaught === codeViolations && (client ? true : falseFlags.length === 0);
const modelOk = !client || (caughtTotal === totalViolations && falseFlags.length / clean.length <= 0.1);
if (misses.length) console.log(`\nMisses:\n${misses.map((m) => `  ${m}`).join('\n')}`);
if (!codeOk || !modelOk) {
  console.log('\nFAIL: below target (catch 100% of violations; flag no more than 10% of clean cases).');
  process.exit(1);
}
console.log(`\nPASS${client ? '' : ' (exact checks only; set ANTHROPIC_API_KEY to run the model cases)'}`);
