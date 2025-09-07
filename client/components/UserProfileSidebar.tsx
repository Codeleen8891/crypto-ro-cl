import React from "react";
import Image from "next/image";
import { ChatUser } from "@/types/index";

export default function UserProfileSidebar({
  user,
  onClose,
}: {
  user: ChatUser;
  onClose: () => void;
}) {
  return (
    <aside className="w-80 bg-[#1e293b] border-l border-gray-700 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-[#0f172a] border-b border-gray-700">
        <h2 className="font-semibold">User Info</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ✖
        </button>
      </div>
      <div className="flex flex-col items-center p-6">
        {user.photo ? (
          <Image
            src={user.photo}
            alt="User"
            width={100}
            height={100}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-700 flex items-center justify-center text-3xl">
            👤
          </div>
        )}
        <h3 className="mt-4 text-lg font-bold">{user.name}</h3>
        <p className="text-sm text-gray-400">{user.email}</p>
      </div>
      <div className="p-6 space-y-3 text-sm">
        {user.createdAt && (
          <p>
            <span className="font-semibold">Joined:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        )}
        <p>
          <span className="font-semibold">Referrals:</span>{" "}
          {Array.isArray(user.referrals)
            ? user.referrals.length
            : user.referrals || 0}
        </p>
      </div>
    </aside>
  );
}
