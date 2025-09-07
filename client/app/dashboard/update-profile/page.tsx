"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { userApi } from "@/lib/api";
import type { User } from "@/types";

export default function SettingsPage() {
  const [me, setMe] = useState<User | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  const r = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const data = await userApi.me();
        setMe(data as User);
        setName(data.name || "");
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        r.push("/login");
      }
    })();
  }, []);
  console.log(`${process.env.NEXT_PUBLIC_API_URLL}/${me?.photo}`);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;

    const form = new FormData();
    form.append("name", name);
    if (photo) form.append("photo", photo);

    try {
      // 1️⃣ Update profile
      await userApi.updateProfile(form);

      // 2️⃣ Immediately fetch the latest user info
      const freshUser = await userApi.me();
      console.log(freshUser);

      // 3️⃣ Sync state + localStorage
      setMe(freshUser);
      setMsg("Profile updated successfully.");
      localStorage.setItem("user", JSON.stringify(freshUser));
      window.dispatchEvent(new Event("user-updated"));

      if (freshUser._id) {
        if (freshUser.role === "admin") {
          localStorage.setItem("adminId", freshUser._id);
        } else {
          localStorage.setItem("userId", freshUser._id);
        }
      }
    } catch (e: any) {
      setMsg(e?.message || "Failed to update profile.");
    }
  };

  const changePassword = async () => {
    try {
      if (!otpRequested) {
        // try with old password
        if (oldPassword) {
          await userApi.changePassword({ oldPassword, newPassword });
          setMsg("Password changed successfully.");
        } else {
          // request OTP
          await userApi.requestPasswordOtp();
          setOtpRequested(true);
          setMsg("OTP sent to your email.");
          return; // wait for OTP entry
        }
      } else {
        // reset with OTP
        await userApi.resetPasswordWithOtp({ otp, newPassword });
        setMsg("Password reset successfully.");
      }

      // cleanup
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setOtp("");
      setOtpRequested(false);
    } catch (err: any) {
      setMsg(err?.message || "Password change failed.");
    }
  };

  const renderphoto = () => {
    if (me?.photo) {
      return (
        <img
          src={
            me.photo.startsWith("http")
              ? me.photo
              : `${process.env.NEXT_PUBLIC_API_URLL}/${me.photo}`
          }
          alt="photo"
          className="w-16 h-16 rounded-full border border-white/20 object-cover"
        />
      );
    }
    return (
      <span className="w-16 h-16 rounded-full border border-white/20 bg-brand-700 flex items-center justify-center text-xl font-semibold text-white">
        {me?.name?.[0]?.toUpperCase() || "U"}
      </span>
    );
  };

  return (
    <>
      <h1 className="h1">Update your Profile</h1>
      <div className="card p-6 max-w-xl">
        {msg && <div className="mb-4 text-brand-200">{msg}</div>}
        <form onSubmit={save} className="space-y-4">
          {/* photo */}
          <div className="flex items-center gap-4">
            {renderphoto()}
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Full Name */}
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
          />

          {/* Change Password Button */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowPasswordModal(true)}
          >
            Change Password
          </button>

          {/* Submit */}
          <button className="btn btn-primary">Save</button>
        </form>
      </div>

      {/* Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black rounded-lg p-6 w-96 space-y-4">
            <h2 className="font-bold text-lg">Change Password</h2>

            {!otpRequested ? (
              <>
                <input
                  className="input"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Old Password (leave blank if forgotten)"
                />
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                />
              </>
            ) : (
              <>
                <input
                  className="input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                />
              </>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={changePassword}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
