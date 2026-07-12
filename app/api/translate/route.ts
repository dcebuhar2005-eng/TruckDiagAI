import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "translate",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const text =
  body.text ||
  body.input ||
  body.content ||
  body.message ||
  body.value ||
  body.originalText ||
  "";

const targetLanguage =
  body.targetLanguage ||
  body.language ||
  body.target ||
  body.to ||
  "English";

    if (!text) {
      return NextResponse.json(
        { error: "Missing text" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.1,
          messages: [
            
           {
  role: "system",
  content:
    "You are TruckDiag AI translator. Translate truck diagnostic text accurately. Return ONLY valid JSON. Keep exactly these keys: vehicle_type, engine, euro_norm, mileage, fault_codes, measured_parameters, changed_parts, tests_done, symptoms, fault, solution. Return no explanations and no markdown.",
},
{
  role: "user",
  content: `Translate this JSON to ${targetLanguage}:\n\n${text}`,
},
          ],
        }),
      }
    );

    const data = await response.json();

    const translatedText =
      data?.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      translatedText,
      result: translatedText,
      translation: translatedText,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Translate failed" },
      { status: 500 }
    );
  }
}