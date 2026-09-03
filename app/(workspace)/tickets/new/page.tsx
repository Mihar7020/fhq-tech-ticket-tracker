import type { Metadata } from "next";
import { NewTicketView } from "@/components/new-ticket-view";
import { getSites, getTechs } from "@/lib/ticket-data";

export const metadata: Metadata = { title: "New request" };

export default async function NewTicketPage() {
  const [sites, techs] = await Promise.all([getSites(), getTechs()]);
  return <NewTicketView sites={sites} techs={techs} />;
}
