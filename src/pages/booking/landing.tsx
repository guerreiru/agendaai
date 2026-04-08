import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../../components/ui/formField";
import {
	type CompanySearchResult,
	searchPublicCompanies,
} from "../../services/api/booking";

export function BookingLandingPage() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<CompanySearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searched, setSearched] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);

		const trimmed = query.trim();

		if (!trimmed) {
			setResults([]);
			setSearched(false);
			setError(null);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			setIsLoading(true);
			setError(null);
			try {
				const data = await searchPublicCompanies(trimmed);
				setResults(data);
				setSearched(true);
			} catch {
				setError("Não foi possível buscar empresas. Tente novamente.");
				setResults([]);
			} finally {
				setIsLoading(false);
			}
		}, 400);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	return (
		<section className="mx-auto max-w-2xl space-y-8 py-8">
			{/* hero */}
			<div className="space-y-2 text-center">
				<h1 className="text-3xl font-bold text-slate-900">
					Agende seu horário
				</h1>
				<p className="text-slate-500">
					Busque uma empresa e agende online em poucos cliques.
				</p>
			</div>

			{/* search input */}
			<div className="relative">
				<FormField
					autoFocus
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar empresa por nome..."
				/>
				{isLoading && (
					<span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
						Buscando...
					</span>
				)}
			</div>

			{/* error */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{/* results */}
			{searched && !isLoading && results.length === 0 && !error && (
				<div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500">
					Nenhuma empresa encontrada para{" "}
					<span className="font-semibold">"{query}"</span>.
				</div>
			)}

			{results.length > 0 && (
				<ul className="space-y-3">
					{results.map((company) => (
						<li key={company.id}>
							<Link
								to={`/booking/${company.slug}`}
								className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-sky-400 hover:shadow-md"
							>
								<div className="space-y-0.5">
									<p className="font-semibold text-slate-900">{company.name}</p>
									{company.phone && (
										<p className="text-sm text-slate-500">{company.phone}</p>
									)}
									<p className="font-mono text-xs text-slate-400">
										/booking/{company.slug}
									</p>
								</div>
								<span className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800">
									Agendar
								</span>
							</Link>
						</li>
					))}
				</ul>
			)}

			{/* empty state — before any search */}
			{!searched && !isLoading && !error && (
				<div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-400">
					Digite o nome da empresa para começar a busca.
				</div>
			)}
		</section>
	);
}
