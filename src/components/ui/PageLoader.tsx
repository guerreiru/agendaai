type PageLoaderProps = {
	message?: string;
};

export function PageLoader({ message = "Carregando..." }: PageLoaderProps) {
	return (
		<div className="grid min-h-[40vh] place-items-center text-slate-600">
			{message}
		</div>
	);
}
