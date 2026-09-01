import type { Metadata } from "next";
import { DirectoryImport } from "@/components/directory-import";
export const metadata: Metadata = { title: "Import staff directory" };
export default function ImportPage() { return <DirectoryImport />; }
