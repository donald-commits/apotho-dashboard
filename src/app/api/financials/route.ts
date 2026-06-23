import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getGoogleAccessToken,
  fetchBusinessFinancials,
  fetchPortfolioFinancials,
} from "@/lib/google-sheets";

// Per-business sheet map. Each entry is one entity that has both MACU + AmEx tabs.
const SHEET_MAP: Record<string, { name: string; sheetId: string }> = {
  "evolution-drafting": {
    name: "Evolution Drafting",
    sheetId: process.env.EVOLUTION_SHEET_ID ?? "",
  },
  "sentri-homes": {
    name: "Sentri Homes",
    sheetId: process.env.SENTRI_SHEET_ID ?? "",
  },
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  try {
    const accessToken = await getGoogleAccessToken();

    // Portfolio rollup: Apotho Improvements = sum of every configured subsidiary
    if (slug === "apotho-improvements") {
      const configs = Object.entries(SHEET_MAP)
        .filter(([, cfg]) => !!cfg.sheetId)
        .map(([s, cfg]) => ({
          businessName: cfg.name,
          businessSlug: s,
          spreadsheetId: cfg.sheetId,
        }));
      const portfolio = await fetchPortfolioFinancials(configs, accessToken);
      return NextResponse.json({ mode: "portfolio", portfolio });
    }

    // Single business
    const cfg = SHEET_MAP[slug];
    if (!cfg || !cfg.sheetId) {
      return NextResponse.json(
        { error: `No Google Sheet configured for business: ${slug}`, mode: "single", business: null },
        { status: 200 },
      );
    }
    const business = await fetchBusinessFinancials(cfg.name, slug, cfg.sheetId, accessToken);
    return NextResponse.json({ mode: "single", business });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[financials API]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
