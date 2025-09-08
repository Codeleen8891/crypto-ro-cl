"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authApi } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      const res = await authApi.resetPassword({ newPassword }, token);
      setMsg(res.message || "Password reset successful. Redirecting...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err?.message || "Reset failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
        <h1 className="h1 mb-6 text-center text-white">Reset Password</h1>

        {error && <div className="mb-4 text-red-300">{error}</div>}
        {msg && <div className="mb-4 text-green-300">{msg}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <input
            className="input bg-white text-black placeholder-gray-500 w-full"
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            className="input bg-white text-black placeholder-gray-500 w-full"
            placeholder="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-4 text-sm text-white/70 text-center">
          <a href="/login" className="text-brand-300 hover:underline">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
