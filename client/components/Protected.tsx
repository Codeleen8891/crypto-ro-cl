"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Protected({ children }: { children: React.ReactNode }) {
  const r = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") || ""; // 👈 fallback

    if (!token) {
      r.replace("/login");
      return;
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      r.replace("/dashboard");
      return;
    }

    if (pathname.startsWith("/dashboard") && role === "admin") {
      r.replace("/admin");
      return;
    }

    setOk(true);
  }, [r, pathname]);

  if (!ok) return null;
  return <>{children}</>;
}
