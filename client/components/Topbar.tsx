"use client";
import { useState, useEffect } from "react";
import { userApi } from "@/lib/api";
import { Bell, Search } from "lucide-react";

export default function Topbar() {
  const [me, setMe] = useState<{
    _id: string;
    name: string;
    email: string;
    avatar?: string | null;
    nationality?: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await userApi.me(); // ✅ fetch from backend
        setMe(user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    })();
  }, []);

  const renderAvatar = () => {
    if (me?.avatar) {
      return (
        <img
          src={
            me.avatar.startsWith("http")
              ? me.avatar
              : `${process.env.NEXT_PUBLIC_API_URL}/${me.avatar}`
          }
          alt="avatar"
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <span className="w-full h-full flex items-center justify-center bg-brand-700 text-white font-semibold">
        {me?.name?.[0]?.toUpperCase() || "U"}
      </span>
    );
  };

  return (
    <div className="flex items-center justify-between">
      <h1 className="h1">Dashboard</h1>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 card px-3 py-2">
          <Search size={18} className="text-white/70" />
          <input
            className="bg-transparent outline-none text-sm placeholder:text-white/50"
            placeholder="Search..."
          />
        </div>
        <button className="card p-2">
          <Bell size={20} className="text-white/80" />
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/20">
          {renderAvatar()}
        </div>
      </div>
    </div>
  );
}
