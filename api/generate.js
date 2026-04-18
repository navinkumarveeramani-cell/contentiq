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

  const strictPrompt = `${userMessage}

CRITICAL: Return ONLY a valid JSON object. No markdown. No code fences. No explanation. Start with { and end with }.`;

  const geminiRequest = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: strictPrompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.1,
    },
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError = "";

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiRequest),
      });

      const rawText = await geminiRes.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        lastError = `${model} returned non-JSON: ${rawText.slice(0, 200)}`;
        continue;
      }

      if (!geminiRes.ok) {
        lastError = data?.error?.message || `${model} error ${geminiRes.status}`;
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts
        ?.filter(p => p.text)
        ?.map(p => p.text)
        ?.join("") || "";

      if (!text) {
        lastError = `${model} returned empty response`;
        continue;
      }

      return new Response(
        JSON.stringify({ content: [{ type: "text", text }] }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );

    } catch (err) {
      lastError = `${model} failed: ${err.message}`;
      continue;
    }
  }

  return new Response(
    JSON.stringify({ error: "all_models_failed", message: lastError }),
    { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
  );
}
