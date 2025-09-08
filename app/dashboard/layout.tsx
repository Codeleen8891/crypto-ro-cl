"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0; // MUST be number, not {}

import Sidebar from "@/components/Sidebar";
import Protected from "@/components/Protected";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Protected>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-[18rem_1fr] gap-6 p-4 md:p-6">
        {/* Sidebar with Logo */}
        <aside className="space-y-6">
          <div className="flex items-center gap-3 p-4"></div>
          <Sidebar />
        </aside>

        {/* Main dashboard content */}
        <main className="space-y-6">{children}</main>
      </div>
    </Protected>
  );
}
