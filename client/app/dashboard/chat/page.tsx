"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import { userApi, chatApi } from "@/lib/api";
import type { ChatMessage, User } from "@/types";
import ChatBubble from "@/components/ChatBubble";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const API_URL = process.env.NEXT_PUBLIC_API_URLL as string;
const socket = io(API_URL, { autoConnect: true });

function fixUrl(u?: string | null) {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  // always prepend backend API
  return `${process.env.NEXT_PUBLIC_API_URLL}${
    u.startsWith("/") ? u : `/${u}`
  }`;
}

export default function UserChatPage() {
  const [me, setMe] = useState<User | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    kind: "image" | "audio";
    blob?: Blob;
  } | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const r = useRouter();

  const token = useMemo(
    () =>
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "",
    []
  );

  console.log(fixUrl());
  // Load my profile (gets my _id for sockets & conversation)
  useEffect(() => {
    (async () => {
      try {
        const profile = await userApi.me(token);
        console.log(profile);
        setMe(profile as any);
        if (typeof window !== "undefined") {
          localStorage.setItem("userId", (profile as any)._id); // keep compatibility
          console.log(profile);
        }
      } catch (e) {
        console.error("userApi.me error", e);
        r.push("/login");
      }
    })();
  }, [token]);

  // Join my room and listen for incoming
  useEffect(() => {
    if (!me?._id) return;
    socket.emit("join", me._id);
    const onReceive = (msg: ChatMessage) => {
      if (msg.sender === me._id) return; // ✅ skip my own messages

      setMessages((p) => {
        if (p.some((m) => m._id === msg._id)) return p; // ✅ prevent duplicates
        return [...p, msg];
      });

      // ✅ fix other user detection
      if (msg.sender !== me._id) {
        setAdminId(msg.sender);
      } else if (msg.receiver !== me._id) {
        setAdminId(msg.receiver);
      }
    };

    socket.on("receiveMessage", onReceive);
    return () => {
      socket.off("receiveMessage", onReceive);
    };
  }, [me, adminId]);

  // Load existing conversation, and infer adminId from it if needed
  useEffect(() => {
    if (!me?._id) return;
    (async () => {
      try {
        const conv = await chatApi.getConversation(me._id, token);
        console.log(conv);
        const fixed = conv.map((m) => ({
          ...m,
          sender:
            typeof m.sender === "object" ? (m.sender as any)._id : m.sender,
          receiver:
            typeof m.receiver === "object"
              ? (m.receiver as any)._id
              : m.receiver,

          fileUrl: fixUrl(m.fileUrl),
        }));

        setMessages(fixed);

        if (!adminId) {
          let maybe: string | null = null;

          // Try to infer from existing messages
          const other = fixed.find(
            (m) => m.sender !== me._id || m.receiver !== me._id
          );
          if (other) {
            maybe = other.sender !== me._id ? other.sender : other.receiver;
          }

          // 🔑 Fallback to environment ADMIN_ID
          if (!maybe && process.env.NEXT_PUBLIC_ADMIN_ID) {
            maybe = process.env.NEXT_PUBLIC_ADMIN_ID;
          }

          if (maybe) {
            setAdminId(maybe);
            if (typeof window !== "undefined") {
              localStorage.setItem("adminId", maybe);
            }
          }
        }
      } catch (e) {
        console.error("getConversation error", e);
      }
    })();
  }, [me, adminId]);

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendText = async () => {
    if (!me?._id || !text.trim()) return;
    const receiverId = adminId || process.env.NEXT_PUBLIC_ADMIN_ID;
    if (!receiverId) return;

    try {
      const msg = await chatApi.sendMessage(
        { to: receiverId, message: text.trim(), type: "text" },
        { token, senderId: me._id }
      );

      // ✅ Add my own message to state
      setMessages((p) => [
        ...p,
        {
          ...msg,
          sender: me._id,
          receiver: receiverId,
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
    if (!adminId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const { fileUrl } = await chatApi.upload(form, token);

      const kind: "image" | "audio" = file.type.startsWith("audio")
        ? "audio"
        : "image";

      if (!me) {
        return;
      }
      const msg = await chatApi.sendMessage(
        { to: adminId, fileUrl, type: kind },
        { token, senderId: me._id }
      );

      // ✅ Add to state (skip dupes)
      setMessages((p) => {
        if (p.some((m) => m._id === msg._id)) return p;
        return [
          ...p,
          {
            ...msg,
            sender: me._id,
            receiver: adminId,
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

  return (
    <div className="h-[calc(100vh-2rem)] p-3">
      <div className="h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-white/10">
          <div className="font-semibold">(Admin) Ready to hear from you!!!</div>
          <div className="text-xs opacity-70">
            {me ? `Signed in as ${me.name}` : "Loading…"}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 h-0">
          {messages.map((m, idx) => (
            <ChatBubble
              key={`${m._id || "local"}-${m.createdAt || Date.now()}-${idx}`}
              msg={m}
              me={me?._id || ""}
            />
          ))}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="p-3 border-t border-white/10">
          {/* pending preview */}
          {preview && (
            <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/10 p-2 bg-white/5">
              {preview.kind === "image" ? (
                <img
                  src={preview.url}
                  alt="uploaded-file"
                  className="max-h-32 rounded-lg object-contain"
                />
              ) : (
                <audio src={preview.url} controls className="w-64" />
              )}
              <div className="ml-auto flex gap-2">
                <Button
                  onClick={() => setPreview(null)}
                  variant="ghost"
                  className="border border-white/10"
                >
                  Discard
                </Button>
                {preview.kind === "audio" ? (
                  <Button onClick={confirmSendVoice} disabled={uploading}>
                    {uploading ? "Sending…" : "Send"}
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      const resp = await fetch(preview.url);
                      const blob = await resp.blob();
                      const ext = blob.type.split("/")[1] || "png";
                      const file = new File([blob], `image.${ext}`, {
                        type: blob.type,
                      });
                      await handleChosenFile(file);
                    }}
                    disabled={uploading}
                  >
                    {uploading ? "Sending…" : "Send"}
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
                  setPreview({ url, kind: "image" });
                }
                e.currentTarget.value = "";
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
              placeholder="Type a message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              className="flex-1 bg-white/10 text-white placeholder:text-white/60 border-white/20"
            />
            <Button onClick={sendText} disabled={!text.trim()}>
              <Send size={16} className="mr-1" />
              Send
            </Button>
          </div>

          {showEmoji && (
            <div className="mt-2">
              <EmojiPicker onEmojiClick={(e) => setText((t) => t + e.emoji)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
