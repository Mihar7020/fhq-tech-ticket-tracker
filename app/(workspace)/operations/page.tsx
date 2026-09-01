import type { Metadata } from "next";
import { OperationsView } from "@/components/operations-pages";
export const metadata: Metadata = { title: "Site run planner" };
export default function Page() { return <OperationsView />; }
