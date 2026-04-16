import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export type MetricCardProps = {
	title: string;
	value: string;
	icon: ReactNode;
	iconClassName: string;
};

export function MetricCard({
	title,
	value,
	icon,
	iconClassName,
}: MetricCardProps) {
	return (
		<article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<div className="mb-8 flex items-center justify-between">
				<div className={`rounded-xl p-2.5 ${iconClassName}`}>{icon}</div>
				<ArrowUpRight className="size-4 text-emerald-500" />
			</div>
			<p className="text-center text-4xl font-bold text-slate-800">{value}</p>
			<p className="mt-1 text-center text-sm text-slate-500">{title}</p>
		</article>
	);
}
