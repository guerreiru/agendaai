import type { UserRole } from "../types/user";

const roleDashboardMap: Record<UserRole, string> = {
  CLIENT: "/client/dashboard",
  COMPANY_OWNER: "/owner/dashboard",
  PROFESSIONAL: "/professional/dashboard",
  ADMIN: "/forbidden",
  SUPER_ADMIN: "/forbidden",
};

export function getRoleDashboardPath(role: UserRole): string {
  return roleDashboardMap[role] ?? "/forbidden";
}
