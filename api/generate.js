export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-app-password, x-usage-date, x-usage-count",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // ── Password check ──────────────────────────────────────────
  const password = req.headers.get("x-app-password") || "";
  const correct  = process.env.APP_PASSWORD || "";
  if (password !== correct) {
    return new Response(JSON.stringify({ error: "incorrect_password" }), {
      status: 401, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // ── Daily limit check ───────────────────────────────────────
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

  // ── Call Gemini ─────────────────────────────────────────────
  const body         = await req.json();
  const userMessage  = body.messages?.[0]?.content || "";
  const systemPrompt = body.system || "";

  const geminiRequest = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  };

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiRequest),
      }
    );

    const data = await geminiRes.json();

    // Surface Gemini errors clearly
    if (!geminiRes.ok) {
      return new Response(
        JSON.stringify({ error: "gemini_api_error", detail: data?.error?.message || JSON.stringify(data) }),
        { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
      );
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
      JSON.stringify({ error: "network_error", message: err.message }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
}
