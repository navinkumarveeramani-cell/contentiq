export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-app-password, x-usage-date, x-usage-count",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const password = req.headers.get("x-app-password") || "";
  const correct  = process.env.APP_PASSWORD || "";

  if (!correct) {
    return new Response(JSON.stringify({ error: "APP_PASSWORD not set in Vercel environment variables" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (password !== correct) {
    return new Response(JSON.stringify({ error: "incorrect_password" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const limit      = parseInt(process.env.DAILY_LIMIT || "20", 10);
  const usageDate  = req.headers.get("x-usage-date") || "";
  const usageCount = parseInt(req.headers.get("x-usage-count") || "0", 10);
  const todayDate  = new Date().toISOString().slice(0, 10);

  if (usageDate === todayDate && usageCount >= limit) {
    return new Response(JSON.stringify({
      error: "daily_limit_reached",
      message: `Daily limit of ${limit} analyses reached. Resets at midnight.`,
    }), { status: 429, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const body         = await req.json();
  const userMessage  = body.messages?.[0]?.content || "";
  const systemPrompt = body.system || "";

  const geminiBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    tools: [{ google_search: {} }],
    generationConfig: { maxOutputTokens: 8192, temperature: 0.3 },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "gemini_error", detail: data }), {
        status: response.status, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join("") || "";

    return new Response(
      JSON.stringify({ content: [{ type: "text", text }] }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "upstream_error", message: err.message }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
}
