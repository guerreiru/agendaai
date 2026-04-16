import { Briefcase, CalendarDays, CircleDollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { quickActions } from "../../../consts/mocks";
import { MetricCard } from "../../components/dashboard/MetricCard";
import { NextAppointmentsList } from "../../components/dashboard/NextAppointmentsList";
import { QuickActionCard } from "../../components/dashboard/QuickActionCard";
import { useApiError } from "../../hooks/useApiError";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { classifyApiError } from "../../services/api/error";
import { getCompanyDashboard, toApiError } from "../../services/api";
import { queryKeys } from "../../services/queryKeys";
import { getUserCompanyId, hasUserCompany } from "../../utils/company";
import { formatCurrency } from "../../utils/currency";
import { logError } from "../../utils/logger";

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const companyLinked = hasUserCompany(user);
  const companyId = getUserCompanyId(user);
  const handleApiError = useApiError();
  const { toast, showToast } = useToast();

  const isDashboardQueryEnabled = Boolean(companyLinked && companyId);

  const {
    data: dashboard,
    error: dashboardQueryError,
    isLoading: isLoadingDashboard,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: companyId
      ? queryKeys.ownerDashboard(companyId)
      : ["owner", "dashboard", "missing-company"],
    enabled: isDashboardQueryEnabled,
    queryFn: async () => {
      if (!companyId) {
        throw new Error("Usuário sem empresa vinculada.");
      }
      return getCompanyDashboard(companyId);
    },
  });

  const dashboardErrorState = useMemo(() => {
    if (!dashboardQueryError) {
      return {
        isNotFound: false,
        message: null as string | null,
      };
    }

    const apiError = toApiError(dashboardQueryError);
    const classified = classifyApiError(apiError.statusCode, apiError.message);

    if (classified.type === "notFound") {
      return {
        isNotFound: true,
        message: null,
      };
    }

    return {
      isNotFound: false,
      message: classified.message,
    };
  }, [dashboardQueryError]);

  useEffect(() => {
    if (!dashboardQueryError) return;

    const apiError = toApiError(dashboardQueryError);

    logError("Falha ao carregar dashboard da empresa", {
      statusCode: apiError.statusCode,
      details: apiError.details,
    });

    const result = handleApiError(dashboardQueryError);
    if (!result) return;

    if (result.type === "serverError") {
      showToast("Não foi possível carregar métricas da empresa.");
    }
  }, [dashboardQueryError, handleApiError, showToast]);

  return (
    <section className="space-y-6">
      {toast ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
          {toast}
        </div>
      ) : null}

      <h1 className="text-2xl font-bold text-slate-900">
        Dashboard da empresa
      </h1>
      {!companyLinked ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <h2 className="text-base font-semibold">
            Cadastro de empresa pendente
          </h2>
          <p className="mt-1 text-sm">
            Você ainda não possui uma empresa vinculada ao seu usuário. Cadastre
            sua empresa para destravar o cadastro de serviços, profissionais e
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

      {companyLinked ? (
        <>
          {isLoadingDashboard ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                  key={`owner-metric-skeleton-${index}`}
                />
              ))}
            </div>
          ) : dashboardErrorState.isNotFound ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700">
              <p className="text-sm">
                Não encontramos dados de dashboard para esta empresa.
              </p>
              <button
                className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => void refetchDashboard()}
                type="button"
              >
                Tentar novamente
              </button>
            </div>
          ) : dashboardErrorState.message ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="text-sm">{dashboardErrorState.message}</p>
              <button
                className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                onClick={() => void refetchDashboard()}
                type="button"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<Briefcase className="size-5 text-orange-600" />}
                iconClassName="bg-orange-100"
                title="Serviços Cadastrados"
                value={dashboard?.serviceCount.toString() ?? "0"}
              />
              <MetricCard
                icon={<Briefcase className="size-5 text-sky-600" />}
                iconClassName="bg-sky-100"
                title="Profissionais"
                value={dashboard?.professionalCount.toString() ?? "0"}
              />
              <MetricCard
                icon={<CalendarDays className="size-5 text-amber-600" />}
                iconClassName="bg-amber-100"
                title="Agendamentos Hoje"
                value={dashboard?.todayAppointmentsCount.toString() ?? "0"}
              />
              <MetricCard
                icon={<CircleDollarSign className="size-5 text-emerald-600" />}
                iconClassName="bg-emerald-100"
                title="Receita do Mês"
                value={formatCurrency(dashboard?.monthRevenue ?? 0)}
              />
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-12">
            <section className="space-y-3 xl:col-span-8">
              <h2 className="text-3xl font-semibold text-slate-800">
                Ações Rápidas
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <QuickActionCard
                    description={action.description}
                    icon={action.icon}
                    iconClassName={action.iconClassName}
                    key={action.title}
                    title={action.title}
                    to={action.to}
                  />
                ))}
              </div>
            </section>

            <aside className="space-y-3 xl:col-span-4">
              <h2 className="text-3xl font-semibold text-slate-800">
                Próximos Agendamentos
              </h2>
              <NextAppointmentsList
                appointments={dashboard?.nextAppointments ?? []}
                error={null}
                isLoading={isLoadingDashboard}
                onRetry={() => void refetchDashboard()}
              />
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}
