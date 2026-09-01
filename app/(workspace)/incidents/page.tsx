import type { Metadata } from "next";
import { IncidentsView } from "@/components/operations-pages";
export const metadata: Metadata = { title: "Incidents" };
export default function Page() { return <IncidentsView />; }
