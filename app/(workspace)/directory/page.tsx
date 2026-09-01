import type { Metadata } from "next";
import { DirectoryView } from "@/components/directory-view";
export const metadata: Metadata = { title: "Staff directory" };
export default function DirectoryPage() { return <DirectoryView />; }
