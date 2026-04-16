import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "../../components/ui/formField";
import {
	type CompanySearchResult,
	searchPublicCompanies,
} from "../../services/api/booking";
import { CompanyCard } from "./components/CompanyCard";

function useCompanySearch(query: string) {
	const [results, setResults] = useState<CompanySearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searched, setSearched] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastRequestRef = useRef(0);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);

		const trimmed = query.trim();
		const requestId = Date.now();
		lastRequestRef.current = requestId;

		if (trimmed.length === 0) {
			void (async () => {
				setIsLoading(true);
				setError(null);
				setSearched(false);

				try {
					const data = await searchPublicCompanies("");

					if (lastRequestRef.current !== requestId) return;
					setResults(data);
				} catch {
					if (lastRequestRef.current !== requestId) return;
					setError("Não foi possível buscar empresas. Tente novamente.");
					setResults([]);
				} finally {
					if (lastRequestRef.current === requestId) {
						setIsLoading(false);
					}
				}
			})();

			return;
		}

		if (trimmed.length < 3) {
			setResults([]);
			setSearched(false);
			setError(null);
			setIsLoading(false);
			return;
		}

		debounceRef.current = setTimeout(async () => {
			setIsLoading(true);
			setError(null);

			try {
				const data = await searchPublicCompanies(trimmed);

				if (lastRequestRef.current !== requestId) return;

				setResults(data);
				setSearched(true);
			} catch {
				if (lastRequestRef.current !== requestId) return;

				setError("Não foi possível buscar empresas. Tente novamente.");
				setResults([]);
			} finally {
				if (lastRequestRef.current === requestId) {
					setIsLoading(false);
				}
			}
		}, 400);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	return { results, isLoading, searched, error };
}

function SkeletonList() {
	const skeletonKeys = ["skeleton-1", "skeleton-2", "skeleton-3"];

	return (
		<ul className="space-y-3">
			{skeletonKeys.map((key) => (
				<li
					key={key}
					className="animate-pulse rounded-xl border border-slate-200 bg-white px-5 py-4"
				>
					<div className="h-4 w-1/2 bg-slate-200 rounded mb-2" />
					<div className="h-3 w-1/3 bg-slate-200 rounded" />
				</li>
			))}
		</ul>
	);
}

export function BookingLandingPage() {
	const [query, setQuery] = useState("");
	const navigate = useNavigate();
	const { results, isLoading, searched, error } = useCompanySearch(query);

	const handleCompanyClick = (company: CompanySearchResult) => {
		navigate(`/client/booking/${company.slug}`);
	};

	return (
		<section className="mx-auto max-w-2xl space-y-8 py-8">
			<div className="space-y-2 text-center">
				<h1 className="text-3xl font-bold text-slate-950">
					Agende seu horário
				</h1>
				<p className="text-slate-500">
					Busque uma empresa e agende online em poucos cliques.
				</p>
			</div>

			<div className="relative">
				<FormField
					autoFocus
					type="search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Ex: Barbearia do João"
					aria-label="Buscar empresa"
				/>
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			{isLoading && (
				<div role="status" aria-live="polite">
					<SkeletonList />
				</div>
			)}

			{searched && !isLoading && results.length === 0 && !error && (
				<div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center">
					<p className="text-slate-500">
						Nenhuma empresa encontrada para{" "}
						<span className="font-semibold">"{query}"</span>
					</p>
					<p className="text-xs text-slate-400 mt-1">
						Tente outro nome ou verifique a ortografia
					</p>
				</div>
			)}

			{results.length > 0 && (
				<ul className="space-y-3 max-h-100 overflow-y-auto py-4">
					{results.map((company) => (
						<li key={company.id}>
							<CompanyCard
								company={company}
								query={query}
								onClick={() => handleCompanyClick(company)}
							/>
						</li>
					))}
				</ul>
			)}

			{!searched && !isLoading && !error && results.length === 0 && (
				<div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-400">
					Digite o nome da empresa para começar a busca.
				</div>
			)}
		</section>
	);
}
