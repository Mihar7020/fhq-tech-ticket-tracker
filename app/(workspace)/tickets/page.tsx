import type { Metadata } from "next";
import { TicketListView } from "@/components/ticket-list-view";

export const metadata: Metadata = { title: "Live queue" };
export default function TicketsPage() { return <TicketListView />; }
