import type { Metadata } from "next";
import { KnowledgeView } from "@/components/operations-pages";
export const metadata: Metadata = { title: "Knowledge" };
export default function Page() { return <KnowledgeView />; }
