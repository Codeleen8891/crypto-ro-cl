"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { UserPlus } from "lucide-react";

export default function RegisterPage() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (photo) formData.append("photo", photo);

      await authApi.register(formData);

      alert("✅ OTP sent to your email");
      r.push(`/verify-otp?email=${email}`);
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.message || // if backend sends { message: "Invalid credentials" }
        "Registration failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8">
        <h1 className="h1 mb-6">Create Account</h1>
        {error && <div className="mb-4 text-red-300">{error}</div>}

        <form
          onSubmit={submit}
          className="space-y-4"
          data-testid="register-form"
        >
          <input
            className="input"
            placeholder="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            className="input file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-brand-500 file:text-white hover:file:bg-brand-600"
          />

          <button className="btn btn-primary w-full" disabled={busy}>
            <UserPlus size={18} /> {busy ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-white/70">
          Already have an account?{" "}
          <a href="/login" className="text-brand-300 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
