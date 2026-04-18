export const config = { runtime: "edge" };

export default async function handler(req) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const geminiRequest = {
    contents: [{ role: "user", parts: [{ text: 'Reply with this exact JSON only: {"status":"ok","message":"Gemini is working"}' }] }],
    generationConfig: { maxOutputTokens: 100, temperature: 0 },
  };

  try {
    const models = ["gemini-2.5-flash-preview-04-17", "gemini-2.5-flash", "gemini-1.5-flash"];
    const results = {};

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiRequest),
      });
      const text = await r.text();
      results[model] = { status: r.status, response: text.slice(0, 500) };
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
