import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "rate-fault",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content: `
You are TruckDiag AI.

Rate truck fault cases.

Return ONLY valid JSON:

{
  "score": 1,
  "premium": false,
  "reason": ""
}

Rules:
- score = difficulty from 1-10
- premium = true only for advanced diagnostics
- keep reason short
`,
            },
            {
              role: "user",
              content: JSON.stringify(body),
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const content =
      data?.choices?.[0]?.message?.content || "{}";

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Rate fault failed" },
      { status: 500 }
    );
  }
}