import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "analyze-fault",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const input = body.input || "";
    const userType = body.userType || "mechanic";

    if (!input) {
      return NextResponse.json(
        { error: "Missing input" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    const systemPrompt =
      userType === "driver"
        ? `
You are TruckDiag AI.

Explain truck faults for drivers.

Focus on:
- safety
- can continue driving or not
- what to do immediately
- simple language

Answer in the same language as the user.
`
        : `
You are TruckDiag AI.

You are an expert truck diagnostic specialist.

Focus on:
- fault meaning
- possible causes
- wiring checks
- sensor checks
- expected values
- diagnostic procedure
- repair direction

Answer in the same language as the user.
`;

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
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `
Analyze this truck fault:

${input}

Return:

1. What it means
2. Severity
3. Can continue driving?
4. Possible causes
5. Diagnostic checks
6. Repair direction
7. Warning
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const content =
      data?.choices?.[0]?.message?.content ||
      "No response from AI.";

    return NextResponse.json({
      result: content,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Analyze fault failed" },
      { status: 500 }
    );
  }
}