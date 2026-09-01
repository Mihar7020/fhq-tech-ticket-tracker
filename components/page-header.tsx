export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="label gold mb-2">{eyebrow}</p>
        <h1 className="display text-[clamp(1.8rem,3vw,2.8rem)] leading-tight">{title}</h1>
        <p className="muted mt-2 max-w-2xl text-sm leading-relaxed">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
