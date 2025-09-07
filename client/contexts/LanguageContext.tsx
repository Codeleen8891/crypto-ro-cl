"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "zh";

const translations = {
  en: {
    welcomeTitle: "Welcome to Crypto Royal!",
    welcomeMessage:
      "Hey {name}, we are thrilled to have you on board! Our platform is designed to help you achieve your financial goals through smart investing and expert insights. Get started by exploring our resources, learning about our investment options, and connecting with our community. We're here to support you every step of the way. Happy investing!",
    shares: "Shares",
    referrals: "Referrals",
    latestMessages: "Latest Messages from Admin",
  },
  zh: {
    welcomeTitle: "欢迎来到 Crypto Royal!",
    welcomeMessage:
      "你好 {name}, 我们很高兴您能加入我们！我们的平台旨在通过智能投资和专家见解帮助您实现财务目标。您可以先探索我们的资源，了解投资选项，并与社区互动。我们会在每一步为您提供支持。祝您投资顺利！",
    shares: "分享次数",
    referrals: "邀请好友",
    latestMessages: "管理员的最新消息",
  },
};

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof translations)["en"];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const value: LanguageContextType = {
    lang,
    setLang,
    t: translations[lang],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
};
