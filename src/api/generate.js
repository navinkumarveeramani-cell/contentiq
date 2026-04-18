// api/anthropic.js
// Vercel Edge Function — secure proxy with password gate + daily rate limit
//
// Required Vercel Environment Variables:
//   ANTHROPIC_API_KEY  — your Anthropic secret key
//   APP_PASSWORD       — password users must enter to access the app
//   DAILY_LIMIT        — max analyses per user per day (e.g. "10")

export const config = { runtime: "edge" };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-app-password, x-usage-date, x-usage-count",
};

export default async function handler(req) {
  // ── Preflight ──────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Password check ─────────────────────────────────────────────────────
  const submittedPassword = req.headers.get("x-app-password") || "";
  const correctPassword   = process.env.APP_PASSWORD || "";

  if (!correctPassword) {
    return new Response(JSON.stringify({ error: "Server misconfigured: APP_PASSWORD not set." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (submittedPassword !== correctPassword) {
    return new Response(JSON.stringify({ error: "incorrect_password" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── Daily usage rate limit ─────────────────────────────────────────────
  // The client sends today's date and their usage count as headers.
  // The server validates: if count >= DAILY_LIMIT, reject the request.
  // (Client-side UI also enforces this — double protection.)
  const dailyLimit   = parseInt(process.env.DAILY_LIMIT || "10", 10);
  const usageDate    = req.headers.get("x-usage-date") || "";
  const usageCount   = parseInt(req.headers.get("x-usage-count") || "0", 10);
  const todayDate    = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Only enforce if the client's date matches today (prevents stale counts)
  if (usageDate === todayDate && usageCount >= dailyLimit) {
    return new Response(
      JSON.stringify({
        error: "daily_limit_reached",
        limit: dailyLimit,
        message: `You have reached the daily limit of ${dailyLimit} analyses. Resets at midnight.`,
      }),
      {
        status: 429,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }

  // ── Forward to Anthropic ───────────────────────────────────────────────
  const body = await req.text();

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "upstream_error", message: err.message }),
      {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
}
