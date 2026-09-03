import type { Metadata } from "next";
import { BoardView } from "@/components/board-view";
import { getSites, getTickets } from "@/lib/ticket-data";
export const metadata: Metadata = { title: "Site board" };
export default async function BoardPage() { const [sites, tickets] = await Promise.all([getSites(), getTickets()]); return <BoardView sites={sites} initialTickets={tickets} />; }
