// Node.js runtime — 60 second timeout (vs 10s on Edge)
export const config = { maxDuration: 60 };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-app-password, x-usage-date, x-usage-count",
};

const ANALYSIS_PROMPT = `You are an expert SEO, AEO and LLM content strategist for 2026. Analyse the content and return ONLY a JSON object — no markdown, no backticks, starting with { and ending with }.

Return this exact structure:
{
  "overallScore": <0-100>,
  "contentSummary": "<1 sentence>",
  "strategiesUsed": ["<insight 1>","<insight 2>","<insight 3>"],
  "seo": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2 sentences>",
    "eeat": {"experience":<0-100>,"expertise":<0-100>,"authoritativeness":<0-100>,"trustworthiness":<0-100>,"notes":"<detail>"},
    "keywords": {"primary":["<k1>","<k2>","<k3>"],"missing":["<k1>","<k2>","<k3>"],"semanticGaps":["<g1>","<g2>"],"density":"<X%>"},
    "technicalSignals": [{"type":"ok|warning|error","signal":"<n>","detail":"<d>"}],
    "issues": [{"type":"error|warning|suggestion","title":"<t>","detail":"<d>"}],
    "quickWins": ["<w1>","<w2>","<w3>"]
  },
  "aeo": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2 sentences>",
    "answerFirstScore": <0-100>, "featuredSnippetReadiness": <0-100>, "voiceSearchScore": <0-100>,
    "zeroClickOptimization": <0-100>, "schemaReadiness": <0-100>, "entityClarity": <0-100>,
    "questionsCovered": ["<Q1>","<Q2>"], "questionsMissing": ["<Q1>","<Q2>"],
    "answerFirstAudit": {"hasDirectOpeningAnswer":<true|false>,"openingTokens":"<first 50 words>","verdict":"<assessment>"},
    "platforms": {
      "googleAIOverviews":{"score":<0-100>,"note":"<1 sentence>"},
      "chatGPTSearch":{"score":<0-100>,"note":"<1 sentence>"},
      "perplexity":{"score":<0-100>,"note":"<1 sentence>"},
      "bingCopilot":{"score":<0-100>,"note":"<1 sentence>"}
    },
    "issues": [{"type":"error|warning|suggestion","title":"<t>","detail":"<d>"}],
    "quickWins": ["<w1>","<w2>","<w3>"]
  },
  "llmCitation": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2 sentences>",
    "ragSurvivability": {"score":<0-100>,"chunkingRisk":"low|medium|high","embeddingClarity":<0-100>,"semanticCoherence":<0-100>,"note":"<detail>"},
    "tokenEfficiency": {"score":<0-100>,"bloatRisk":"low|medium|high","frontLoadScore":<0-100>,"note":"<detail>"},
    "citabilityFactors": {"authoritySignals":<0-100>,"factualDensity":<0-100>,"structureClarity":<0-100>,"uniqueInsights":<0-100>,"dataAndStatistics":<0-100>,"entityConsistency":<0-100>},
    "suggestedCitableStatements": [{"statement":"<s>","why":"<w>"},{"statement":"<s>","why":"<w>"}],
    "agenticDiscoverability": {"score":<0-100>,"cleanSemanticStructure":<true|false>,"machineReadableSignals":<true|false>,"note":"<detail>"},
    "issues": [{"type":"error|warning|suggestion","title":"<t>","detail":"<d>"}],
    "quickWins": ["<w1>","<w2>","<w3>"]
  },
  "rewriteSuggestion": {
    "original": "<first 2 sentences verbatim>",
    "rewritten": "<optimised 3-5 sentence opening>",
    "whatsImproved": ["<i1>","<i2>","<i3>"]
  },
  "priorityActions": [
    {"priority":1,"category":"SEO|AEO|LLM","action":"<action>","impact":"high|medium|low","effort":"high|medium|low"},
    {"priority":2,"category":"SEO|AEO|LLM","action":"<action>","impact":"high|medium|low","effort":"high|medium|low"},
    {"priority":3,"category":"SEO|AEO|LLM","action":"<action>","impact":"high|medium|low","effort":"high|medium|low"},
    {"priority":4,"category":"SEO|AEO|LLM","action":"<action>","impact":"high|medium|low","effort":"high|medium|low"},
    {"priority":5,"category":"SEO|AEO|LLM","action":"<action>","impact":"high|medium|low","effort":"high|medium|low"}
  ]
}`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-app-password, x-usage-date, x-usage-count");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  // Password check
  const password = req.headers["x-app-password"] || "";
  const correct  = process.env.APP_PASSWORD || "";
  if (password !== correct) {
    res.status(401).json({ error: "incorrect_password" }); return;
  }

  // Daily limit
  const limit      = parseInt(process.env.DAILY_LIMIT || "20", 10);
  const usageDate  = req.headers["x-usage-date"] || "";
  const usageCount = parseInt(req.headers["x-usage-count"] || "0", 10);
  const todayDate  = new Date().toISOString().slice(0, 10);
  if (usageDate === todayDate && usageCount >= limit) {
    res.status(429).json({ error: "daily_limit_reached", message: `Daily limit of ${limit} reached. Resets at midnight.` });
    return;
  }

  const body        = req.body;
  const userContent = body?.messages?.[0]?.content || "";

  const geminiRequest = {
    contents: [{
      role: "user",
      parts: [{ text: `${ANALYSIS_PROMPT}\n\nContent to analyse:\n\n${userContent}\n\nReturn only the JSON object, starting with { and ending with }:` }]
    }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.1,
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

    const rawText = await geminiRes.text();

    let data;
    try { data = JSON.parse(rawText); }
    catch {
      res.status(502).json({ error: "parse_error", message: rawText.slice(0, 200) });
      return;
    }

    if (!geminiRes.ok) {
      res.status(502).json({ error: "gemini_error", message: data?.error?.message });
      return;
    }

    let text = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)?.map(p => p.text)?.join("") || "";

    // Strip markdown fences
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    res.status(200).json({ content: [{ type: "text", text }] });

  } catch (err) {
    res.status(502).json({ error: "network_error", message: err.message });
  }
}
