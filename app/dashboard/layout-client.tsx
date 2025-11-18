'use client'

import type { ReactNode } from "react";
import SidebarWrapper from "./sidebar-wrapper";

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  return <SidebarWrapper>{children}</SidebarWrapper>;
}
