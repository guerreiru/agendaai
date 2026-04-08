import {
	createBrowserRouter,
	Link,
	Navigate,
	Outlet,
	RouterProvider,
	useNavigate,
} from "react-router-dom";
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
import { OwnerProfessionalsPage } from "../pages/owner/professionals";
import { OwnerServicesPage } from "../pages/owner/services";
import { ProfessionalDashboardPage } from "../pages/professional/dashboard";
import { ProfessionalNewAppointmentPage } from "../pages/professional/new-appointment";
import { RegisterPage } from "../pages/register";
import { OwnerCompanyRequiredRoute } from "../routes/OwnerCompanyRequiredRoute";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { RoleRoute } from "../routes/RoleRoute";
import { getRoleDashboardPath } from "../routes/role-redirect";
import { hasUserCompany } from "../utils/company";

function RoleBasedLinks() {
	const { user } = useAuth();
	const ownerHasCompany = hasUserCompany(user);

	if (!user) {
		return null;
	}

	if (user.role === "CLIENT") {
		return (
			<Link className="text-sky-700 hover:underline" to="/client/dashboard">
				Meus agendamentos
			</Link>
		);
	}

	if (user.role === "COMPANY_OWNER") {
		return (
			<>
				<Link className="text-sky-700 hover:underline" to="/owner/dashboard">
					Dashboard
				</Link>
				{ownerHasCompany ? (
					<>
						<Link className="text-sky-700 hover:underline" to="/owner/services">
							Serviços da empresa
						</Link>
						<Link
							className="text-sky-700 hover:underline"
							to="/owner/professionals"
						>
							Profissionais
						</Link>
						<Link
							className="text-sky-700 hover:underline"
							to="/owner/availabilities"
						>
							Disponibilidade
						</Link>
						<Link
							className="text-sky-700 hover:underline"
							to="/owner/appointments"
						>
							Agendamentos
						</Link>
						<Link
							className="text-sky-700 hover:underline"
							to="/owner/company/edit"
						>
							Editar empresa
						</Link>
					</>
				) : null}
			</>
		);
	}

	if (user.role === "PROFESSIONAL") {
		return (
			<>
				<Link
					className="text-sky-700 hover:underline"
					to="/professional/dashboard"
				>
					Minha agenda
				</Link>
				<Link
					className="text-sky-700 hover:underline"
					to="/professional/new-appointment"
				>
					Novo agendamento
				</Link>
			</>
		);
	}

	return null;
}

function LogoutButton() {
	const { logout, isLoading } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		navigate("/login", { replace: true });
	}

	return (
		<button
			className="rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
			disabled={isLoading}
			onClick={() => void handleLogout()}
			type="button"
		>
			Sair
		</button>
	);
}

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
				<h1 className="text-2xl font-bold text-slate-900">AgendaAI</h1>
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
		<div className="mx-auto w-[92%] max-w-5xl py-5">
			<main>
				<header className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
					<Link className="font-semibold text-slate-900" to="/">
						Plannie
					</Link>
					<nav className="flex items-center gap-3 text-sm">
						{isAuthenticated ? (
							<>
								<span className="text-slate-600">{user?.email}</span>
								<RoleBasedLinks />
								<LogoutButton />
							</>
						) : (
							<>
								<Link className="text-sky-700 hover:underline" to="/booking">
									Agendar
								</Link>
								<Link className="text-sky-700 hover:underline" to="/login">
									Login
								</Link>
								<Link className="text-sky-700 hover:underline" to="/register">
									Cadastro
								</Link>
							</>
						)}
					</nav>
				</header>
				<Outlet />
			</main>
		</div>
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
								path: "client/dashboard",
								element: <ClientDashboardPage />,
							},
						],
					},
					{
						element: <RoleRoute allowedRoles={["COMPANY_OWNER"]} />,
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
										path: "owner/company/edit",
										element: <CompanyEditPage />,
									},
									{
										path: "owner/company/edit",
										element: <CompanyEditPage />,
									},
								],
							},
						],
					},
					{
						element: <RoleRoute allowedRoles={["PROFESSIONAL"]} />,
						children: [
							{
								path: "professional/dashboard",
								element: <ProfessionalDashboardPage />,
							},
							{
								path: "professional/new-appointment",
								element: <ProfessionalNewAppointmentPage />,
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
