import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { hasUserCompany } from "../utils/company";

export function OwnerCompanyRequiredRoute() {
	const { user } = useAuth();

	if (!hasUserCompany(user)) {
		return <Navigate to="/owner/dashboard" replace />;
	}

	return <Outlet />;
}
