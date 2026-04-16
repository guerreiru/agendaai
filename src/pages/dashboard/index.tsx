import { useAuth } from "../../hooks/useAuth";
import { sanitizeUserInput } from "../../utils/sanitize";

export function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Área protegida</h1>
      <p className="text-slate-700">
        Usuário autenticado:{" "}
        <strong>{sanitizeUserInput(user?.name ?? user?.email ?? "")}</strong>
      </p>
      <button
        className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        onClick={() => void logout()}
        type="button"
      >
        Sair
      </button>
    </section>
  );
}
