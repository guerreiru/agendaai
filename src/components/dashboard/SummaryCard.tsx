
type SummaryCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
};

export function SummaryCard({ label, value, icon, iconClassName }: SummaryCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full p-1 ${iconClassName}`}>{icon}</span>
        <span className="text-3xl font-bold text-slate-800">{value}</span>
      </div>
      <p className="text-sm text-slate-500">{label}</p>
    </article>
  );
}