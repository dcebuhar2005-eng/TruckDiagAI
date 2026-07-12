"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState("hr");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLanguage(localStorage.getItem("language") || "hr");
  }, []);

  function changeLanguage(lang: string) {
    localStorage.setItem("language", lang);
    setLanguage(lang);
    setOpen(false);
    window.location.reload();
  }

  const languages = [
    { key: "hr", label: "HR" },
    { key: "en", label: "EN" },
    { key: "de", label: "DE" },
    { key: "it", label: "IT" },
  ];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "40px",
          height: "40px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "22px",
        }}
      >
        🌍
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "48px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "8px",
            zIndex: 9999,
            display: "grid",
            gap: "6px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.key}
              onClick={() => changeLanguage(lang.key)}
              style={{
                width: "52px",
                height: "38px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background:
                  language === lang.key ? "#2563eb" : "transparent",
                color: language === lang.key ? "white" : "var(--text)",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}