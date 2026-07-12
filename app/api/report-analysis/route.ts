import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const languageNames: Record<string, string> = {
  hr: "Croatian",
  en: "English",
  de: "German",
  it: "Italian",
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = String(formData.get("language") || "en");

    const answerLanguage = languageNames[language] || "English";

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const content: any[] = [
      {
        type: "input_text",
        text: `
Analyze this service document, PDF, diagnostic report or image.

Respond ONLY in this language: ${answerLanguage}.

Return the answer in this format, translated naturally to ${answerLanguage}:

🚛 Vehicle:
- Brand/Model:
- Engine:
- Mileage:
- Emission standard:

⚠️ Reported problem:
-

🧾 Fault codes:
-

🛠️ Work performed:
-

📦 Replaced parts:
-

🔍 Possible cause:
-

🔍 Additional checks:
-

👨‍🔧 Explanation for mechanic:
-

🚛 Explanation for driver:
-

If some information does not exist in the document, write "not specified" translated to ${answerLanguage}.
`,
      },
    ];

    if (file.type.startsWith("image/")) {
      const base64 = buffer.toString("base64");

      content.push({
        type: "input_image",
        image_url: `data:${file.type};base64,${base64}`,
      });
    } else {
      const uploadedFile = await openai.files.create({
        file: new File([buffer], file.name, {
          type: file.type,
        }),
        purpose: "assistants",
      });

      content.push({
        type: "input_file",
        file_id: uploadedFile.id,
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content,
        },
      ],
    });

    return NextResponse.json({
      result: response.output_text,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "Error while analyzing report.",
      },
      {
        status: 500,
      }
    );
  }
}