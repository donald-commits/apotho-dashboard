// Standalone runner for the Apotho dashboard financials pipeline.
// Pulls the MACU tab from a configured subsidiary spreadsheet using the
// EXACT same code path the dashboard's /api/financials route uses.
//
// Usage:
//   npx tsx scripts/run-financials.ts evolution-drafting
//   npx tsx scripts/run-financials.ts sentri-homes
//
// Loads env from apotho-dashboard/.env.local + .env automatically.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  fetchBusinessFinancials,
  getGoogleAccessToken,
} from "../src/lib/google-sheets";

// Lightweight .env loader (no dotenv dep)
function loadEnv(file: string) {
  try {
    const text = readFileSync(join(process.cwd(), file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, raw] = m;
      if (process.env[key]) continue; // don't overwrite already-set
      // strip surrounding quotes if present
      const val = raw.replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  } catch {
    /* file missing — skip */
  }
}

loadEnv(".env.local");
loadEnv(".env");

const SHEET_MAP: Record<string, string | undefined> = {
  "evolution-drafting": process.env.EVOLUTION_SHEET_ID,
  "sentri-homes": process.env.SENTRI_SHEET_ID,
};

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

async function main() {
  const slug = process.argv[2] ?? "evolution-drafting";
  const sheetId = SHEET_MAP[slug];

  if (!sheetId) {
    console.error(`No spreadsheet ID configured for slug: ${slug}`);
    console.error(`Expected env var: ${slug === "evolution-drafting" ? "EVOLUTION_SHEET_ID" : "SENTRI_SHEET_ID"}`);
    process.exit(1);
  }

  console.log(`\n=== Running financials for: ${slug} ===`);
  console.log(`Spreadsheet ID: ${sheetId}\n`);

  const token = await getGoogleAccessToken();
  const business = await fetchBusinessFinancials(slug, slug, sheetId, token);

  if (business.sources.length === 0) {
    console.log("⚠  No MACU or AmEx tabs found in the spreadsheet.");
    console.log("   The fetcher looks for tab names matching /macu/i or /amex/i (case-insensitive).");
    return;
  }

  console.log(`──────────────────────────────────────────────────────────`);
  console.log(`TOTAL (MACU + AmEx)`);
  console.log(`──────────────────────────────────────────────────────────`);
  console.log(`  Revenue:    ${fmt(business.totalRevenue)}`);
  console.log(`  Expenses:   ${fmt(business.totalExpenses)}`);
  console.log(`  Net Income: ${fmt(business.totalNetIncome)}\n`);

  for (const s of business.sources) {
    console.log(`──────────────────────────────────────────────────────────`);
    console.log(`${s.source} — Tab: ${s.sheetName}`);
    console.log(`──────────────────────────────────────────────────────────`);
    console.log(`  Revenue:      ${fmt(s.revenue)}`);
    console.log(`  Expenses:     ${fmt(s.expenses)}`);
    console.log(`  Net Income:   ${fmt(s.netIncome)}`);
    console.log(`  Transactions: ${s.rows.length}\n`);

    const topCats = Object.entries(s.expenseByCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 8);
    if (topCats.length > 0) {
      console.log(`  Top expense categories:`);
      for (const [cat, amt] of topCats) {
        console.log(`    ${cat.padEnd(28)} ${fmt(amt as number).padStart(12)}`);
      }
      console.log();
    }

    if (s.rows.length > 0) {
      console.log(`  Most recent 10 transactions:`);
      for (const row of s.rows.slice(-10).reverse()) {
        const date = (row.date || "—").padEnd(12);
        const desc = (row.description || "").slice(0, 44).padEnd(44);
        const amt = fmt(row.amount).padStart(12);
        const sign = row.isRevenue ? "+" : " ";
        console.log(`    ${date} ${desc} ${sign}${amt}`);
      }
      console.log();
    }
  }

  console.log(`✓ Done. The dashboard at /${slug}/financials renders this same data.\n`);
}

main().catch((err) => {
  console.error("Failed:", err.message ?? err);
  process.exit(1);
});
