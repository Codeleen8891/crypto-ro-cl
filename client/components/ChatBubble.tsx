import React, { useState, useEffect } from "react";
import { ChatMessage } from "@/types";

export default function ChatBubble({
  msg,
  me,
}: {
  msg: ChatMessage;
  me: string;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const isMine = msg.sender === me;
  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URLL || "http://localhost:5000";
  const fileSrc = msg.fileUrl?.startsWith("http")
    ? msg.fileUrl
    : `${baseUrl}${msg.fileUrl}`;

  console.log(fileSrc);
  // 🔹 Close preview with ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPreview(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <div className={`my-2 flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%]">
          <div
            className={`px-3 py-2 rounded-2xl shadow-md text-sm ${
              isMine
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-[#24344d] text-gray-100 rounded-bl-none"
            }`}
          >
            {msg.type === "image" ? (
              <img
                src={fileSrc}
                alt="sent"
                className="rounded-lg max-h-64 object-cover cursor-pointer"
                onClick={() => setShowPreview(true)}
              />
            ) : msg.type === "audio" ? (
              <audio src={fileSrc} controls className="w-56" />
            ) : (
              <span>{msg.message}</span>
            )}
          </div>
          <div
            className={`text-[10px] mt-1 ${
              isMine ? "text-right" : "text-left"
            } text-gray-400`}
          >
            {time}
          </div>
        </div>
      </div>

      {/* 🔹 Fullscreen preview with dark backdrop */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowPreview(false)}
        >
          <img
            src={fileSrc}
            alt="preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}
