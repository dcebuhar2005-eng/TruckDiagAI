"use client";

import { useState } from "react";

const texts: any = {
  en: {
    title: "📄 Report Analysis",
    desc: "Upload a PDF, service report or photo of a document.",
    analyze: "🤖 Analyze Report",
    loading: "⏳ Analyzing report...",
    noResult: "No result.",
    error: "Error while analyzing report.",
  },
  hr: {
    title: "📄 Analiza izvještaja",
    desc: "Učitaj PDF, servisni izvještaj ili fotografiju dokumenta.",
    analyze: "🤖 Analiziraj izvještaj",
    loading: "⏳ Analiziram izvještaj...",
    noResult: "Nema rezultata.",
    error: "Greška kod analize izvještaja.",
  },
  de: {
    title: "📄 Berichtsanalyse",
    desc: "Lade ein PDF, einen Servicebericht oder ein Foto eines Dokuments hoch.",
    analyze: "🤖 Bericht analysieren",
    loading: "⏳ Bericht wird analysiert...",
    noResult: "Kein Ergebnis.",
    error: "Fehler bei der Berichtsanalyse.",
  },
  it: {
    title: "📄 Analisi del rapporto",
    desc: "Carica un PDF, un rapporto di servizio o una foto di un documento.",
    analyze: "🤖 Analizza rapporto",
    loading: "⏳ Analisi del rapporto...",
    noResult: "Nessun risultato.",
    error: "Errore durante l'analisi del rapporto.",
  },
};

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [language, setLanguage] = useState("en");

  const tx = texts[language];

  async function analyzeReport() {
    if (!file || loading) return;

    try {
      setLoading(true);
      setResult("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);

      const res = await fetch("/api/report-analysis", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || tx.error);
        return;
      }

      setResult(data.result || tx.noResult);
    } catch (error) {
      console.error(error);
      alert(tx.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>{tx.title}</h1>

      <p>{tx.desc}</p>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "15px",
          width: "220px",
        }}
      >
        <option value="en">🇬🇧 English</option>
        <option value="hr">🇭🇷 Hrvatski</option>
        <option value="de">🇩🇪 Deutsch</option>
        <option value="it">🇮🇹 Italiano</option>
      </select>

      <br />

      <input
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) setFile(e.target.files[0]);
        }}
      />

      <br />
      <br />

      <button
        onClick={analyzeReport}
        disabled={!file || loading}
        style={{
          background: loading ? "#777" : "#2563eb",
          color: "white",
          border: "none",
          padding: "12px 20px",
          borderRadius: "10px",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? tx.loading : tx.analyze}
      </button>

      {file && <p style={{ marginTop: "15px" }}>📎 {file.name}</p>}

      {result && (
        <div
          style={{
            marginTop: "25px",
            padding: "20px",
            borderRadius: "12px",
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.12)",
            whiteSpace: "pre-wrap",
            lineHeight: "1.7",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}