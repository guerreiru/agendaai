import axios from "axios";
import type {
	CompanyDashboardResponse,
	ProfessionalDashboardResponse,
} from "../../types/dashboard";
import { api } from "./client";

function isTransientFailure(error: unknown): boolean {
	if (!axios.isAxiosError(error)) {
		return false;
	}

	if (!error.response) {
		return true;
	}

	if (error.code === "ECONNABORTED") {
		return true;
	}

	const status = error.response.status;
	return status >= 500;
}

async function withSingleRetry<T>(request: () => Promise<T>): Promise<T> {
	try {
		return await request();
	} catch (error) {
		if (!isTransientFailure(error)) {
			throw error;
		}

		return request();
	}
}

export async function getCompanyDashboard(
	companyId: string,
): Promise<CompanyDashboardResponse> {
	return withSingleRetry(async () => {
		const response = await api.get<CompanyDashboardResponse>(
			`/companies/${companyId}/dashboard`,
			{ headers: { "Content-Type": "application/json" } },
		);
		return response.data;
	});
}

export async function getProfessionalDashboardMe(): Promise<ProfessionalDashboardResponse> {
	return withSingleRetry(async () => {
		const response = await api.get<ProfessionalDashboardResponse>(
			"/professionals/me/dashboard",
			{ headers: { "Content-Type": "application/json" } },
		);
		return response.data;
	});
}
