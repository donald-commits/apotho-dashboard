import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronLeftIcon, InfoIcon } from "lucide-react";
import { FinancialsDashboard } from "@/components/financials/financials-dashboard";

interface PageProps {
  params: { slug: string };
}

// Businesses with their own books wired to a Google Sheet.
// Everything else rolls up under Apotho Improvements (the parent).
const SHEET_WIRED_SLUGS = ["evolution-drafting", "sentri-homes"];
const PORTFOLIO_SLUG = "apotho-improvements";

export default async function FinancialsPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
  });

  if (!business) notFound();

  const isPortfolio = params.slug === PORTFOLIO_SLUG;
  const hasOwnSheet = SHEET_WIRED_SLUGS.includes(params.slug);
  const subtitle = isPortfolio
    ? "Portfolio rollup across every entity (MACU + AmEx)"
    : hasOwnSheet
      ? "Revenue and expenses from MACU + AmEx"
      : `${business.name} doesn't have its own books yet — see Apotho Improvements for the consolidated view.`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/${params.slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          {business.name}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {!isPortfolio && !hasOwnSheet && (
        <Link
          href={`/${PORTFOLIO_SLUG}/financials`}
          className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 hover:bg-blue-100 inline-flex items-center gap-2"
        >
          <InfoIcon className="h-4 w-4" />
          View consolidated portfolio financials →
        </Link>
      )}

      <FinancialsDashboard slug={params.slug} />
    </div>
  );
}
