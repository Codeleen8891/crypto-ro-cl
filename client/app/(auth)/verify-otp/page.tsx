"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0; // MUST be number, not {}

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

export default function VerifyOtpPage() {
  const r = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);

  // ⏳ countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.verifyOtp({ email, otp });
      console.log(email, otp);
      alert("✅ Account verified successfully");
      r.push("/login");
    } catch (err: any) {
      setError(err?.message || "OTP verification failed");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendOtp({ email });
      alert("📩 New OTP sent to your email");
      setCountdown(60); // restart countdown
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8">
        <h1 className="h1 mb-6">Verify Your Email</h1>
        <p className="text-white/70 text-sm mb-4">
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium">{email}</span>
        </p>

        {error && <div className="mb-4 text-red-300">{error}</div>}

        <form
          onSubmit={submit}
          className="space-y-4"
          data-testid="register-form"
        >
          <input
            className="input tracking-widest text-center"
            placeholder="Enter OTP"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button className="btn btn-primary w-full" disabled={busy}>
            <ShieldCheck size={18} /> {busy ? "Verifying..." : "Verify"}
          </button>
        </form>

        {/* 🔄 Resend OTP Section */}
        <div className="mt-4 text-center text-sm">
          {countdown > 0 ? (
            <p className="text-white/50">
              Resend available in{" "}
              <span className="font-semibold">{countdown}</span>s
            </p>
          ) : (
            <button
              onClick={resend}
              className="text-brand-300 underline hover:text-brand-200"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
