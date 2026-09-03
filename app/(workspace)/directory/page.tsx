import type { Metadata } from "next";
import { DirectoryView } from "@/components/directory-view";
import { getPeople, getSites } from "@/lib/ticket-data";
export const metadata: Metadata = { title: "Staff directory" };
export default async function DirectoryPage() { const [people, sites] = await Promise.all([getPeople(), getSites()]); return <DirectoryView initialPeople={people} sites={sites} />; }
