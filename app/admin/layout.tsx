"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0; // MUST be number, not {}

import Protected from "@/components/Protected";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Protected>
      <div className="min-h-screen p-4 md:p-6">{children}</div>
    </Protected>
  );
}
