// lib/api.ts
import type { User, ChatMessage } from "../types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ----------------- helpers -----------------
type RequestOptions = {
  method?: string;
  body?: any;
  token?: string;
};

function getLocalToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

function getIds() {
  if (typeof window === "undefined") {
    return { adminId: "", userId: "" };
  }
  return {
    adminId: localStorage.getItem("adminId") || "",
    userId: localStorage.getItem("userId") || "",
  };
}

async function parseMaybeJSON<T>(res: Response): Promise<T | string | null> {
  // 204 No Content or truly empty body
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as string;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  const isForm = options.body instanceof FormData;
  const headers: Record<string, string> = isForm
    ? {}
    : { "Content-Type": "application/json" };

  const token = options.token || getLocalToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body
      ? isForm
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
  });

  if (!res.ok) {
    // try to surface backend message
    let msg = `Request failed: ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.message) msg = errJson.message;
      else if (typeof errJson === "string") msg = errJson;
    } catch {
      // fallback to text
      try {
        const errText = await res.text();
        if (errText) msg = errText;
      } catch {
        /* noop */
      }
    }
    throw new Error(msg);
  }

  const data = await parseMaybeJSON<T>(res);
  return data as T;
}

// ----------------- USER API -----------------
export const userApi = {
  me: (token?: string) =>
    apiFetch<User>("/users/profile", { method: "GET", token }),

  getById: (id: string, token?: string) =>
    apiFetch<User>(`/users/${id}`, { method: "GET", token }),

  search: (query: string, token?: string) =>
    apiFetch<User[]>(`/users/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
      token,
    }),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    apiFetch<{ success: boolean }>("/users/password/change", {
      method: "POST",
      body: data,
    }),

  requestPasswordOtp: () =>
    apiFetch<{ success: boolean }>("/users/password/request-otp", {
      method: "POST",
    }),

  resetPasswordWithOtp: (data: { otp: string; newPassword: string }) =>
    apiFetch<{ success: boolean }>("/users/password/reset-otp", {
      method: "POST",
      body: data,
    }),

  updateProfile: (data: Partial<User> | FormData, token?: string) =>
    apiFetch<User>("/users/profile", {
      method: "PUT",
      body: data,
      token,
    }),

  stats: (token?: string) =>
    apiFetch<{ referrals: number; shares: number }>("/users/me/stats", {
      method: "GET",
      token,
    }),

  unread: (token?: string) =>
    apiFetch<{ count: number }>("/users/messages/unread", {
      method: "GET",
      token,
    }),
};

// ----------------- CHAT API -----------------
/**
 * Your backend ChatMessage uses:
 *  - sender: ObjectId (User)
 *  - receiver: ObjectId (User)
 *  - message: string
 *  - fileUrl: string
 *  - type: "text" | "image" | "audio" | "emoji"
 *  - createdAt: string (timestamps)
 */
export const chatApi = {
  // Full conversation between a user and the ADMIN (server-side joins ADMIN_ID)
  getConversation: (userId: string, token?: string) =>
    apiFetch<ChatMessage[]>(`/chat/${userId}`, { method: "GET", token }),

  /**
   * Send message. Prefer passing senderId explicitly.
   * If omitted, it will try localStorage.adminId, then localStorage.userId.
   */
  sendMessage: (
    data: {
      to: string; // <- make sure this is not undefined/null
      message?: string;
      fileUrl?: string;
      type?: "text" | "image" | "audio" | "emoji";
    },
    options?: { token?: string; senderId?: string }
  ) => {
    const { adminId, userId } = getIds();
    const sender = options?.senderId || adminId || userId || "";

    console.log("📤 Sending message:", {
      sender,
      receiver: data.to,
      message: data.message,
      fileUrl: data.fileUrl,
      type: data.type,
    });

    if (!data.to) {
      throw new Error("Receiver ID (data.to) is missing!");
    }

    return apiFetch<ChatMessage>("/chat/send", {
      method: "POST",
      body: {
        sender,
        receiver: data.to,
        message: data.message || "",
        fileUrl: data.fileUrl || "",
        type: data.type || "text",
      },
      token: options?.token,
    });
  },

  upload: async (form: FormData, token?: string) => {
    const resp = await apiFetch<any>("/chat/upload", {
      method: "POST",
      body: form,
      token,
    });
    // normalize both shapes {fileUrl} or {url}
    const fileUrl: string = resp?.fileUrl || resp?.url || "";
    if (!fileUrl) throw new Error("Upload failed: missing fileUrl");
    return { fileUrl };
  },

  removeUser: (userId: string, token?: string) =>
    apiFetch<{ success: boolean }>(`/chat/remove/${userId}`, {
      method: "DELETE",
      token,
    }),

  /**
   * Lightweight "conversations" for your dashboard’s list.
   * Since you don't have a dedicated endpoint, we derive it from /chat/:userId
   * using the current userId in localStorage.
   */
  getConversations: async (token?: string) => {
    const { userId } = getIds();
    if (!userId) return [];
    const msgs = await apiFetch<ChatMessage[]>(`/chat/${userId}`, {
      method: "GET",
      token,
    });
    if (!Array.isArray(msgs) || msgs.length === 0) return [];

    const last = msgs[msgs.length - 1];
    const preview =
      last?.message ||
      (last?.type === "image"
        ? "[Image]"
        : last?.type === "audio"
        ? "[Audio]"
        : last?.type === "emoji"
        ? "[Emoji]"
        : "");

    return [
      {
        _id: last?._id || `conv-${userId}`,
        userId, // clicking can still route to /chat/:userId
        lastMessage: preview || "",
        updatedAt: last?.createdAt || new Date().toISOString(),
      },
    ];
  },
};

// ----------------- AUTH API -----------------
export const authApi = {
  register: (formData: FormData) =>
    apiFetch<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: formData,
    }),

  verifyOtp: (data: { email: string; otp: string }) =>
    apiFetch<{ success: boolean; token?: string; user?: User }>(
      "/auth/verify-otp",
      {
        method: "POST",
        body: data,
      }
    ),

  /**
   * Normalize any backend login shape to { token, user }
   * Your server sometimes sends flat fields; sometimes { user, token }.
   */
  login: async (data: { email: string; password: string }) => {
    const raw = await apiFetch<any>("/auth/login", {
      method: "POST",
      body: data,
    });

    const token: string = raw?.token || raw?.accessToken || "";
    const user: User = {
      _id: raw?._id || raw?.user?._id || "",
      name: raw?.name || raw?.user?.name || "",
      email: raw?.email || raw?.user?.email || "",
      photo: raw?.photo || raw?.user?.photo || undefined,
      role: raw?.role || raw?.user?.role || undefined,
      createdAt: raw?.createdAt || raw?.user?.createdAt || undefined,
    };

    if (!token || !user._id) {
      throw new Error("Invalid login response from server");
    }

    return { token, user };
  },

  forgotPassword: (data: { email: string }) =>
    apiFetch<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: data,
    }),

  resetPassword: (data: { newPassword: string }, token?: string) =>
    apiFetch<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: data,
      token,
    }),

  resendOtp: (data: { email: string }) =>
    apiFetch<{ success: boolean; message: string }>("/auth/resend-otp", {
      method: "POST",
      body: data,
    }),
};

// ----------------- ADMIN API -----------------
export const adminApi = {
  // matches your controller: { totalUsers, referrals }
  stats: (token?: string) =>
    apiFetch<{ totalUsers: number; referrals: number }>("/admin/stats", {
      method: "GET",
      token,
    }),

  // returns users + { unread } in your controller
  usersList: (token?: string) =>
    apiFetch<Array<User & { unread?: number }>>("/admin/users/list", {
      method: "GET",
      token,
    }),

  usersAll: (token?: string) =>
    apiFetch<User[]>("/admin/users/all", { method: "GET", token }),
};
