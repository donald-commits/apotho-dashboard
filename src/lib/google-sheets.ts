// Google Sheets API helper — refreshes access token, fetches sheet data,
// parses MACU + AmEx ledger tabs into a unified FinancialSummary shape.

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials in environment variables");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to refresh Google token: ${err}`);
  }

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}

export async function getSheetNames(spreadsheetId: string, accessToken: string): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch sheet names: ${await res.text()}`);
  const data = await res.json();
  return data.sheets.map((s: { properties: { title: string } }) => s.properties.title);
}

export async function getSheetData(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
): Promise<string[][]> {
  const encodedSheet = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheet}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.values as string[][]) ?? [];
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[$,\s]/g, "").trim();
  // Handle parens-as-negative ("(100.00)" → -100)
  const negative = /^\(.*\)$/.test(cleaned);
  const n = parseFloat(cleaned.replace(/[()]/g, ""));
  if (isNaN(n)) return 0;
  return negative ? -n : n;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinancialRow {
  date: string;
  description: string;
  amount: number;       // signed: + = money in, - = money out
  category: string;
  source: "MACU" | "AmEx";
  isRevenue: boolean;
}

export interface FinancialSummary {
  source: "MACU" | "AmEx";
  sheetName: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  rows: FinancialRow[];
  expenseByCategory: Record<string, number>;
}

export interface BusinessFinancials {
  businessName: string;
  businessSlug: string;
  sources: FinancialSummary[];
  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;
  expenseByCategory: Record<string, number>;
}

// ─── Per-source parsers ───────────────────────────────────────────────────────

// MACU export schema: A=Transaction Date, B=Post Date, C=Description (legacy?),
// real layout per CLAUDE.md scripts: amount=col E, date=col C, description=col H.
// We auto-detect by header, falling back to the known indices.
function parseMacuRows(rows: string[][]): FinancialRow[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => (h ?? "").toLowerCase().trim());
  const findIdx = (...patterns: string[]) =>
    headers.findIndex((h) => patterns.some((p) => h.includes(p)));

  let dateIdx = findIdx("post date", "transaction date", "date");
  let amountIdx = findIdx("amount");
  let descIdx = findIdx("description", "memo", "payee", "merchant");
  const categoryIdx = findIdx("category", "categ");

  // Fallback to canonical MACU layout (C=date, E=amount, H=description)
  if (dateIdx === -1) dateIdx = 2;
  if (amountIdx === -1) amountIdx = 4;
  if (descIdx === -1) descIdx = 7;

  const out: FinancialRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const amount = parseAmount(row[amountIdx] ?? "");
    if (amount === 0) continue;
    const date = (row[dateIdx] ?? "").trim();
    const description = (row[descIdx] ?? "").trim() || "—";
    const category = categoryIdx >= 0 ? (row[categoryIdx] ?? "Uncategorized").trim() || "Uncategorized" : "Uncategorized";
    out.push({
      date,
      description,
      amount,
      category,
      source: "MACU",
      isRevenue: amount > 0,
    });
  }
  return out;
}

// AmEx export schema per CLAUDE.md scripts: amount=col G, date=col A, description=col C.
// AmEx sign convention: charges/expenses are POSITIVE in their export, payments are NEGATIVE.
// We flip the sign so the unified model is "+ = money in to the business".
function parseAmexRows(rows: string[][]): FinancialRow[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => (h ?? "").toLowerCase().trim());
  const findIdx = (...patterns: string[]) =>
    headers.findIndex((h) => patterns.some((p) => h.includes(p)));

  let dateIdx = findIdx("date");
  let amountIdx = findIdx("amount");
  let descIdx = findIdx("description", "merchant", "payee");
  const categoryIdx = findIdx("category", "categ");

  // Fallback to canonical AmEx layout (A=date, C=description, G=amount)
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 2;
  if (amountIdx === -1) amountIdx = 6;

  const out: FinancialRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const rawAmount = parseAmount(row[amountIdx] ?? "");
    if (rawAmount === 0) continue;
    // Flip AmEx sign: a positive AmEx row is a CHARGE (expense), negative is a payment to the card.
    // Drop card payments entirely — they're internal transfers, not real revenue.
    if (rawAmount < 0) continue;
    const amount = -rawAmount; // expense in unified model
    const date = (row[dateIdx] ?? "").trim();
    const description = (row[descIdx] ?? "").trim() || "—";
    const category = categoryIdx >= 0 ? (row[categoryIdx] ?? "Uncategorized").trim() || "Uncategorized" : "Uncategorized";
    out.push({
      date,
      description,
      amount,
      category,
      source: "AmEx",
      isRevenue: false,
    });
  }
  return out;
}

function summarize(source: "MACU" | "AmEx", sheetName: string, rows: FinancialRow[]): FinancialSummary {
  const revenue = rows.filter((r) => r.isRevenue).reduce((s, r) => s + r.amount, 0);
  const expenses = rows.filter((r) => !r.isRevenue).reduce((s, r) => s + Math.abs(r.amount), 0);
  const expenseByCategory: Record<string, number> = {};
  for (const r of rows) {
    if (r.isRevenue) continue;
    const cat = r.category || "Uncategorized";
    expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + Math.abs(r.amount);
  }
  return {
    source,
    sheetName,
    revenue,
    expenses,
    netIncome: revenue - expenses,
    rows,
    expenseByCategory,
  };
}

// ─── Public: fetch one business ───────────────────────────────────────────────

export async function fetchBusinessFinancials(
  businessName: string,
  businessSlug: string,
  spreadsheetId: string,
  accessToken: string,
): Promise<BusinessFinancials> {
  const sheetNames = await getSheetNames(spreadsheetId, accessToken);
  const macuTab = sheetNames.find((n) => /^macu$/i.test(n)) ?? sheetNames.find((n) => /macu/i.test(n));
  const amexTab = sheetNames.find((n) => /^amex$/i.test(n)) ?? sheetNames.find((n) => /amex/i.test(n));

  const sources: FinancialSummary[] = [];

  if (macuTab) {
    const grid = await getSheetData(spreadsheetId, macuTab, accessToken);
    sources.push(summarize("MACU", macuTab, parseMacuRows(grid)));
  }
  if (amexTab) {
    const grid = await getSheetData(spreadsheetId, amexTab, accessToken);
    sources.push(summarize("AmEx", amexTab, parseAmexRows(grid)));
  }

  const totalRevenue = sources.reduce((s, x) => s + x.revenue, 0);
  const totalExpenses = sources.reduce((s, x) => s + x.expenses, 0);
  const expenseByCategory: Record<string, number> = {};
  for (const src of sources) {
    for (const [cat, amt] of Object.entries(src.expenseByCategory)) {
      expenseByCategory[cat] = (expenseByCategory[cat] ?? 0) + amt;
    }
  }

  return {
    businessName,
    businessSlug,
    sources,
    totalRevenue,
    totalExpenses,
    totalNetIncome: totalRevenue - totalExpenses,
    expenseByCategory,
  };
}

// ─── Public: fetch all subsidiaries for the Apotho Improvements rollup ────────

export async function fetchPortfolioFinancials(
  configs: Array<{ businessName: string; businessSlug: string; spreadsheetId: string }>,
  accessToken: string,
): Promise<BusinessFinancials[]> {
  return Promise.all(
    configs.map((c) =>
      fetchBusinessFinancials(c.businessName, c.businessSlug, c.spreadsheetId, accessToken),
    ),
  );
}
