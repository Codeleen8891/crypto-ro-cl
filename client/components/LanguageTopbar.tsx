"use client";
import { useState } from "react";

export default function LanguageTopbar() {
  const [lang, setLang] = useState("en");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value);

    // For now, just log it. Later you can plug in i18n or API.
    console.log("Language selected:", e.target.value);
  };

  return (
    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <select
        value={lang}
        onChange={handleChange}
        className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
      >
        <option value="en">English</option>
        <option value="zh">中文 (Chinese)</option>
      </select>
    </div>
  );
}
