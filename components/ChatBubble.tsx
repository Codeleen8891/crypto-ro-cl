"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/types";

export default function ChatBubble({
  msg,
  me,
  onDelete,
}: {
  msg: ChatMessage;
  me: string;
  onDelete?: (id: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMine = msg.sender === me;
  const dateObj = new Date(msg.createdAt);
  const time = dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = dateObj.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URLL || "http://localhost:5000";
  const fileSrc = msg.fileUrl?.startsWith("http")
    ? msg.fileUrl
    : `${baseUrl}${msg.fileUrl}`;

  // 🔹 Close with ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreview(false);
        setShowMenu(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // 🔹 Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <>
      <div className={`my-2 flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%] relative group">
          <div
            className={`px-3 py-2 rounded-2xl shadow-md text-sm relative ${
              isMine
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-[#24344d] text-gray-100 rounded-bl-none"
            }`}
          >
            {msg.type === "deleted" ? (
              <span className="italic opacity-70">
                This message was deleted
              </span>
            ) : msg.type === "image" ? (
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

            {/* 🔹 3-dot menu (only on hover) */}
            {isMine && msg.type !== "deleted" && (
              <div
                className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                ref={menuRef}
              >
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="text-gray-300 hover:text-white"
                >
                  ⋮
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-28 bg-white text-black rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        onDelete?.(msg._id);
                        setShowMenu(false);
                      }}
                      className="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date + Time */}
          <div
            className={`text-[10px] mt-1 ${
              isMine ? "text-right" : "text-left"
            } text-gray-400`}
          >
            {date} · {time}
          </div>
        </div>
      </div>

      {/* 🔹 Fullscreen preview with dark backdrop */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => {
            setShowPreview(false);
            setShowMenu(false); // also close delete menu
          }}
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
