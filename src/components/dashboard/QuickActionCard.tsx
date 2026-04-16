import { Link } from "react-router-dom";

type QuickActionCardProps = {
  title: string;
  description: string;
  to: string;
  icon: React.ReactNode;
  iconClassName: string;
};

export function QuickActionCard({
  title,
  description,
  to,
  icon,
  iconClassName,
}: QuickActionCardProps) {
  return (
    <Link
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
      to={to}
    >
      <div className={`mb-4 inline-flex rounded-xl p-2.5 ${iconClassName}`}>
        {icon}
      </div>
      <h3 className="text-3xl font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}