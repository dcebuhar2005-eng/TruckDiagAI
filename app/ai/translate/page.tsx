"use client";

import { useState } from "react";

export default function TranslatePage() {
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function translateText() {
    setLoading(true);
    setResult("");

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        targetLanguage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setResult(data.error || "Translate failed");
    } else {
      setResult(data.result);
    }

    setLoading(false);
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>🌍 Translate</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste diagnostic text here..."
        style={{ width: "100%", height: 160, padding: 12 }}
      />

      <select
        value={targetLanguage}
        onChange={(e) => setTargetLanguage(e.target.value)}
        style={{ marginTop: 12, padding: 10 }}
      >
        <option>English</option>
        <option>Croatian</option>
        <option>German</option>
        <option>Italian</option>
      </select>

      <button
        onClick={translateText}
        disabled={loading || !text.trim()}
        style={{ marginLeft: 12, padding: 10 }}
      >
        {loading ? "Translating..." : "Translate"}
      </button>

      {result && (
        <div style={{ marginTop: 24, whiteSpace: "pre-wrap" }}>
          {result}
        </div>
      )}
    </main>
  );
}