import type { Metadata } from "next";
import { BoardView } from "@/components/board-view";
export const metadata: Metadata = { title: "Site board" };
export default function BoardPage() { return <BoardView />; }
