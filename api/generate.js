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

  const geminiRequest = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.2,
      responseMimeType: "application/json",  // Force pure JSON output
    },
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequest),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const errMsg = data?.error?.message || JSON.stringify(data);
      return new Response(
        JSON.stringify({ error: "gemini_error", message: errMsg }),
        { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join("") || "";

    // Return in format App.jsx expects
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
