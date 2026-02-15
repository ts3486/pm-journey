import type { OrganizationMember } from "@/types";

type OrganizationRole = OrganizationMember["role"] | string | null | undefined;

export const canViewTeamManagement = (role: OrganizationRole): boolean => {
  return role === "owner" || role === "admin" || role === "manager";
};
