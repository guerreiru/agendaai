import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/user";

type RoleRouteProps = {
	allowedRoles: UserRole[];
};

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
	const { user, isLoading, isAuthenticated } = useAuth();

	if (isLoading) {
		return (
			<div className="grid min-h-[40vh] place-items-center text-slate-600">
				Validando permissao...
			</div>
		);
	}

	if (!isAuthenticated || !user) {
		return <Navigate to="/login" replace />;
	}

	if (!allowedRoles.includes(user.role)) {
		return <Navigate to="/forbidden" replace />;
	}

	return <Outlet />;
}
