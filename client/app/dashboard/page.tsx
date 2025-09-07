"use client";
import { useEffect, useState } from "react";
import { Share2, ThumbsUp, MessageSquare } from "lucide-react";
import { userApi, chatApi } from "@/lib/api";
import StatCard from "@/components/StatCard";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
  const { t } = useLanguage();
  const router = useRouter();

  // ✅ User state
  const [me, setMe] = useState<{
    _id: string;
    name: string;
    email: string;
    photo?: string | null;
  } | null>(null);

  const [stats, setStats] = useState({ shares: 0, referrals: 0 });
  const [messages, setMessages] = useState<
    Array<{
      _id: string;
      userId: string;
      lastMessage: string;
      updatedAt: string;
    }>
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const user = await userApi.me(); // ensure user is authenticated
        setMe(user);
        console.log(me);

        const s = await userApi.stats();
        setStats(s);

        const chats = await chatApi.getConversations();
        setMessages(chats.slice(0, 10)); // latest 10
        console.log(messages);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        router.push("/login");
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mt-4">
        <LanguageSwitcher />
      </div>

      {/* ✅ Animated welcome message */}
      <section className="p-6 rounded-2xl shadow-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <h2 className="text-2xl font-bold mb-2 animate-pulse">
          {t.welcomeTitle || "Welcome to Crypto Royal!"}
        </h2>

        <p className="text-sm leading-relaxed">
          {(
            t.welcomeMessage ||
            `Hey {name}, we are thrilled to have you on board! Our platform is designed
      to help you achieve your financial goals through smart investing and expert insights.
      Get started by exploring our resources, learning about our investment options,
      and connecting with our community. We're here to support you every step of the way.
      Happy investing!`
          ).replace("{name}", me?.name || "Investor")}
        </p>
      </section>

      {/* ✅ Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title={t.shares}
          value={Number(stats.shares) - 1}
          icon={<Share2 className="text-accent" />}
        />
        <StatCard
          title={t.referrals}
          value={stats.referrals}
          icon={<ThumbsUp className="text-accent" />}
        />
      </section>

      {/* ✅ Last 10 messages */}
      <section className="card p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MessageSquare size={18} />
          {t.latestMessages || "Latest Messages from Admin"}
        </h3>
        <ul className="space-y-3">
          {messages.length === 0 ? (
            <li className="text-gray-500 text-sm">No messages yet.</li>
          ) : (
            messages.map((msg) => (
              <li
                key={msg._id}
                className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer transition"
                onClick={() => router.push(`/dashboard/chat`)}
              >
                <p className="text-sm text-gray-800 truncate">
                  {msg.lastMessage}
                </p>
                <span className="text-xs text-gray-500">
                  {new Date(msg.updatedAt).toLocaleString()}
                </span>
              </li>
            ))
          )}
        </ul>

        {/* ✅ View More button */}
        {messages.length > 0 && (
          <button
            onClick={() => router.push("/dashboard/chat")}
            className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
          >
            View More
          </button>
        )}
      </section>
    </div>
  );
}
