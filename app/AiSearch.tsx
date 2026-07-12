"use client";

import { useState } from "react";
import Link from "next/link";

export default function AiSearch({ data }: any) {
  const [question, setQuestion] = useState("");

  const words = question
    .toLowerCase()
    .split(" ")
    .filter((word) => word.length > 2);

  const results = data
    .map((item: any) => {
      const text = `
        ${item.brand}
        ${item.model}
        ${item.engine}
        ${item.symptoms}
        ${item.fault_codes}
        ${item.measured_parameters}
        ${item.changed_parts}
        ${item.tests_done}
        ${item.final_fault}
        ${item.solution}
      `.toLowerCase();

      const score = words.filter((word) => text.includes(word)).length;

      return { ...item, score };
    })
    .filter((item: any) => item.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  return (
    <div
      style={{
        border: "2px solid #2563eb",
        padding: "15px",
        borderRadius: "10px",
        marginBottom: "20px",
      }}
    >
      <h2>🤖 AI pomoćnik</h2>

      <textarea
        placeholder="Opiši problem... npr. Scania R450 rail tlak pada pod gasom"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "18px",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      />

      {question.length > 2 && results.length === 0 && (
        <p>Nema sličnih slučajeva u bazi.</p>
      )}

      {results.length > 0 && (
        <div>
          <h3>Najsličniji slučajevi:</h3>

          {results.map((item: any) => (
            <div
              key={item.id}
              style={{
                border: "1px solid gray",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              <h3>
                {item.brand} {item.model}
              </h3>

              <p><b>Motor:</b> {item.engine}</p>
              <p><b>Simptomi:</b> {item.symptoms}</p>
              <p><b>Kvar:</b> {item.final_fault}</p>
              <p><b>Rješenje:</b> {item.solution}</p>

              <Link href={`/edit/${item.id}`}>
                <button>✏️ Otvori slučaj</button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}