type UserCompanyShape = {
	companyId?: string | null;
	ownedCompany?: Array<{ id: string }>;
};

export function getUserCompanyId(
	user: UserCompanyShape | null | undefined,
): string | null {
	return user?.companyId ?? user?.ownedCompany?.[0]?.id ?? null;
}

export function hasUserCompany(
	user: UserCompanyShape | null | undefined,
): boolean {
	return Boolean(getUserCompanyId(user));
}
