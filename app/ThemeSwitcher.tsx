"use client";

import { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";

    setTheme(saved);

    document.documentElement.setAttribute(
      "data-theme",
      saved
    );
  }, []);

  function toggleTheme() {
    const newTheme =
      theme === "dark" ? "light" : "dark";

    setTheme(newTheme);

    localStorage.setItem("theme", newTheme);

    document.documentElement.setAttribute(
      "data-theme",
      newTheme
    );
  }

 return (
  <button
    onClick={toggleTheme}
    title={theme === "dark" ? "Light mode" : "Dark mode"}
  style={{
  width: "40px",
  height: "40px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "22px",
}}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow =
        "0 8px 20px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow =
        "0 4px 12px rgba(0,0,0,0.15)";
    }}
  >
    {theme === "dark" ? "☀️" : "🌙"}
  </button>
);
}