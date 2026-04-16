export const queryKeys = {
  ownerDashboard: (companyId: string) =>
    ["owner", "dashboard", companyId] as const,
};
