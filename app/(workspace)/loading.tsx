export default function Loading() {
  return <div className="page-wrap" aria-label="Loading workspace"><div className="skeleton mb-8 h-12 w-72" /><div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-32" />)}</div><div className="skeleton mt-6 h-[420px]" /></div>;
}
