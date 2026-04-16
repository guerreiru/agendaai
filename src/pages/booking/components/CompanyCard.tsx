import { Button } from "../../../components/ui/button";
import type { CompanySearchResult } from "../../../services/api/booking";
import { highlight } from "../../../utils/highlight";

export function CompanyCard({
	company,
	query,
	onClick,
}: {
	company: CompanySearchResult;
	query: string;
	onClick: () => void;
}) {
	return (
		<div className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-orange-600 hover:shadow-md">
			<div className="flex items-center gap-3">
				<div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
					{company.name.charAt(0)}
				</div>

				<div>
					<p className="font-semibold text-slate-950">
						{highlight(company.name, query)}
					</p>

					{company.slug && (
						<p className="text-sm text-slate-500">{company.slug}</p>
					)}

					{company.phone && (
						<p className="text-sm text-slate-500">{company.phone}</p>
					)}
				</div>
			</div>

			<Button onClick={onClick}>Agendar</Button>
		</div>
	);
}
