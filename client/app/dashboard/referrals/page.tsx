"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";

export default function ReferralsPage() {
  const [me, setMe] = useState<any>(null);
  const [copied, setCopied] = useState<{ field: "code" | "link" | null }>({
    field: null,
  });

  const r = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const user = await userApi.me();
        console.log(user);
        setMe(user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        r.push("/login");
      }
    })();
  }, []);

  if (!me) return <p>Loading...</p>;

  const referralLink = `${window.location.origin}/register?ref=${me.referralCode}`;

  const copyToClipboard = async (text: string, field: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ field });
      setTimeout(() => setCopied({ field: null }), 2000); // clear after 2s
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-6 bg-brand-900/40 rounded-2xl text-white">
      <h2 className="text-2xl font-bold mb-4">Referral Program</h2>
      <p className="mb-2">Invite friends and earn rewards!</p>

      <div className="bg-brand-800 p-4 rounded-xl mb-4 space-y-4">
        {/* Referral Code */}
        <div>
          <p className="font-semibold">Your Referral Code:</p>
          <div className="flex gap-2 items-center mt-1">
            <input
              type="text"
              readOnly
              className="flex-1 bg-brand-700 p-2 rounded text-sm"
              value={me.referralCode}
            />
            <button
              onClick={() => copyToClipboard(me.referralCode, "code")}
              className="bg-accent text-black px-3 py-2 rounded font-semibold hover:bg-accent/80 transition"
            >
              Copy
            </button>
          </div>
          {copied.field === "code" && (
            <p className="text-green-400 text-sm mt-2">
              ✅ Referral code copied!
            </p>
          )}
        </div>

        {/* Referral Link */}
        <div>
          <p className="font-semibold">Your Referral Link:</p>
          <div className="flex gap-2 items-center mt-1">
            <input
              type="text"
              readOnly
              className="flex-1 bg-brand-700 p-2 rounded text-sm"
              value={referralLink}
            />
            <button
              onClick={() => copyToClipboard(referralLink, "link")}
              className="bg-accent text-black px-3 py-2 rounded font-semibold hover:bg-accent/80 transition"
            >
              Copy
            </button>
          </div>
          {copied.field === "link" && (
            <p className="text-green-400 text-sm mt-2">
              ✅ Referral link copied!
            </p>
          )}
        </div>
      </div>

      {/* Referrals List */}
      <h3 className="text-lg font-semibold mb-2">Your Referrals:</h3>
      <ul className="space-y-2">
        {me.referrals.length === 0 && <li>No referrals yet.</li>}
        {me.referrals.map((r: any) => (
          <li
            key={r._id}
            className="p-3 bg-brand-800 rounded-xl flex justify-between"
          >
            <span>{r.name}</span>
            <span className="text-xs text-gray-400">{r.email}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
