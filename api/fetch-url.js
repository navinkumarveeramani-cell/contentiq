// api/fetch-url.js — fetches a URL and extracts clean text content
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-password");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  // Password check
  const password = req.headers["x-app-password"] || "";
  const correct  = process.env.APP_PASSWORD || "";
  if (password !== correct) {
    res.status(401).json({ error: "incorrect_password" }); return;
  }

  const { url } = req.body || {};
  if (!url) { res.status(400).json({ error: "No URL provided" }); return; }

  // Validate URL
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Invalid protocol");
  } catch {
    res.status(400).json({ error: "Invalid URL — please include https://" }); return;
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ContentIQ/3.0; +https://contentiq-one.vercel.app)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      res.status(502).json({ error: `Page returned ${response.status} — URL may be blocked or private` });
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      res.status(400).json({ error: "URL does not point to a readable web page" });
      return;
    }

    const html = await response.text();

    // Extract clean text from HTML
    const text = html
      // Remove scripts, styles, nav, footer, header, aside
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      // Keep block elements as line breaks
      .replace(/<\/(p|div|h[1-6]|li|br|section|article)>/gi, "\n")
      // Strip remaining tags
      .replace(/<[^>]+>/g, "")
      // Decode HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      // Clean up whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Limit to ~3000 words to avoid token overflow
    const words   = text.split(/\s+/);
    const trimmed = words.slice(0, 3000).join(" ");
    const wasTrimmed = words.length > 3000;

    res.status(200).json({
      text: trimmed,
      wordCount: words.length,
      wasTrimmed,
      title: (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || "",
      url: parsedUrl.toString(),
    });

  } catch (err) {
    res.status(502).json({
      error: "Could not fetch page — " + err.message,
    });
  }
}
