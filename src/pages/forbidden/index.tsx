import { Link } from "react-router-dom";

export function ForbiddenPage() {
	return (
		<section className="mx-auto mt-10 max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
			<h1 className="text-2xl font-bold text-red-800">Acesso negado</h1>
			<p className="mt-2 text-red-700">
				Seu perfil não tem permissão para acessar esta área.
			</p>
			<Link
				className="mt-4 inline-block font-semibold text-red-900 underline"
				to="/"
			>
				Voltar para início
			</Link>
		</section>
	);
}
