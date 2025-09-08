"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, MessageCircle, User2 } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext"; // ✅ import context

// ✅ dictionary for sidebar items
const navTranslations = {
  en: {
    dashboard: "Dashboard",
    updateProfile: "Update Profile",
    chat: "Chat Admin",
    referrals: "Refer a Friend",
    logout: "Logout",
  },
  zh: {
    dashboard: "仪表盘",
    updateProfile: "更新资料",
    chat: "联系管理员",
    referrals: "邀请好友",
    logout: "退出登录",
  },
};

export default function Sidebar() {
  const pathname = usePathname();
  const { lang } = useLanguage(); // ✅ get selected language
  const t = navTranslations[lang];

  const [me, setMe] = useState<{
    _id: string;
    name: string;
    email: string;
    photo?: string | null;
    nationality?: string;
  } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          setMe(JSON.parse(raw));
        } catch {}
      }
      try {
        const user = await userApi.me();
        setMe(user);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    loadUser();

    // ✅ Listen for custom "user-updated" event
    const updateHandler = () => {
      const raw = localStorage.getItem("user");
      if (raw) {
        try {
          setMe(JSON.parse(raw));
        } catch {}
      }
    };

    window.addEventListener("user-updated", updateHandler);
    window.addEventListener("storage", updateHandler);

    return () => {
      window.removeEventListener("user-updated", updateHandler);
      window.removeEventListener("storage", updateHandler);
    };
  }, []);

  const NAV = [
    { href: "/dashboard", label: t.dashboard, icon: Home },
    {
      href: "/dashboard/update-profile",
      label: t.updateProfile,
      icon: Settings,
    },
    { href: "/dashboard/chat", label: t.chat, icon: MessageCircle },
    { href: "/dashboard/referrals", label: t.referrals, icon: User2 },
  ];

  return (
    <aside className="hidden md:flex w-72 p-6 flex-col gap-6 bg-gradient-to-b from-brand-900/80 to-brand-900/20 rounded-r-2xl">
      {/* Profile section */}
      <div className="flex flex-col items-center mt-4">
        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/20 mb-2 flex items-center justify-center bg-brand-700 text-white text-2xl font-bold">
          {me?.photo ? (
            <img
              src={
                me.photo.startsWith("http")
                  ? me.photo
                  : `${process.env.NEXT_PUBLIC_API_URLL}${me.photo}`
              }
              alt="User photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{me?.name?.[0]?.toUpperCase() || "U"}</span>
          )}
        </div>
        <h3 className="font-semibold">{me?.name || "Loading..."}</h3>
      </div>

      {/* Navigation */}
      <nav className="mt-4 space-y-2">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10"
              )}
            >
              <Icon size={18} /> {n.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            location.href = "/login";
          }}
          className="btn btn-outline w-full"
        >
          {t.logout}
        </button>
      </div>
    </aside>
  );
}
