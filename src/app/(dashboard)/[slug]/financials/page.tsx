import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChevronLeftIcon } from "lucide-react";
import { FinancialsDashboard } from "@/components/financials/financials-dashboard";

interface PageProps {
  params: { slug: string };
}

// Businesses without a configured sheet
const SUPPORTED_SLUGS = ["evolution-drafting", "sentri-homes"];

export default async function FinancialsPage({ params }: PageProps) {
  const business = await prisma.business.findUnique({
    where: { slug: params.slug },
  });

  if (!business) notFound();

  const hasSheet = SUPPORTED_SLUGS.includes(params.slug);

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
        <p className="text-sm text-muted-foreground mt-1">
          Revenue and expenses from MACU bank account
        </p>
      </div>

      {hasSheet ? (
        <FinancialsDashboard slug={params.slug} />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No Google Sheet configured for {business.name}.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            To connect a sheet, add the spreadsheet ID to the environment and update the SHEET_MAP in
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">src/app/api/financials/route.ts</code>.
          </p>
        </div>
      )}
    </div>
  );
}
