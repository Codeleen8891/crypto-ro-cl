"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState } from "react";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const r = useRouter();

  // --- login state ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // --- forgot password modal state ---
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStage, setForgotStage] = useState<"email" | "otp">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ----------------- login -----------------
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await authApi.login({ email, password });

      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.user.role ?? "user");

      if (res.user.role === "admin") {
        localStorage.setItem("adminId", res.user._id);
        r.push("/admin");
      } else {
        localStorage.setItem("userId", res.user._id);
        r.push("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Login failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  // ----------------- forgot password -----------------
  const handleForgot = async () => {
    try {
      setLoading(true);
      setMsg("");

      if (forgotStage === "email") {
        // ✅ request OTP from /auth/forgot-password
        const res = await authApi.forgotPassword({ email: forgotEmail });
        setMsg(res.message || "OTP has been sent to your email.");
        setForgotStage("otp");
      } else {
        // ✅ reset with OTP from /auth/reset-password
        const res = await authApi.resetPassword(
          { newPassword: forgotNewPassword },
          forgotOtp
        );
        setMsg(res.message || "Password reset successfully.");
        // reset modal after success
        setTimeout(() => {
          setShowForgot(false);
          setForgotStage("email");
          setForgotEmail("");
          setForgotOtp("");
          setForgotNewPassword("");
          setMsg("");
        }, 2000);
      }
    } catch (err: any) {
      setMsg(err?.response?.data?.message || err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  // ----------------- resend OTP -----------------
  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setMsg("");
      const res = await authApi.resendOtp({ email: forgotEmail });
      setMsg(res.message || "A new OTP has been sent to your email.");
    } catch (err: any) {
      setMsg(
        err?.response?.data?.message || err?.message || "Failed to resend OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8 bg-white/10 backdrop-blur-lg rounded-2xl">
        <h1 className="h1 mb-6 text-center text-white">Welcome back</h1>
        {error && <div className="mb-4 text-red-300">{error}</div>}

        {/* --- Login form --- */}
        <form
          onSubmit={submit}
          className="space-y-4"
          data-testid="register-form"
        >
          <input
            className="input bg-white text-black placeholder-gray-500 w-full"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input bg-white text-black placeholder-gray-500 w-full"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary w-full" disabled={busy}>
            <LogIn size={18} />
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* --- Forgot password link --- */}
        {/* --- Forgot password link --- */}
        <p className="mt-4 text-sm text-white/70 text-center">
          <button
            className="text-brand-300 hover:underline"
            onClick={() => setShowForgot(true)}
          >
            Forgot password?
          </button>
        </p>

        <p className="mt-2 text-sm text-white/70 text-center">
          No account?{" "}
          <a href="/register" className="text-brand-300 hover:underline">
            Create one
          </a>
        </p>

        {/* --- Activate account link --- */}
        <p className="mt-2 text-sm text-white/70 text-center">
          Already registered but not verified?{" "}
          <button
            className="text-brand-300 hover:underline"
            onClick={() => {
              if (!email) {
                alert("Please enter your email above first.");
                return;
              }
              r.push(`/verify-otp?email=${encodeURIComponent(email)}`);
            }}
          >
            Activate account
          </button>
        </p>
      </div>

      {/* --- Forgot Password Modal --- */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Reset Password
            </h2>

            {msg && <div className="mb-3 text-sm text-blue-600">{msg}</div>}

            {forgotStage === "email" && (
              <div className="space-y-3">
                <input
                  type="email"
                  className="input w-full bg-white text-black placeholder-gray-500"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                <button
                  className="btn btn-primary w-full"
                  onClick={handleForgot}
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            )}

            {forgotStage === "otp" && (
              <div className="space-y-3">
                <input
                  type="text"
                  className="input w-full bg-white text-black placeholder-gray-500"
                  placeholder="Enter OTP"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value)}
                />
                <input
                  type="password"
                  className="input w-full bg-white text-black placeholder-gray-500"
                  placeholder="Enter new password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                />
                <button
                  className="btn btn-primary w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg py-2 text-center"
                  onClick={handleForgot}
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  className="btn btn-primary w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg py-2 text-center"
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  {loading ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            )}

            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setShowForgot(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
