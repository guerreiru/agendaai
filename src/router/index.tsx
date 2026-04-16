import {
	CalendarDays,
	Clock3,
	House,
	LayoutDashboard,
	Plus,
	Search,
	Settings,
	Sparkles,
	Users,
} from "lucide-react";
import {
	createBrowserRouter,
	Link,
	Navigate,
	Outlet,
	RouterProvider,
} from "react-router-dom";
import {
	type SideNavItem,
	SideNavLayout,
} from "../components/layouts/SideNavLayout";
import { useAuth } from "../hooks/useAuth";
import { BookingPage } from "../pages/booking";
import { BookingLandingPage } from "../pages/booking/landing";
import { ClientDashboardPage } from "../pages/client/dashboard";
import { ForbiddenPage } from "../pages/forbidden";
import { LoginPage } from "../pages/login";
import { OwnerAppointmentsPage } from "../pages/owner/appointments";
import { OwnerAvailabilitiesPage } from "../pages/owner/availabilities";
import { CompanyCreatePage } from "../pages/owner/company-create";
import { CompanyEditPage } from "../pages/owner/company-edit";
import { OwnerDashboardPage } from "../pages/owner/dashboard";
import { OwnerNewAppointmentPage } from "../pages/owner/new-appointment";
import { OwnerProfessionalsPage } from "../pages/owner/professionals";
import { OwnerServicesPage } from "../pages/owner/services";
import { ProfessionalAvailabilitiesPage } from "../pages/professional/availabilities";
import { ProfessionalDashboardPage } from "../pages/professional/dashboard";
import { ProfessionalNewAppointmentPage } from "../pages/professional/new-appointment";
import { RegisterPage } from "../pages/register";
import { OwnerCompanyRequiredRoute } from "../routes/OwnerCompanyRequiredRoute";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RoleRoute } from "../routes/RoleRoute";
import { getRoleDashboardPath } from "../routes/role-redirect";
import { hasUserCompany } from "../utils/company";

function HomeRedirect() {
	const { isAuthenticated, user, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="grid min-h-[30vh] place-items-center text-slate-600">
				Carregando sessão...
			</div>
		);
	}

	if (!isAuthenticated || !user) {
		return (
			<div className="space-y-2">
				<h1 className="text-2xl font-bold text-slate-950">AgendaAI</h1>
				<p className="text-slate-700">Faça login para acessar seu dashboard.</p>
				<Link className="text-sky-700 underline" to="/login">
					Ir para login
				</Link>
			</div>
		);
	}

	return <Navigate replace to={getRoleDashboardPath(user.role)} />;
}

function LoginRoute() {
	const { isAuthenticated, user, isLoading } = useAuth();

	if (isLoading) {
		return (
			<div className="grid min-h-[30vh] place-items-center text-slate-600">
				Carregando sessão...
			</div>
		);
	}

	if (isAuthenticated && user) {
		return <Navigate replace to={getRoleDashboardPath(user.role)} />;
	}

	return <LoginPage />;
}

function AppLayout() {
	const { isAuthenticated, user } = useAuth();

	return (
		<main className="h-full">
			{!isAuthenticated ||
				(!user && (
					<header className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
						<nav className="flex items-center gap-3 text-sm">
							<Link className="text-sky-700 hover:underline" to="/booking">
								Agendar
							</Link>
							<Link className="text-sky-700 hover:underline" to="/login">
								Login
							</Link>
							<Link className="text-sky-700 hover:underline" to="/register">
								Cadastro
							</Link>
						</nav>
					</header>
				))}
			<Outlet />
		</main>
	);
}

function OwnerAreaLayout() {
	const { user } = useAuth();
	const ownerHasCompany = hasUserCompany(user);

	const sideNavItems: SideNavItem[] = [
		{
			label: "Dashboard",
			to: "/owner/dashboard",
			icon: <LayoutDashboard className="size-4" />,
		},
		{
			label: "Profissionais",
			to: "/owner/professionals",
			icon: <Users className="size-4" />,
			disabled: !ownerHasCompany,
		},
		{
			label: "Serviços",
			to: "/owner/services",
			icon: <Sparkles className="size-4" />,
			disabled: !ownerHasCompany,
		},
		{
			label: "Disponibilidade",
			to: "/owner/availabilities",
			icon: <Clock3 className="size-4" />,
			disabled: !ownerHasCompany,
		},
		{
			label: "Agendamentos",
			to: "/owner/appointments",
			icon: <CalendarDays className="size-4" />,
			disabled: !ownerHasCompany,
		},
		{
			label: "Novo agendamento",
			to: "/owner/new-appointment",
			icon: <Plus className="size-4" />,
			disabled: !ownerHasCompany,
		},
		{
			label: "Configurações",
			to: ownerHasCompany ? "/owner/company/edit" : "/owner/company/create",
			icon: <Settings className="size-4" />,
		},
	];

	return (
		<SideNavLayout
			eyebrow="Painel da empresa"
			items={sideNavItems}
			title="Navegação"
		/>
	);
}

function ClientAreaLayout() {
	const sideNavItems: SideNavItem[] = [
		{
			label: "Home",
			to: "/client/dashboard",
			icon: <House className="size-4" />,
		},
		{
			label: "Buscar serviços",
			to: "/client/booking",
			icon: <Search className="size-4" />,
		},
	];

	return (
		<SideNavLayout
			eyebrow="Minha área"
			items={sideNavItems}
			title="Navegação"
		/>
	);
}

function ProfessionalAreaLayout() {
	const sideNavItems: SideNavItem[] = [
		{
			label: "Minha agenda",
			to: "/professional/dashboard",
			icon: <CalendarDays className="size-4" />,
		},
		{
			label: "Disponibilidade",
			to: "/professional/availabilities",
			icon: <Clock3 className="size-4" />,
		},
		{
			label: "Novo agendamento",
			to: "/professional/new-appointment",
			icon: <Plus className="size-4" />,
		},
	];

	return (
		<SideNavLayout
			eyebrow="Área profissional"
			items={sideNavItems}
			title="Navegação"
		/>
	);
}

const router = createBrowserRouter([
	{
		path: "/",
		element: <AppLayout />,
		children: [
			{
				index: true,
				element: <HomeRedirect />,
			},
			{
				element: <ProtectedRoute />,
				children: [
					{
						element: <RoleRoute allowedRoles={["CLIENT"]} />,
						children: [
							{
								element: <ClientAreaLayout />,
								children: [
									{
										path: "client/dashboard",
										element: <ClientDashboardPage />,
									},
									{
										path: "client/booking",
										element: <BookingLandingPage />,
									},
									{
										path: "client/booking/:slug",
										element: <BookingPage />,
									},
								],
							},
						],
					},
					{
						element: <RoleRoute allowedRoles={["COMPANY_OWNER"]} />,
						children: [
							{
								element: <OwnerAreaLayout />,
								children: [
									{
										path: "owner/dashboard",
										element: <OwnerDashboardPage />,
									},
									{
										path: "owner/company/create",
										element: <CompanyCreatePage />,
									},
									{
										element: <OwnerCompanyRequiredRoute />,
										children: [
											{
												path: "owner/services",
												element: <OwnerServicesPage />,
											},
											{
												path: "owner/professionals",
												element: <OwnerProfessionalsPage />,
											},
											{
												path: "owner/availabilities",
												element: <OwnerAvailabilitiesPage />,
											},
											{
												path: "owner/appointments",
												element: <OwnerAppointmentsPage />,
											},
											{
												path: "owner/new-appointment",
												element: <OwnerNewAppointmentPage />,
											},
											{
												path: "owner/company/edit",
												element: <CompanyEditPage />,
											},
										],
									},
								],
							},
						],
					},
					{
						element: <RoleRoute allowedRoles={["PROFESSIONAL"]} />,
						children: [
							{
								element: <ProfessionalAreaLayout />,
								children: [
									{
										path: "professional/dashboard",
										element: <ProfessionalDashboardPage />,
									},
									{
										path: "professional/new-appointment",
										element: <ProfessionalNewAppointmentPage />,
									},
									{
										path: "professional/availabilities",
										element: <ProfessionalAvailabilitiesPage />,
									},
								],
							},
						],
					},
					{
						path: "dashboard",
						element: <Navigate replace to="/" />,
					},
				],
			},
		],
	},
	{
		path: "/login",
		element: <LoginRoute />,
	},
	{
		path: "/register",
		element: <RegisterPage />,
	},
	{
		path: "/forbidden",
		element: <ForbiddenPage />,
	},
	{
		path: "/booking",
		element: <BookingLandingPage />,
	},
	{
		path: "/booking/:slug",
		element: <BookingPage />,
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
