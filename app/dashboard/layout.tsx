// ...existing code...
import type { ReactNode } from "react";
import DashboardLayoutClient from "./layout-client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  console.log("DASHBOARD LAYOUT ACTIVE");
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
// ...existing code...