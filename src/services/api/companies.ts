import { api } from "./index";

export type CreateCompanyPayload = {
  name: string;
  slug: string;
  ownerId: string;
  timezone: string;
};

export type CompanyResponse = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  ownerId: string;
  timezone: string;
  autoConfirm: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Create a new company
 * POST /companies
 * Requires:
 * - Authorization header with Bearer token
 * - User role: COMPANY_OWNER, ADMIN, or SUPER_ADMIN
 * - If COMPANY_OWNER, ownerId must match the logged-in user's id
 */
export async function createCompany(
  payload: CreateCompanyPayload,
): Promise<CompanyResponse> {
  const response = await api.post<CompanyResponse>("/companies", payload);
  return response.data;
}

export type UpdateCompanyPayload = {
  name?: string;
  slug?: string;
  phone?: string | null;
  timezone?: string;
};

export async function getCompanyById(
  companyId: string,
): Promise<CompanyResponse> {
  const response = await api.get<CompanyResponse>(`/companies/${companyId}`);
  return response.data;
}

export async function updateCompany(
  companyId: string,
  payload: UpdateCompanyPayload,
): Promise<CompanyResponse> {
  const response = await api.patch<CompanyResponse>(
    `/companies/${companyId}`,
    payload,
  );
  return response.data;
}

/**
 * Check if a company slug is available
 * Returns true if available, false if already in use
 */
export async function checkCompanySlugAvailability(
  slug: string,
): Promise<boolean> {
  try {
    await api.get(`/companies/slug/${slug}/check`);
    return true; // 200 means available
  } catch (error: any) {
    // 409 or 404 means not available or conflict
    if (error.response?.status === 409 || error.response?.status === 400) {
      return false;
    }
    // Re-throw other errors (network, 500, etc)
    throw error;
  }
}
