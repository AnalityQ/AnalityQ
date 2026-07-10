import { PublicReportClient } from "@/app/components/PublicReportClient";

export default async function AnalysisReportPage({ params }: PageProps<"/analizy/[slug]">) {
  const { slug } = await params;
  return <PublicReportClient slug={slug} />;
}
