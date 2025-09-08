// export type Transaction = {
//   _id: string;
//   user: string;
//   type: "DEPOSIT" | "WITHDRAWAL";
//   amount: number;
//   method?: "wechat" | "alipay" | "bank";
//   status: "PENDNG" | "APPROVED" | "REJECTED";
//   createdAt: string;
//   qrCode?: string;
//   bankName?: string;
//   accountNumber?: string;
// };

export type AttachmentKind = "image" | "audio" | null;
export type MessageType = "text" | "media";

export interface User {
  _id: string;
  name: string;
  email: string;
  photo?: string;
  createdAt?: string;
  avatar?: string;
  role?: string;
  referrals?: string;
}
// types/index.ts
export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  photo?: string;
  createdAt?: string;
  role?: string;
  unread?: number;
  referrals?: string;
}

export interface ChatMessage {
  _id: string;
  sender: string; // userId
  receiver: string; // userId
  message?: string;
  fileUrl?: string;
  type: "text" | "image" | "audio" | "emoji" | "file";
  createdAt: string;
}
