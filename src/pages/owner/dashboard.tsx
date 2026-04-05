import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { hasUserCompany } from "../../utils/company";

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const companyLinked = hasUserCompany(user);

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        Dashboard da empresa
      </h1>
      {!companyLinked ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <h2 className="text-base font-semibold">
            Cadastro de empresa pendente
          </h2>
          <p className="mt-1 text-sm">
            Voce ainda nao possui uma empresa vinculada ao seu usuario. Cadastre
            sua empresa para destravar o cadastro de servicos, profissionais e
            disponibilidades.
          </p>
          <Link
            className="mt-3 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            to="/owner/company/create"
          >
            Cadastrar Empresa
          </Link>
        </div>
      ) : null}

      <ul className="list-disc space-y-1 pl-5 text-slate-700">
        <li>Serviços da empresa</li>
        <li>Profissionais da empresa</li>
        <li>Agendamentos da empresa</li>
      </ul>

      {companyLinked ? (
        <>
          <Link
            className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            to="/owner/services"
          >
            Ir para gestao de servicos
          </Link>
          <Link
            className="ml-3 inline-flex rounded-lg border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            to="/owner/professionals"
          >
            Ir para gestao de profissionais
          </Link>
          <Link
            className="ml-3 inline-flex rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            to="/owner/availabilities"
          >
            Ir para disponibilidade dos profissionais
          </Link>
          <Link
            className="ml-3 inline-flex rounded-lg border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
            to="/owner/appointments"
          >
            Ir para agendamentos
          </Link>
          <Link
            className="ml-3 inline-flex rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            to="/owner/company/edit"
          >
            Editar empresa
          </Link>{" "}
        </>
      ) : null}
    </section>
  );
}
