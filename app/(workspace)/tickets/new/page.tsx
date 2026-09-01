import type { Metadata } from "next";
import { NewTicketView } from "@/components/new-ticket-view";

export const metadata: Metadata = { title: "New request" };

export default function NewTicketPage() {
  return <NewTicketView />;
}
