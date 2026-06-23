"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  LandmarkIcon,
  CreditCardIcon,
} from "lucide-react";

// ─── Types (kept in sync with /lib/google-sheets.ts) ──────────────────────────

interface FinancialRow {
  date: string;
  description: string;
  amount: number;
  category: string;
  source: "MACU" | "AmEx";
  isRevenue: boolean;
}

interface FinancialSummary {
  source: "MACU" | "AmEx";
  sheetName: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  rows: FinancialRow[];
  expenseByCategory: Record<string, number>;
}

interface BusinessFinancials {
  businessName: string;
  businessSlug: string;
  sources: FinancialSummary[];
  totalRevenue: number;
  totalExpenses: number;
  totalNetIncome: number;
  expenseByCategory: Record<string, number>;
}

type ApiResponse =
  | { mode: "single"; business: BusinessFinancials | null; error?: string }
  | { mode: "portfolio"; portfolio: BusinessFinancials[]; error?: string };

interface FinancialsDashboardProps {
  slug: string;
  autoload?: boolean;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FinancialsDashboard({ slug, autoload = false }: FinancialsDashboardProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/financials?slug=${encodeURIComponent(slug)}`);
      const json = (await res.json()) as ApiResponse;
      if (json.error) setError(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (autoload) fetchData();
  }, [autoload, fetchData]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCwIcon className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : data ? "Refresh" : "Load Financial Data"}
        </Button>
        {data && (
          <span className="text-xs text-muted-foreground">
            Pulled live from Google Sheets · MACU + AmEx
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {data?.mode === "single" && data.business && <SingleBusinessView b={data.business} />}
      {data?.mode === "single" && !data.business && !error && (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
          No sheet configured.
        </div>
      )}
      {data?.mode === "portfolio" && <PortfolioView entries={data.portfolio} />}
    </div>
  );
}

// ─── Single-business view ─────────────────────────────────────────────────────

function SingleBusinessView({ b }: { b: BusinessFinancials }) {
  const [active, setActive] = useState<"combined" | "MACU" | "AmEx">("combined");

  const combinedRows = b.sources
    .flatMap((s) => s.rows)
    .sort((a, z) => z.date.localeCompare(a.date));

  const view =
    active === "combined"
      ? {
          revenue: b.totalRevenue,
          expenses: b.totalExpenses,
          net: b.totalNetIncome,
          rows: combinedRows,
          expenseByCategory: b.expenseByCategory,
        }
      : (() => {
          const s = b.sources.find((x) => x.source === active);
          return s
            ? {
                revenue: s.revenue,
                expenses: s.expenses,
                net: s.netIncome,
                rows: s.rows,
                expenseByCategory: s.expenseByCategory,
              }
            : null;
        })();

  if (!view) return null;

  return (
    <>
      {/* Source tabs */}
      <div className="flex gap-2 flex-wrap">
        <SourceTab active={active === "combined"} onClick={() => setActive("combined")} label="Combined" />
        {b.sources.map((s) => (
          <SourceTab
            key={s.source}
            active={active === s.source}
            onClick={() => setActive(s.source)}
            label={s.source}
            icon={s.source === "MACU" ? <LandmarkIcon className="h-3.5 w-3.5" /> : <CreditCardIcon className="h-3.5 w-3.5" />}
            sublabel={`${s.rows.length} txns`}
          />
        ))}
      </div>

      {/* Summary cards */}
      <SummaryCards revenue={view.revenue} expenses={view.expenses} net={view.net} />

      {/* Expense breakdown */}
      {Object.keys(view.expenseByCategory).length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Expense Breakdown</h2>
          <ExpenseBreakdown breakdown={view.expenseByCategory} />
        </div>
      )}

      {/* Transactions */}
      <TransactionsTable rows={view.rows} />
    </>
  );
}

// ─── Portfolio (Apotho Improvements) rollup view ──────────────────────────────

function PortfolioView({ entries }: { entries: BusinessFinancials[] }) {
  const totalRevenue = entries.reduce((s, e) => s + e.totalRevenue, 0);
  const totalExpenses = entries.reduce((s, e) => s + e.totalExpenses, 0);
  const totalNet = totalRevenue - totalExpenses;

  const combinedCategories: Record<string, number> = {};
  for (const e of entries) {
    for (const [cat, amt] of Object.entries(e.expenseByCategory)) {
      combinedCategories[cat] = (combinedCategories[cat] ?? 0) + amt;
    }
  }

  return (
    <>
      <SummaryCards revenue={totalRevenue} expenses={totalExpenses} net={totalNet} label="Portfolio" />

      <div>
        <h2 className="text-base font-semibold mb-3">Per-Business Snapshot</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {entries.map((e) => (
            <Card key={e.businessSlug}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.businessName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <Stat label="Revenue" value={formatCurrency(e.totalRevenue)} tone="green" />
                  <Stat label="Expenses" value={formatCurrency(e.totalExpenses)} tone="red" />
                  <Stat
                    label="Net"
                    value={formatCurrency(e.totalNetIncome)}
                    tone={e.totalNetIncome >= 0 ? "blue" : "red"}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {e.sources.map((s) => (
                    <span key={s.source} className="rounded-full bg-muted px-2 py-0.5">
                      {s.source}: {s.rows.length} txns
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {Object.keys(combinedCategories).length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Portfolio Expense Breakdown</h2>
          <ExpenseBreakdown breakdown={combinedCategories} />
        </div>
      )}
    </>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function SourceTab({
  active,
  onClick,
  label,
  icon,
  sublabel,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  sublabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-accent border-input"
      }`}
    >
      {icon}
      {label}
      {sublabel && <span className="text-xs opacity-70">· {sublabel}</span>}
    </button>
  );
}

function SummaryCards({
  revenue,
  expenses,
  net,
  label,
}: {
  revenue: number;
  expenses: number;
  net: number;
  label?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <TrendingUpIcon className="h-4 w-4 text-green-500" />
          <CardTitle className="text-sm font-medium">{label ? `${label} ` : ""}Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <TrendingDownIcon className="h-4 w-4 text-red-500" />
          <CardTitle className="text-sm font-medium">{label ? `${label} ` : ""}Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <DollarSignIcon className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-sm font-medium">{label ? `${label} ` : ""}Net Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${net >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {formatCurrency(net)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "blue" }) {
  const colorMap = { green: "text-green-600", red: "text-red-600", blue: "text-blue-600" };
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold ${colorMap[tone]}`}>{value}</p>
    </div>
  );
}

function ExpenseBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((s, n) => s + n, 0);
  const sorted = Object.entries(breakdown).sort(([, a], [, z]) => z - a);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map(([category, amount]) => {
        const pct = total > 0 ? (amount / total) * 100 : 0;
        return (
          <div key={category} className="rounded-lg border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm truncate">{category}</span>
              <span className="text-sm font-medium text-red-600 ml-3 shrink-0">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}%</p>
          </div>
        );
      })}
    </div>
  );
}

function TransactionsTable({ rows }: { rows: FinancialRow[] }) {
  const [limit, setLimit] = useState(100);
  const visible = rows.slice(0, limit);
  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Transactions ({rows.length})</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3 font-medium">Date</th>
              <th className="text-left py-2 px-3 font-medium">Source</th>
              <th className="text-left py-2 px-3 font-medium">Description</th>
              <th className="text-left py-2 px-3 font-medium">Category</th>
              <th className="text-right py-2 px-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{row.date}</td>
                <td className="py-2 px-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.source === "MACU" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {row.source}
                  </span>
                </td>
                <td className="py-2 px-3 max-w-[280px] truncate" title={row.description}>{row.description}</td>
                <td className="py-2 px-3 text-muted-foreground">{row.category}</td>
                <td className={`py-2 px-3 text-right font-medium ${row.isRevenue ? "text-green-600" : "text-red-600"}`}>
                  {row.isRevenue ? "+" : "-"}{formatCurrency(Math.abs(row.amount))}
                </td>
              </tr>
            ))}
            {rows.length > visible.length && (
              <tr>
                <td colSpan={5} className="py-3 px-3 text-center text-xs">
                  <button
                    onClick={() => setLimit((l) => l + 200)}
                    className="text-primary hover:underline"
                  >
                    Show 200 more ({rows.length - visible.length} remaining)
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
