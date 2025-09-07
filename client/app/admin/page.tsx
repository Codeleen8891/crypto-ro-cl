"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import { adminApi, chatApi, userApi } from "@/lib/api";
import type { ChatMessage, User } from "@/types";
import ChatBubble from "@/components/ChatBubble";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Search, Paperclip, Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import UserProfileSidebar from "@/components/UserProfileSidebar";

// ✅ translations
const t = {
  en: {
    searchUsers: "Search users…",
    logout: "Logout",
    selectUser: "Select a user to start chatting",
    pickSomeone: "Pick someone from the left 👈",
    typeMessage: "Type a message",
    send: "Send",
    discard: "Discard",
    sending: "Sending…",
  },
  zh: {
    searchUsers: "搜索用户…",
    logout: "退出",
    selectUser: "选择用户开始聊天",
    pickSomeone: "从左边选择一个人 👈",
    typeMessage: "输入消息",
    send: "发送",
    discard: "丢弃",
    sending: "发送中…",
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URLL as string;
console.log(API_URL);
const socket = io(API_URL, { autoConnect: true });

function fixUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${API_URL}${u.startsWith("/") ? u : `/${u}`}`;
}

export default function AdminChatPage() {
  const r = useRouter();
  const { lang, setLang } = useLanguage();

  const me = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("adminId") || "";
  }, []);
  const token = useMemo(
    () =>
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "",
    []
  );

  const [users, setUsers] = useState<(User & { unread?: number })[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    kind: "image" | "audio";
    blob?: Blob;
  } | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Join socket
  // Join socket
  useEffect(() => {
    if (!me) return;
    socket.emit("join", me);
    console.log(me);

    const onReceive = (msg: ChatMessage) => {
      if (msg.sender === me) return; // ✅ skip my own messages

      if (
        selected &&
        ((msg.sender === selected._id && msg.receiver === me) ||
          (msg.sender === me && msg.receiver === selected._id))
      ) {
        setMessages((p) => {
          if (p.some((m) => m._id === msg._id)) return p; // ✅ prevent duplicates
          return [...p, { ...msg, fileUrl: fixUrl(msg.fileUrl) }];
        });
      }
    };

    socket.on("receiveMessage", onReceive);
    return () => {
      socket.off("receiveMessage", onReceive);
    };
  }, [me, selected]);

  // Load users
  useEffect(() => {
    (async () => {
      try {
        const list = await adminApi.usersList(token);
        setUsers(list);
      } catch (e) {
        console.error("usersList error", e);
      }
    })();
  }, [token]);

  // Restore selected user if saved
  // Restore selected user if saved
  useEffect(() => {
    const savedId = localStorage.getItem("selectedUserId");
    if (!savedId || users.length === 0) return;

    const u = users.find((usr) => usr._id === savedId);
    if (u) {
      setSelected(u);
    }
  }, [users, token]); // <-- added token here

  // Load messages
  useEffect(() => {
    if (!selected?._id) return;
    (async () => {
      try {
        const conv = await chatApi.getConversation(selected._id, token);
        setMessages(
          conv.map((m) => ({
            ...m,
            sender:
              typeof m.sender === "object" ? (m.sender as any)._id : m.sender,
            receiver:
              typeof m.receiver === "object"
                ? (m.receiver as any)._id
                : m.receiver,

            fileUrl: fixUrl(m.fileUrl),
          }))
        );
      } catch (e) {
        console.error("getConversation error", e);
      }
    })();
  }, [selected, token]);

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filtered = users.filter((u) =>
    [u.name, u.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const logout = () => {
    localStorage.clear();
    r.replace("/login");
  };

  const sendText = async () => {
    if (!selected || !text.trim()) return;
    try {
      const msg = await chatApi.sendMessage(
        { to: selected._id, message: text.trim(), type: "text" },
        { token, senderId: me }
      );
      setMessages((p) => [
        ...p,
        {
          ...msg,
          sender: me,
          receiver: selected._id,
          fileUrl: fixUrl(msg.fileUrl),
        },
      ]);
      setText("");
      setShowEmoji(false);
    } catch (e) {
      console.error("sendMessage error", e);
    }
  };

  const handleChosenFile = async (file: File) => {
    if (!selected) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const { fileUrl } = await chatApi.upload(form, token);

      const kind: "image" | "audio" = file.type.startsWith("audio")
        ? "audio"
        : "image";

      const msg = await chatApi.sendMessage(
        { to: selected._id, fileUrl, type: kind },
        { token, senderId: me }
      );

      // ✅ Add to state (skip dupes)
      setMessages((p) => {
        if (p.some((m) => m._id === msg._id)) return p;
        return [
          ...p,
          {
            ...msg,
            sender: me,
            receiver: selected._id,
            fileUrl: fixUrl(msg.fileUrl),
          },
        ];
      });

      setPreview(null);
    } catch (e) {
      console.error("upload/send error", e);
    } finally {
      setUploading(false);
    }
  };

  const onVoiceStop = (blob: Blob) => {
    setPreview({ url: URL.createObjectURL(blob), kind: "audio", blob });
  };

  const confirmSendVoice = async () => {
    if (!preview?.blob) return;
    const file = new File([preview.blob], "voice.webm", { type: "audio/webm" });
    await handleChosenFile(file);
  };

  const handleSelectUser = async (user: User) => {
    setSelected(user);

    // ✅ persist selection
    localStorage.setItem("selectedUserId", user._id);

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/chat/mark-read/${user._id}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, unread: 0 } : u))
    );
  };

  const openProfile = async (id: string) => {
    try {
      const u = await userApi.getById(id, token);
      setProfileUser(u);
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  };

  return (
    <div className="h-screen grid grid-cols-1 md:grid-cols-[20rem_1fr] gap-3 p-3">
      {/* Sidebar */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex flex-col">
        <div className="p-3 flex items-center gap-2 border-b border-white/10">
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} className="opacity-70" />
            <Input
              placeholder={t[lang].searchUsers}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/10 text-white placeholder:text-white/60 border-white/20"
            />
          </div>

          {/* ✅ Language Switcher */}
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "zh")}
            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
          >
            <option value="en">EN</option>
            <option value="zh">中文</option>
          </select>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title={t[lang].logout}
          >
            <LogOut size={18} />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.map((u) => (
            <button
              key={u._id}
              onClick={() => handleSelectUser(u)}
              className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-white/10 transition ${
                selected?._id === u._id ? "bg-white/10" : ""
              }`}
            >
              {u.photo ? (
                <img
                  src={u.photo}
                  alt={u.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium truncate">{u.name}</div>
                <div className="text-xs opacity-70 truncate">{u.email}</div>
              </div>
              {u.unread ? (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-600">
                  {u.unread}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex flex-col">
        {/* Header */}
        {/* Header */}
        <div className="p-3 border-b border-white/10 flex items-center gap-3">
          {selected ? (
            <>
              {selected.photo ? (
                <img
                  src={selected.photo}
                  alt={selected.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {selected.name?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="leading-tight flex-1">
                <div className="font-semibold">{selected.name}</div>
                <div className="text-xs opacity-70">{selected.email}</div>
              </div>

              {/* 👇 Profile button goes here */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openProfile(selected._id)}
              >
                View Profile
              </Button>
            </>
          ) : (
            <div className="opacity-70">{t[lang].selectUser}</div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 max-h-[calc(100vh-12rem)]">
          {selected ? (
            messages.map((m) => (
              <ChatBubble
                key={m._id || `${m.sender}-${m.createdAt}`}
                msg={m}
                me={me}
              />
            ))
          ) : (
            <div className="h-full grid place-items-center opacity-70">
              {t[lang].pickSomeone}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        {selected && (
          <div className="p-3 border-t border-white/10">
            {preview && (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 p-2 bg-white/5">
                {preview.kind === "image" ? (
                  preview.url ? (
                    <img
                      src={preview.url}
                      alt="Preview"
                      className="max-h-32 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
                      ?
                    </div>
                  )
                ) : (
                  <audio src={preview.url} controls className="w-64" />
                )}

                <div className="ml-auto flex gap-2">
                  <Button
                    onClick={() => setPreview(null)}
                    variant="ghost"
                    className="border border-white/10"
                  >
                    {t[lang].discard}
                  </Button>
                  {preview.kind === "audio" ? (
                    <Button onClick={confirmSendVoice} disabled={uploading}>
                      {uploading ? t[lang].sending : t[lang].send}
                    </Button>
                  ) : (
                    <Button
                      onClick={async () => {
                        if (preview.blob) {
                          // Audio case already handled in confirmSendVoice
                          await handleChosenFile(preview.blob as File);
                        }
                      }}
                      disabled={uploading}
                    >
                      {uploading ? t[lang].sending : t[lang].send}
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowEmoji((s) => !s)}
                title="Emoji"
              >
                <Smile size={18} />
              </Button>

              <VoiceRecorder onStop={onVoiceStop} />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*"
                data-testid="chat-file-input" // ✅ add this
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.type.startsWith("audio")) {
                    const url = URL.createObjectURL(f);
                    setPreview({ url, kind: "audio", blob: f });
                  } else {
                    const url = URL.createObjectURL(f);
                    setPreview({ url, kind: "image", blob: f }); // ✅ keep file reference
                  }
                }}
              />

              <Button
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                title="Attach"
              >
                <Paperclip size={18} />
              </Button>

              <Input
                placeholder={t[lang].typeMessage}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendText();
                }}
                className="flex-1 bg-white/10 text-white placeholder:text-white/60 border-white/20"
              />
              <Button onClick={sendText} disabled={!text.trim()}>
                <Send size={16} className="mr-1" />
                {t[lang].send}
              </Button>
            </div>

            {showEmoji && (
              <div className="mt-2">
                <EmojiPicker
                  onEmojiClick={(e) => setText((t) => t + e.emoji)}
                />
              </div>
            )}
          </div>
        )}
        {profileUser && (
          <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
            <UserProfileSidebar
              user={profileUser}
              onClose={() => setProfileUser(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
