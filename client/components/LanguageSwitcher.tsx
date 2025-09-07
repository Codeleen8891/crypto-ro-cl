"use client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex justify-end p-2">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as "en" | "zh")}
        className="bg-white/5 backdrop-blur border border-white/10 rounded-xl px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <option value="en" className="bg-gray-900 text-white">
          English
        </option>
        <option value="zh" className="bg-gray-900 text-white">
          中文
        </option>
      </select>
    </div>
  );
}
