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
    "issues": [{"type":"error|warning|suggestion","title":"<t>",
