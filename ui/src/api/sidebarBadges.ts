import type { SidebarBadges } from "@sovereign-clip/shared";
import { api } from "./client";

export const sidebarBadgesApi = {
  get: (companyId: string) => api.get<SidebarBadges>(`/companies/${companyId}/sidebar-badges`),
};
