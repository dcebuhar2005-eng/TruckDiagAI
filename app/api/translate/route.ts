import { NextResponse } from "next/server";

const LANGUAGE_NAMES: Record<string, string> = {
  hr: "Croatian",
  en: "English",
  de: "German",
  it: "Italian",
};

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

    const requestedLanguage =
      body.targetLanguage ||
      body.language ||
      body.target ||
      body.to ||
      "en";

    const targetLanguage =
      LANGUAGE_NAMES[requestedLanguage] || requestedLanguage;

    if (!text) {
      return NextResponse.json(
        { error: "Missing text for translation." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    let originalData: Record<string, unknown>;

    try {
      originalData =
        typeof text === "string"
          ? JSON.parse(text)
          : text;
    } catch {
      return NextResponse.json(
        { error: "Invalid translation data." },
        { status: 400 }
      );
    }

    const openAIResponse = await fetch(
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
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: `
You are TruckDiag AI translator.

Translate the provided truck diagnostic data into ${targetLanguage}.

Return ONLY a valid JSON object with exactly these keys:

vehicle_type
engine
euro_norm
mileage
fault_codes
measured_parameters
changed_parts
tests_done
symptoms
fault
solution

Important rules:
- Keep all keys exactly as written.
- Translate only human-readable text.
- Do not alter engine codes, fault codes, numbers, measurements, units, model names or technical identifiers.
- Keep empty fields as empty strings.
- Do not add markdown.
- Do not add explanations.
              `.trim(),
            },
            {
              role: "user",
              content: JSON.stringify(originalData),
            },
          ],
        }),
      }
    );

    const openAIData = await openAIResponse.json();

    if (!openAIResponse.ok) {
      console.error("OpenAI error:", openAIData);

      return NextResponse.json(
        {
          error:
            openAIData?.error?.message ||
            "OpenAI translation failed.",
        },
        { status: openAIResponse.status }
      );
    }

    const content =
      openAIData?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No translation was returned." },
        { status: 500 }
      );
    }

    let translation: Record<string, unknown>;

    try {
      translation = JSON.parse(content);
    } catch (error) {
      console.error("JSON parse error:", error);
      console.error("OpenAI content:", content);

      return NextResponse.json(
        { error: "Invalid translation response." },
        { status: 500 }
      );
    }

    const normalizedTranslation = {
      vehicle_type: String(translation.vehicle_type ?? ""),
      engine: String(translation.engine ?? ""),
      euro_norm: String(translation.euro_norm ?? ""),
      mileage: String(translation.mileage ?? ""),
      fault_codes: String(translation.fault_codes ?? ""),
      measured_parameters: String(
        translation.measured_parameters ?? ""
      ),
      changed_parts: String(translation.changed_parts ?? ""),
      tests_done: String(translation.tests_done ?? ""),
      symptoms: String(translation.symptoms ?? ""),
      fault: String(translation.fault ?? ""),
      solution: String(translation.solution ?? ""),
    };

    return NextResponse.json({
      translation: normalizedTranslation,
    });
  } catch (error) {
    console.error("Translate route error:", error);

    return NextResponse.json(
      { error: "Translate failed." },
      { status: 500 }
    );
  }
}