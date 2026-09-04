import type { Metadata } from "next";
import { ReportsView } from "@/components/reports-view";
import { getReportData } from "@/lib/report-data";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const report = await getReportData();
  return <ReportsView report={report} />;
}
