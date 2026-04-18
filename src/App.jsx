// src/App.jsx — ContentIQ v3 with Password Gate + Daily Usage Limiter
//
// Set VITE_DAILY_LIMIT=10 in your Vercel env to control the daily cap shown in UI.
// The actual enforcement happens server-side in api/generate.js.

import { useState, useEffect } from "react";

// ─── Config ────────────────────────────────────────────────────────────────
const DAILY_LIMIT   = parseInt(import.meta.env.VITE_DAILY_LIMIT || "10", 10);
const STORAGE_KEY   = "ciq_usage";   // tracks { date, count } in localStorage
const AUTH_KEY      = "ciq_authed";  // stores session auth in localStorage

// ─── System Prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a world-class SEO, AEO, GEO (Generative Engine Optimization), and LLM visibility strategist. Before analysing any content, use your web_search tool to find the most current SEO, AEO, GEO, and LLM citation best practices and algorithm updates from the last 30 days. Apply those fresh insights to your analysis so your recommendations always reflect the latest strategies.

After searching, analyse the provided content and return ONLY a valid JSON object (no markdown, no backticks, no explanation outside the JSON) with this exact structure:

{
  "overallScore": <0-100>,
  "contentSummary": "<1 sentence: what this content is about>",
  "strategiesUsed": ["<live strategy/source found 1>", "<live strategy/source 2>", "<live strategy/source 3>"],

  "seo": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2-sentence overview>",
    "eeat": { "experience": <0-100>, "expertise": <0-100>, "authoritativeness": <0-100>, "trustworthiness": <0-100>, "notes": "<detail>" },
    "keywords": { "primary": ["<kw1>","<kw2>","<kw3>"], "missing": ["<kw1>","<kw2>","<kw3>"], "semanticGaps": ["<gap1>","<gap2>"], "density": "<X%>" },
    "technicalSignals": [{ "type": "error|warning|ok", "signal": "<n>", "detail": "<d>" }],
    "issues": [{ "type": "error|warning|suggestion", "title": "<t>", "detail": "<d>" }],
    "quickWins": ["<w1>","<w2>","<w3>"]
  },

  "aeo": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2-sentence overview>",
    "answerFirstScore": <0-100>, "featuredSnippetReadiness": <0-100>, "voiceSearchScore": <0-100>,
    "zeroClickOptimization": <0-100>, "schemaReadiness": <0-100>, "entityClarity": <0-100>,
    "questionsCovered": ["<Q1>","<Q2>","<Q3>"], "questionsMissing": ["<Q1>","<Q2>","<Q3>"],
    "answerFirstAudit": { "hasDirectOpeningAnswer": <true|false>, "openingTokens": "<first ~80 words>", "verdict": "<assessment>" },
    "platforms": {
      "googleAIOverviews": { "score": <0-100>, "note": "<1 sentence>" },
      "chatGPTSearch": { "score": <0-100>, "note": "<1 sentence>" },
      "perplexity": { "score": <0-100>, "note": "<1 sentence>" },
      "bingCopilot": { "score": <0-100>, "note": "<1 sentence>" }
    },
    "issues": [{ "type": "error|warning|suggestion", "title": "<t>", "detail": "<d>" }],
    "quickWins": ["<w1>","<w2>","<w3>"]
  },

  "llmCitation": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2-sentence overview>",
    "ragSurvivability": { "score": <0-100>, "chunkingRisk": "low|medium|high", "embeddingClarity": <0-100>, "semanticCoherence": <0-100>, "note": "<detail>" },
    "tokenEfficiency": { "score": <0-100>, "bloatRisk": "low|medium|high", "frontLoadScore": <0-100>, "note": "<detail>" },
    "citabilityFactors": { "authoritySignals": <0-100>, "factualDensity": <0-100>, "structureClarity": <0-100>, "uniqueInsights": <0-100>, "dataAndStatistics": <0-100>, "entityConsistency": <0-100> },
    "suggestedCitableStatements": [{ "statement": "<statement>", "why": "<why LLM would cite>" }],
    "agenticDiscoverability": { "score": <0-100>, "cleanSemanticStructure": <true|false>, "machineReadableSignals": <true|false>, "note": "<detail>" },
    "issues": [{ "type": "error|warning|suggestion", "title": "<t>", "detail": "<d>" }],
    "quickWins": ["<w1>","<w2>","<w3>"]
  },

  "rewriteSuggestion": {
    "original": "<first 2 sentences verbatim>",
    "rewritten": "<3-5 sentence optimised opening: answer-first, E-E-A-T, snippet-ready, LLM-citable>",
    "whatsImproved": ["<improvement 1>","<improvement 2>","<improvement 3>"]
  },

  "priorityActions": [
    { "priority": 1, "category": "SEO|AEO|LLM", "action": "<action>", "impact": "high|medium|low", "effort": "high|medium|low" },
    { "priority": 2, "category": "SEO|AEO|LLM", "action": "<action>", "impact": "high|medium|low", "effort": "high|medium|low" },
    { "priority": 3, "category": "SEO|AEO|LLM", "action": "<action>", "impact": "high|medium|low", "effort": "high|medium|low" },
    { "priority": 4, "category": "SEO|AEO|LLM", "action": "<action>", "impact": "high|medium|low", "effort": "high|medium|low" },
    { "priority": 5, "category": "SEO|AEO|LLM", "action": "<action>", "impact": "high|medium|low", "effort": "high|medium|low" }
  ]
}`;

// ─── Usage helpers ──────────────────────────────────────────────────────────
function getUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), count: 0 };
    const parsed = JSON.parse(raw);
    if (parsed.date !== today()) return { date: today(), count: 0 }; // reset daily
    return parsed;
  } catch { return { date: today(), count: 0 }; }
}

function incrementUsage() {
  const usage = getUsage();
  const next = { date: today(), count: usage.count + 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Shared UI components ───────────────────────────────────────────────────
const scoreColor = s => s >= 75 ? "#2ED573" : s >= 50 ? "#FFA502" : "#FF4757";
const typeColors = { error:"#FF4757", warning:"#FFA502", suggestion:"#2ED573", ok:"#2ED573" };
const typeIcons  = { error:"✕", warning:"▲", suggestion:"✦", ok:"✓" };

function ScoreRing({ score, size=80, stroke=7, color }) {
  const col = color || scoreColor(score);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#111128" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function MiniBar({ label, value }) {
  const col = scoreColor(value || 0);
  return (
    <div style={{ marginBottom:9 }}>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#666", marginBottom:3 }}>
        <span>{label}</span><span style={{ color:col, fontFamily:"monospace", fontWeight:700 }}>{value||0}</span>
      </div>
      <div style={{ background:"#111128", borderRadius:4, height:4, overflow:"hidden" }}>
        <div style={{ width:`${value||0}%`, height:"100%", background:`linear-gradient(90deg,${col}77,${col})`, borderRadius:4, transition:"width 1.2s ease" }} />
      </div>
    </div>
  );
}

function Badge({ label, type="neutral" }) {
  const bg = { neutral:"#1a1a2e", error:"#FF475720", warning:"#FFA50220", ok:"#2ED57320", blue:"#7C83FD20" };
  const fg = { neutral:"#555", error:"#FF4757", warning:"#FFA502", ok:"#2ED573", blue:"#7C83FD" };
  return <span style={{ background:bg[type]||bg.neutral, color:fg[type]||fg.neutral, padding:"2px 9px", borderRadius:20, fontSize:10, fontFamily:"monospace", fontWeight:700 }}>{label}</span>;
}

function Panel({ title, icon, children, open:def=true }) {
  const [open, setOpen] = useState(def);
  return (
    <div style={{ background:"#080818", border:"1px solid #131326", borderRadius:14, marginBottom:10, overflow:"hidden" }}>
      <div onClick={() => setOpen(o=>!o)} style={{ padding:"13px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:"#0b0b1c" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span>{icon}</span>
          <span style={{ fontWeight:700, color:"#ccc", fontSize:13 }}>{title}</span>
        </div>
        <span style={{ color:"#2a2a44", fontSize:11 }}>{open?"▲":"▼"}</span>
      </div>
      {open && <div style={{ padding:"14px 18px" }}>{children}</div>}
    </div>
  );
}

function ScoreBlock({ label, score, grade, icon }) {
  const col = scoreColor(score||0);
  return (
    <div style={{ background:"#0a0a1a", border:`1px solid ${col}20`, borderRadius:11, padding:"13px 16px", flex:1, minWidth:110, display:"flex", alignItems:"center", gap:11, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-6, right:-4, fontSize:48, fontWeight:900, color:col, opacity:0.05 }}>{grade}</div>
      <div style={{ position:"relative" }}>
        <ScoreRing score={score||0} size={52} stroke={5} color={col} />
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", transform:"rotate(90deg)" }}>
          <span style={{ fontSize:11, fontWeight:900, color:col, fontFamily:"monospace" }}>{score}</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize:9, color:"#444", textTransform:"uppercase", letterSpacing:1.5, fontFamily:"monospace" }}>{icon} {label}</div>
        <div style={{ fontSize:20, fontWeight:900, color:col, fontFamily:"monospace", lineHeight:1 }}>{grade}</div>
      </div>
    </div>
  );
}

// ─── Password Gate ──────────────────────────────────────────────────────────
function PasswordGate({ onSuccess }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow]   = useState(false);

  const attempt = async () => {
    if (!pw.trim()) return;
    setLoading(true); setError("");
    try {
      // Test the password against the proxy with a minimal payload
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": pw,
          "x-usage-date": today(),
          "x-usage-count": "0",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [{ role:"user", content:"hi" }],
        }),
      });
      const data = await res.json();
      if (res.status === 401 || data.error === "incorrect_password") {
        setError("Incorrect password. Please try again.");
      } else {
        // Password accepted — persist session
        localStorage.setItem(AUTH_KEY, btoa(pw));
        onSuccess(pw);
      }
    } catch {
      setError("Connection error — please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#05050f", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans','Helvetica Neue',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .pw-input:focus{outline:none!important;border-color:#7C83FD!important;box-shadow:0 0 0 3px #7C83FD15!important}
        .pw-btn{transition:all .2s}.pw-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px #7C83FD55!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .fade{animation:fadeUp .5s ease}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="fade" style={{ width:"100%", maxWidth:400, textAlign:"center" }}>
        {/* Logo */}
        <div style={{ width:56, height:56, borderRadius:16, background:"linear-gradient(135deg,#7C83FD,#4ECDC4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, margin:"0 auto 20px" }}>◈</div>
        <div style={{ fontWeight:800, fontSize:22, color:"#fff", letterSpacing:-.5, marginBottom:4 }}>ContentIQ</div>
        <div style={{ fontSize:11, color:"#2a2a44", fontFamily:"monospace", letterSpacing:2, marginBottom:32 }}>SEO · AEO · GEO · LLM OPTIMIZER</div>

        {/* Card */}
        <div style={{ background:"#080818", border:"1px solid #131326", borderRadius:18, padding:"28px 24px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#ccc", marginBottom:6 }}>Enter Access Password</div>
          <div style={{ fontSize:12, color:"#333", marginBottom:22, lineHeight:1.6 }}>This tool is invite-only. Enter the password shared with you to continue.</div>

          <div style={{ position:"relative", marginBottom:14 }}>
            <input
              className="pw-input"
              type={show ? "text" : "password"}
              value={pw}
              onChange={e => { setPw(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && attempt()}
              placeholder="Password"
              style={{ width:"100%", background:"#0d0d20", border:"1px solid #1a1a30", borderRadius:10, padding:"12px 44px 12px 16px", fontSize:14, color:"#eee", fontFamily:"inherit", transition:"all .2s" }}
            />
            <button onClick={() => setShow(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#333", cursor:"pointer", fontSize:16 }}>
              {show ? "🙈" : "👁"}
            </button>
          </div>

          {error && (
            <div style={{ background:"#FF475715", border:"1px solid #FF475730", borderRadius:8, padding:"9px 13px", fontSize:12, color:"#FF4757", marginBottom:14, textAlign:"left" }}>
              {error}
            </div>
          )}

          <button onClick={attempt} disabled={!pw.trim()||loading} className="pw-btn"
            style={{ width:"100%", background:pw.trim()&&!loading?"linear-gradient(135deg,#7C83FD,#4ECDC4)":"#111128", color:pw.trim()&&!loading?"#000":"#2a2a44", border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:800, cursor:pw.trim()&&!loading?"pointer":"not-allowed", fontFamily:"inherit", boxShadow:pw.trim()&&!loading?"0 0 24px #7C83FD33":"none" }}>
            {loading ? (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <span style={{ width:14, height:14, border:"2px solid #00000040", borderTopColor:"#000", borderRadius:"50%", display:"inline-block", animation:"spin .7s linear infinite" }}/>
                Verifying...
              </span>
            ) : "Access ContentIQ →"}
          </button>
        </div>

        <div style={{ fontSize:10, color:"#1a1a28", marginTop:18, fontFamily:"monospace" }}>
          Powered by Anthropic Claude + Live Web Search
        </div>
      </div>
    </div>
  );
}

// ─── Usage Banner ───────────────────────────────────────────────────────────
function UsageBanner({ usage, onLogout }) {
  const remaining = Math.max(0, DAILY_LIMIT - usage.count);
  const pct       = (usage.count / DAILY_LIMIT) * 100;
  const col       = remaining > 3 ? "#2ED573" : remaining > 0 ? "#FFA502" : "#FF4757";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, background:"#080818", border:"1px solid #131326", borderRadius:10, padding:"9px 14px", marginBottom:14 }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#555", marginBottom:4 }}>
          <span style={{ fontFamily:"monospace" }}>Daily usage</span>
          <span style={{ color:col, fontFamily:"monospace", fontWeight:700 }}>{usage.count}/{DAILY_LIMIT} used · {remaining} remaining</span>
        </div>
        <div style={{ background:"#111128", borderRadius:4, height:4, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg,${col}77,${col})`, borderRadius:4, transition:"width .6s ease" }} />
        </div>
        {remaining === 0 && (
          <div style={{ fontSize:11, color:"#FF4757", marginTop:5 }}>Daily limit reached — resets at midnight.</div>
        )}
      </div>
      <button onClick={onLogout}
        style={{ background:"none", border:"1px solid #1a1a2e", borderRadius:7, padding:"5px 11px", fontSize:10, color:"#333", cursor:"pointer", fontFamily:"monospace", flexShrink:0, whiteSpace:"nowrap" }}>
        Sign out
      </button>
    </div>
  );
}

// ─── History Card ───────────────────────────────────────────────────────────
function HistoryCard({ item, onLoad, onDelete }) {
  const col   = scoreColor(item.overallScore);
  const date  = new Date(item.savedAt);
  const dStr  = date.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  const tStr  = date.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
  return (
    <div style={{ background:"#08081a", border:`1px solid ${col}22`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ flex:1, marginRight:12 }}>
          <div style={{ fontSize:12, color:"#ccc", fontWeight:700, marginBottom:3, lineHeight:1.4 }}>{item.contentSummary||"Content analysis"}</div>
          <div style={{ fontSize:10, color:"#2a2a44", fontFamily:"monospace" }}>{dStr} · {tStr}</div>
        </div>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:18, fontWeight:900, color:col, fontFamily:"monospace", lineHeight:1 }}>{item.overallScore}</div>
          <div style={{ fontSize:8, color:"#2a2a44", fontFamily:"monospace" }}>SCORE</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:7, marginBottom:10 }}>
        {[["SEO",item.seoScore,item.seoGrade],["AEO",item.aeoScore,item.aeoGrade],["LLM",item.llmScore,item.llmGrade]].map(([l,s,g])=>{
          const c=scoreColor(s||0);
          return <span key={l} style={{ background:`${c}15`, color:c, padding:"2px 9px", borderRadius:20, fontSize:10, fontFamily:"monospace", fontWeight:700 }}>{l}: {g}</span>;
        })}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>onLoad(item)} style={{ background:"#111128", color:"#7C83FD", border:"1px solid #7C83FD30", borderRadius:7, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>Load Analysis</button>
        <button onClick={()=>onDelete(item.id)} style={{ background:"none", color:"#2a2a44", border:"1px solid #1a1a2e", borderRadius:7, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
const TABS = [
  { key:"overview", label:"Overview" },
  { key:"seo",      label:"⬡ SEO" },
  { key:"aeo",      label:"◎ AEO" },
  { key:"llm",      label:"◈ LLM" },
  { key:"rewrite",  label:"✦ Rewrite" },
  { key:"actions",  label:"⚡ Actions" },
  { key:"history",  label:"🕐 History" },
];

function MainApp({ password }) {
  const [content, setContent] = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState("");
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState("overview");
  const [copied, setCopied]   = useState(false);
  const [history, setHistory] = useState([]);
  const [usage, setUsage]     = useState(getUsage);

  // Load history from localStorage
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("analysis:"));
    const items = keys.map(k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }).filter(Boolean);
    items.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
    setHistory(items);
  }, []);

  const saveToHistory = (analysisResult, contentText) => {
    const id = `analysis:${Date.now()}`;
    const item = {
      id, savedAt: new Date().toISOString(),
      overallScore: analysisResult.overallScore,
      contentSummary: analysisResult.contentSummary,
      seoScore: analysisResult.seo?.score, seoGrade: analysisResult.seo?.grade,
      aeoScore: analysisResult.aeo?.score, aeoGrade: analysisResult.aeo?.grade,
      llmScore: analysisResult.llmCitation?.score, llmGrade: analysisResult.llmCitation?.grade,
      strategiesUsed: analysisResult.strategiesUsed,
      contentSnippet: contentText.slice(0, 300),
      fullResult: analysisResult,
    };
    localStorage.setItem(id, JSON.stringify(item));
    setHistory(prev => [item, ...prev]);
  };

  const deleteHistory = (id) => {
    localStorage.removeItem(id);
    setHistory(prev => prev.filter(i => i.id !== id));
  };

  const loadHistory = (item) => {
    setResult(item.fullResult);
    setContent(item.contentSnippet || "");
    setTab("overview");
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    window.location.reload();
  };

  const analyze = async () => {
    if (!content.trim()) return;
    const currentUsage = getUsage();
    if (currentUsage.count >= DAILY_LIMIT) {
      setError(`Daily limit of ${DAILY_LIMIT} analyses reached. Resets at midnight.`);
      return;
    }
    setLoading(true); setError(null); setResult(null);
    setStatus("Searching for latest SEO/AEO strategies...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-password": password,
          "x-usage-date": today(),
          "x-usage-count": String(currentUsage.count),
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role:"user", content:`Search for the latest SEO, AEO, GEO and LLM citation best practices from the last 30 days, then analyse this content:\n\n${content}` }],
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data.error === "daily_limit_reached") {
        setError(data.message || "Daily limit reached.");
        setLoading(false); setStatus(""); return;
      }
      if (res.status === 401) {
        setError("Session expired. Please refresh and log in again.");
        setLoading(false); setStatus(""); return;
      }

      setStatus("Applying live strategies to your content...");
      const textBlocks = (data.content || []).filter(c => c.type === "text");
      const raw = textBlocks.map(c => c.text || "").join("");
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]);

      // Increment usage counter
      const newUsage = incrementUsage();
      setUsage(newUsage);

      setResult(parsed);
      setTab("overview");
      saveToHistory(parsed, content);
    } catch(e) {
      setError("Analysis failed — please try again.");
    }
    setLoading(false); setStatus("");
  };

  const overallColor = result ? scoreColor(result.overallScore) : "#7C83FD";
  const limitReached = usage.count >= DAILY_LIMIT;

  return (
    <div style={{ minHeight:"100vh", background:"#05050f", color:"#ddd", fontFamily:"'DM Sans','Helvetica Neue',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#080818}::-webkit-scrollbar-thumb{background:#1e1e36;border-radius:4px}
        textarea:focus{outline:none!important;border-color:#7C83FD!important;box-shadow:0 0 0 3px #7C83FD15!important}
        .tab{background:none;border:none;cursor:pointer;padding:7px 13px;border-radius:7px;font-family:inherit;font-size:12px;font-weight:600;transition:all .15s;color:#444;white-space:nowrap}
        .tab:hover{color:#aaa;background:#111128}.tab.on{color:#fff;background:#181830}
        .fade{animation:fadeUp .35s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#7C83FD;animation:blink 1.2s infinite}
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        @keyframes blink{0%,100%{opacity:.2}50%{opacity:1}}
        .run-btn{transition:all .2s}.run-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px #7C83FD44!important}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #0e0e22", padding:"13px 26px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#7C83FD,#4ECDC4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900 }}>◈</div>
          <div>
            <div style={{ fontWeight:800, fontSize:14, color:"#fff", letterSpacing:-.3 }}>ContentIQ <span style={{ fontSize:9, color:"#7C83FD", fontFamily:"monospace" }}>v3</span></div>
            <div style={{ fontSize:9, color:"#2a2a44", fontFamily:"monospace", letterSpacing:2 }}>LIVE STRATEGIES · PERSISTENT MEMORY</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          <span style={{ fontSize:9, color:"#2ED573", background:"#2ED57315", border:"1px solid #2ED57330", borderRadius:5, padding:"2px 8px", fontFamily:"monospace" }}>🔍 Live Search</span>
          <span style={{ fontSize:9, color:"#7C83FD", background:"#7C83FD15", border:"1px solid #7C83FD30", borderRadius:5, padding:"2px 8px", fontFamily:"monospace" }}>💾 History</span>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"24px 18px" }}>

        {/* Usage Banner */}
        <UsageBanner usage={usage} onLogout={logout} />

        {/* Input */}
        <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:6, letterSpacing:-.4 }}>AI Content Audit — Always Current</h1>
        <p style={{ fontSize:12, color:"#2a2a44", marginBottom:16, lineHeight:1.7 }}>
          Searches for the latest SEO/AEO/GEO strategies before every analysis. Results saved to your history automatically.
        </p>

        {limitReached && (
          <div style={{ background:"#FFA50215", border:"1px solid #FFA50230", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:12, color:"#FFA502" }}>
            ⚠ You have used all {DAILY_LIMIT} analyses for today. Your limit resets at midnight.
          </div>
        )}

        <div style={{ position:"relative" }}>
          <textarea value={content} onChange={e=>setContent(e.target.value)}
            placeholder="Paste your content — blog posts, landing pages, articles, product pages..."
            rows={8}
            disabled={limitReached}
            style={{ width:"100%", background: limitReached?"#070714":"#080818", border:"1px solid #131326", borderRadius:11, padding:"15px 18px", fontSize:13, color: limitReached?"#333":"#bbb", lineHeight:1.8, fontFamily:"inherit", transition:"all .2s", cursor: limitReached?"not-allowed":"text" }}
          />
          <div style={{ position:"absolute", bottom:11, right:13, fontSize:10, color:"#1a1a30", fontFamily:"monospace" }}>
            {content.trim().split(/\s+/).filter(Boolean).length}w
          </div>
        </div>

        <div style={{ marginTop:11, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:11, color:"#2a2a44" }}>{history.length>0&&`${history.length} past analysis${history.length>1?"es":""} saved`}</div>
          <button onClick={analyze} disabled={!content.trim()||loading||limitReached} className="run-btn"
            style={{ background:content.trim()&&!loading&&!limitReached?"linear-gradient(135deg,#7C83FD,#4ECDC4)":"#111128", color:content.trim()&&!loading&&!limitReached?"#000":"#2a2a44", border:"none", borderRadius:9, padding:"11px 28px", fontSize:13, fontWeight:800, cursor:content.trim()&&!loading&&!limitReached?"pointer":"not-allowed", fontFamily:"inherit", boxShadow:content.trim()&&!loading&&!limitReached?"0 0 20px #7C83FD30":"none" }}>
            {loading?"Analysing...":"Run Live Audit →"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ display:"flex", justifyContent:"center", gap:5, marginBottom:14 }}>
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
            <div style={{ fontSize:13, color:"#ccc", marginBottom:6, fontWeight:600 }}>{status}</div>
            <div style={{ fontSize:11, color:"#2a2a44", fontFamily:"monospace" }}>Fetching latest strategies · Applying to your content</div>
          </div>
        )}

        {error && <div style={{ background:"#FF475712", border:"1px solid #FF475730", borderRadius:10, padding:14, color:"#FF4757", fontSize:13, textAlign:"center", marginTop:14 }}>{error}</div>}

        {/* Results */}
        {result && !loading && (
          <div className="fade" style={{ marginTop:22 }}>

            {/* Live strategies badge */}
            {result.strategiesUsed?.length>0 && (
              <div style={{ background:"#0a0a1a", border:"1px solid #2ED57320", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ fontSize:9, color:"#2ED573", fontFamily:"monospace", letterSpacing:1.5, marginBottom:7 }}>🔍 LIVE STRATEGIES APPLIED</div>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  {result.strategiesUsed.map((s,i)=>(
                    <span key={i} style={{ fontSize:10, color:"#444", background:"#111128", border:"1px solid #1a1a2e", borderRadius:5, padding:"2px 8px" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Hero card */}
            <div style={{ background:"#080818", border:"1px solid #131326", borderRadius:15, padding:"20px 24px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  <ScoreRing score={result.overallScore} size={84} stroke={7} color={overallColor} />
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transform:"rotate(90deg)" }}>
                    <span style={{ fontSize:19, fontWeight:900, color:overallColor, fontFamily:"monospace", lineHeight:1 }}>{result.overallScore}</span>
                    <span style={{ fontSize:8, color:"#333", fontFamily:"monospace" }}>/100</span>
                  </div>
                </div>
                <div style={{ flex:1, minWidth:150 }}>
                  <div style={{ fontSize:9, color:"#333", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Overall Score</div>
                  <div style={{ fontSize:16, fontWeight:800, color:"#eee", marginBottom:6, lineHeight:1.3 }}>
                    {result.overallScore>=80?"Strong — fine-tune for max AI visibility":result.overallScore>=60?"Solid base — clear gaps to close":result.overallScore>=40?"Significant optimisation needed":"Major restructure required"}
                  </div>
                  {result.contentSummary&&<div style={{ fontSize:11, color:"#333", fontStyle:"italic" }}>{result.contentSummary}</div>}
                </div>
              </div>
              <div style={{ display:"flex", gap:9, marginTop:16, flexWrap:"wrap" }}>
                <ScoreBlock label="SEO" score={result.seo?.score} grade={result.seo?.grade} icon="⬡"/>
                <ScoreBlock label="AEO" score={result.aeo?.score} grade={result.aeo?.grade} icon="◎"/>
                <ScoreBlock label="LLM" score={result.llmCitation?.score} grade={result.llmCitation?.grade} icon="◈"/>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:2, background:"#080818", border:"1px solid #0e0e20", borderRadius:9, padding:3, marginBottom:14, overflowX:"auto" }}>
              {TABS.map(t=>(
                <button key={t.key} className={`tab ${tab===t.key?"on":""}`} onClick={()=>setTab(t.key)}>
                  {t.key==="history"?`🕐 History (${history.length})`:t.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {tab==="overview" && (
              <div className="fade">
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
                  {[["Answer-First",result.aeo?.answerFirstScore,"◎"],["RAG Survival",result.llmCitation?.ragSurvivability?.score,"◈"],["Token Efficiency",result.llmCitation?.tokenEfficiency?.score,"⚡"],["Zero-Click",result.aeo?.zeroClickOptimization,"○"],["Schema Ready",result.aeo?.schemaReadiness,"⊞"],["Agentic Discovery",result.llmCitation?.agenticDiscoverability?.score,"🤖"]].map(([label,val,icon])=>{
                    const v=val||0; const c=scoreColor(v);
                    return (
                      <div key={label} style={{ background:"#080818", border:`1px solid ${c}18`, borderRadius:10, padding:"11px 13px" }}>
                        <div style={{ fontSize:9, color:"#333", fontFamily:"monospace", marginBottom:8 }}>{icon} {label}</div>
                        <MiniBar label="" value={v}/>
                        <div style={{ fontSize:14, fontWeight:800, color:c, fontFamily:"monospace" }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                {result.priorityActions&&(
                  <Panel title="Top 5 Priority Actions" icon="⚡">
                    {result.priorityActions.map(a=>(
                      <div key={a.priority} style={{ display:"flex", gap:11, padding:"10px 0", borderBottom:"1px solid #0d0d1e", alignItems:"flex-start" }}>
                        <div style={{ width:22, height:22, borderRadius:6, background:"#111128", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#7C83FD", fontFamily:"monospace", flexShrink:0 }}>{a.priority}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:5, marginBottom:4, flexWrap:"wrap" }}>
                            <Badge label={a.category} type="blue"/>
                            <Badge label={`Impact: ${a.impact}`} type={a.impact==="high"?"error":a.impact==="medium"?"warning":"ok"}/>
                            <Badge label={`Effort: ${a.effort}`} type="neutral"/>
                          </div>
                          <div style={{ fontSize:12, color:"#bbb", lineHeight:1.6 }}>{a.action}</div>
                        </div>
                      </div>
                    ))}
                  </Panel>
                )}
              </div>
            )}

            {/* ── SEO ── */}
            {tab==="seo"&&result.seo&&(
              <div className="fade">
                <p style={{ fontSize:13, color:"#555", lineHeight:1.7, marginBottom:12, borderLeft:"3px solid #7C83FD44", paddingLeft:12 }}>{result.seo.summary}</p>
                {result.seo.eeat&&(
                  <Panel title="E-E-A-T Analysis" icon="🏅">
                    {["experience","expertise","authoritativeness","trustworthiness"].map(k=>(
                      <MiniBar key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={result.seo.eeat[k]}/>
                    ))}
                    <div style={{ fontSize:12, color:"#666", background:"#0a0a1c", borderRadius:8, padding:"9px 12px", marginTop:9, lineHeight:1.6 }}>{result.seo.eeat.notes}</div>
                  </Panel>
                )}
                {result.seo.keywords&&(
                  <Panel title="Keywords & Semantic Gaps" icon="⬡">
                    {[["PRIMARY",result.seo.keywords.primary,"#2ED573"],["MISSING",result.seo.keywords.missing,"#FF4757"],["TOPIC GAPS",result.seo.keywords.semanticGaps,"#FFA502"]].map(([l,arr,c])=>(
                      <div key={l} style={{ marginBottom:12 }}>
                        <div style={{ fontSize:9, color:"#333", fontFamily:"monospace", letterSpacing:1.5, marginBottom:7 }}>{l}</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {arr?.map(k=><span key={k} style={{ background:`${c}18`, color:c, padding:"2px 9px", borderRadius:20, fontSize:11, fontFamily:"monospace" }}>{k}</span>)}
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize:11, color:"#444" }}>Density: <span style={{ color:"#FFA502", fontFamily:"monospace" }}>{result.seo.keywords.density}</span></div>
                  </Panel>
                )}
                <Panel title="Issues & Quick Wins" icon="⚠">
                  {result.seo.issues?.map((issue,i)=>(
                    <div key={i} style={{ display:"flex", gap:9, padding:"8px 0", borderBottom:"1px solid #0d0d1e" }}>
                      <span style={{ color:typeColors[issue.type], fontSize:11, marginTop:2 }}>{typeIcons[issue.type]}</span>
                      <div><div style={{ fontSize:12, fontWeight:700, color:"#ccc", marginBottom:2 }}>{issue.title}</div>
                        <div style={{ fontSize:11, color:"#555", lineHeight:1.6 }}>{issue.detail}</div></div>
                    </div>
                  ))}
                  <div style={{ background:"#0a0a1c", borderRadius:8, padding:"12px 14px", marginTop:10 }}>
                    <div style={{ fontSize:9, color:"#2a2a44", fontFamily:"monospace", letterSpacing:1.5, marginBottom:8 }}>QUICK WINS</div>
                    {result.seo.quickWins?.map((w,i)=><div key={i} style={{ fontSize:12, color:"#bbb", marginBottom:6, lineHeight:1.5 }}><span style={{ color:"#7C83FD", fontWeight:800 }}>{i+1}.</span> {w}</div>)}
                  </div>
                </Panel>
              </div>
            )}

            {/* ── AEO ── */}
            {tab==="aeo"&&result.aeo&&(
              <div className="fade">
                <p style={{ fontSize:13, color:"#555", lineHeight:1.7, marginBottom:12, borderLeft:"3px solid #4ECDC444", paddingLeft:12 }}>{result.aeo.summary}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  {[["Answer-First",result.aeo.answerFirstScore],["Featured Snippet",result.aeo.featuredSnippetReadiness],["Voice Search",result.aeo.voiceSearchScore],["Zero-Click",result.aeo.zeroClickOptimization],["Schema Readiness",result.aeo.schemaReadiness],["Entity Clarity",result.aeo.entityClarity]].map(([l,v])=>(
                    <div key={l} style={{ background:"#08081a", borderRadius:9, padding:"10px 12px" }}><MiniBar label={l} value={v||0}/></div>
                  ))}
                </div>
                {result.aeo.answerFirstAudit&&(
                  <Panel title="Answer-First Audit" icon="◎">
                    <Badge label={result.aeo.answerFirstAudit.hasDirectOpeningAnswer?"Has Direct Answer ✓":"No Direct Answer ✕"} type={result.aeo.answerFirstAudit.hasDirectOpeningAnswer?"ok":"error"}/>
                    <div style={{ background:"#0a0a1c", borderRadius:8, padding:"10px 12px", margin:"10px 0", fontSize:12, color:"#666", fontStyle:"italic", lineHeight:1.7 }}>"{result.aeo.answerFirstAudit.openingTokens}"</div>
                    <div style={{ fontSize:12, color:"#888", lineHeight:1.6 }}>{result.aeo.answerFirstAudit.verdict}</div>
                  </Panel>
                )}
                {result.aeo.platforms&&(
                  <Panel title="Multi-Platform Visibility" icon="🌐">
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      {Object.entries(result.aeo.platforms).map(([k,v])=>{
                        const lb={googleAIOverviews:"Google AI",chatGPTSearch:"ChatGPT",perplexity:"Perplexity",bingCopilot:"Bing Copilot"};
                        const ic={googleAIOverviews:"G",chatGPTSearch:"⊕",perplexity:"P",bingCopilot:"B"};
                        const c=scoreColor(v.score);
                        return (
                          <div key={k} style={{ background:"#0a0a1c", borderRadius:9, padding:"10px 12px", border:`1px solid ${c}18` }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                              <span style={{ fontSize:10, color:"#444", fontFamily:"monospace" }}>{ic[k]} {lb[k]}</span>
                              <span style={{ fontSize:12, fontWeight:800, color:c, fontFamily:"monospace" }}>{v.score}</span>
                            </div>
                            <div style={{ background:"#111128", borderRadius:3, height:3, marginBottom:6 }}><div style={{ width:`${v.score}%`, height:"100%", background:c, borderRadius:3 }}/></div>
                            <div style={{ fontSize:10, color:"#444", lineHeight:1.5 }}>{v.note}</div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                )}
                <Panel title="Issues & Quick Wins" icon="⚠">
                  {result.aeo.issues?.map((issue,i)=>(
                    <div key={i} style={{ display:"flex", gap:9, padding:"8px 0", borderBottom:"1px solid #0d0d1e" }}>
                      <span style={{ color:typeColors[issue.type], fontSize:11, marginTop:2 }}>{typeIcons[issue.type]}</span>
                      <div><div style={{ fontSize:12, fontWeight:700, color:"#ccc", marginBottom:2 }}>{issue.title}</div>
                        <div style={{ fontSize:11, color:"#555", lineHeight:1.6 }}>{issue.detail}</div></div>
                    </div>
                  ))}
                  <div style={{ background:"#0a0a1c", borderRadius:8, padding:"12px 14px", marginTop:10 }}>
                    <div style={{ fontSize:9, color:"#2a2a44", fontFamily:"monospace", letterSpacing:1.5, marginBottom:8 }}>QUICK WINS</div>
                    {result.aeo.quickWins?.map((w,i)=><div key={i} style={{ fontSize:12, color:"#bbb", marginBottom:6, lineHeight:1.5 }}><span style={{ color:"#4ECDC4", fontWeight:800 }}>{i+1}.</span> {w}</div>)}
                  </div>
                </Panel>
              </div>
            )}

            {/* ── LLM ── */}
            {tab==="llm"&&result.llmCitation&&(
              <div className="fade">
                <p style={{ fontSize:13, color:"#555", lineHeight:1.7, marginBottom:12, borderLeft:"3px solid #FFA50244", paddingLeft:12 }}>{result.llmCitation.summary}</p>
                {result.llmCitation.ragSurvivability&&(
                  <Panel title="RAG Survivability" icon="◈">
                    <Badge label={`Chunking Risk: ${result.llmCitation.ragSurvivability.chunkingRisk}`} type={result.llmCitation.ragSurvivability.chunkingRisk==="low"?"ok":result.llmCitation.ragSurvivability.chunkingRisk==="medium"?"warning":"error"}/>
                    <div style={{ marginTop:10 }}>
                      <MiniBar label="Embedding Clarity" value={result.llmCitation.ragSurvivability.embeddingClarity}/>
                      <MiniBar label="Semantic Coherence" value={result.llmCitation.ragSurvivability.semanticCoherence}/>
                    </div>
                    <div style={{ fontSize:12, color:"#666", background:"#0a0a1c", borderRadius:8, padding:"9px 12px", marginTop:9, lineHeight:1.6 }}>{result.llmCitation.ragSurvivability.note}</div>
                  </Panel>
                )}
                {result.llmCitation.tokenEfficiency&&(
                  <Panel title="Token Efficiency" icon="⚡">
                    <Badge label={`Bloat Risk: ${result.llmCitation.tokenEfficiency.bloatRisk}`} type={result.llmCitation.tokenEfficiency.bloatRisk==="low"?"ok":result.llmCitation.tokenEfficiency.bloatRisk==="medium"?"warning":"error"}/>
                    <div style={{ marginTop:10 }}><MiniBar label="Front-Load Score" value={result.llmCitation.tokenEfficiency.frontLoadScore}/></div>
                    <div style={{ fontSize:12, color:"#666", background:"#0a0a1c", borderRadius:8, padding:"9px 12px", marginTop:9, lineHeight:1.6 }}>{result.llmCitation.tokenEfficiency.note}</div>
                  </Panel>
                )}
                <Panel title="Citability Factors" icon="📊">
                  {Object.entries(result.llmCitation.citabilityFactors||{}).map(([k,v])=>(
                    <MiniBar key={k} label={k.replace(/([A-Z])/g," $1").trim()} value={v}/>
                  ))}
                </Panel>
                {result.llmCitation.suggestedCitableStatements&&(
                  <Panel title="Citable Statements" icon="💬">
                    {result.llmCitation.suggestedCitableStatements.map((s,i)=>(
                      <div key={i} style={{ background:"#0d0d20", border:"1px solid #7C83FD20", borderRadius:9, padding:"10px 13px", marginBottom:9 }}>
                        <div style={{ fontSize:12, color:"#bbb", lineHeight:1.7, fontStyle:"italic", marginBottom:6 }}>"{s.statement}"</div>
                        <div style={{ fontSize:10, color:"#7C83FD", fontFamily:"monospace" }}>▸ {s.why}</div>
                      </div>
                    ))}
                  </Panel>
                )}
                <Panel title="Issues & Quick Wins" icon="⚠">
                  {result.llmCitation.issues?.map((issue,i)=>(
                    <div key={i} style={{ display:"flex", gap:9, padding:"8px 0", borderBottom:"1px solid #0d0d1e" }}>
                      <span style={{ color:typeColors[issue.type], fontSize:11, marginTop:2 }}>{typeIcons[issue.type]}</span>
                      <div><div style={{ fontSize:12, fontWeight:700, color:"#ccc", marginBottom:2 }}>{issue.title}</div>
                        <div style={{ fontSize:11, color:"#555", lineHeight:1.6 }}>{issue.detail}</div></div>
                    </div>
                  ))}
                  <div style={{ background:"#0a0a1c", borderRadius:8, padding:"12px 14px", marginTop:10 }}>
                    <div style={{ fontSize:9, color:"#2a2a44", fontFamily:"monospace", letterSpacing:1.5, marginBottom:8 }}>QUICK WINS</div>
                    {result.llmCitation.quickWins?.map((w,i)=><div key={i} style={{ fontSize:12, color:"#bbb", marginBottom:6, lineHeight:1.5 }}><span style={{ color:"#FFA502", fontWeight:800 }}>{i+1}.</span> {w}</div>)}
                  </div>
                </Panel>
              </div>
            )}

            {/* ── REWRITE ── */}
            {tab==="rewrite"&&result.rewriteSuggestion&&(
              <div className="fade">
                <Panel title="Original Opening" icon="📄">
                  <div style={{ fontSize:13, color:"#555", lineHeight:1.8, fontStyle:"italic", borderLeft:"3px solid #FF475740", paddingLeft:13 }}>{result.rewriteSuggestion.original}</div>
                </Panel>
                <Panel title="Optimised Rewrite" icon="✦">
                  <div style={{ fontSize:13, color:"#ccc", lineHeight:1.9, borderLeft:"3px solid #2ED57340", paddingLeft:13, marginBottom:13 }}>{result.rewriteSuggestion.rewritten}</div>
                  <button onClick={()=>{navigator.clipboard.writeText(result.rewriteSuggestion.rewritten);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                    style={{ background:copied?"#2ED57318":"#111128", color:copied?"#2ED573":"#555", border:`1px solid ${copied?"#2ED57330":"#1a1a30"}`, borderRadius:7, padding:"6px 14px", fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>
                    {copied?"✓ Copied!":"Copy Rewrite"}
                  </button>
                </Panel>
                <Panel title="What Was Improved" icon="⬆">
                  {result.rewriteSuggestion.whatsImproved?.map((w,i)=>(
                    <div key={i} style={{ display:"flex", gap:9, marginBottom:9, fontSize:12, color:"#bbb", lineHeight:1.6 }}>
                      <span style={{ color:"#2ED573", fontWeight:800, minWidth:13 }}>{i+1}.</span> {w}
                    </div>
                  ))}
                </Panel>
              </div>
            )}

            {/* ── ACTIONS ── */}
            {tab==="actions"&&result.priorityActions&&(
              <div className="fade">
                <Panel title="Priority Action Plan" icon="⚡">
                  {result.priorityActions.map(a=>(
                    <div key={a.priority} style={{ display:"flex", gap:11, padding:"10px 0", borderBottom:"1px solid #0d0d1e", alignItems:"flex-start" }}>
                      <div style={{ width:22, height:22, borderRadius:6, background:"#111128", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:"#7C83FD", fontFamily:"monospace", flexShrink:0 }}>{a.priority}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:5, marginBottom:4, flexWrap:"wrap" }}>
                          <Badge label={a.category} type="blue"/>
                          <Badge label={`Impact: ${a.impact}`} type={a.impact==="high"?"error":a.impact==="medium"?"warning":"ok"}/>
                          <Badge label={`Effort: ${a.effort}`} type="neutral"/>
                        </div>
                        <div style={{ fontSize:12, color:"#bbb", lineHeight:1.6 }}>{a.action}</div>
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>
            )}

            {/* ── HISTORY ── */}
            {tab==="history"&&(
              <div className="fade">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:"#eee", marginBottom:3 }}>Analysis History</div>
                    <div style={{ fontSize:11, color:"#2a2a44" }}>{history.length} saved · stored in your browser</div>
                  </div>
                  {history.length>0&&(
                    <button onClick={()=>{history.forEach(i=>localStorage.removeItem(i.id));setHistory([]);}}
                      style={{ background:"#FF475718", color:"#FF4757", border:"1px solid #FF475730", borderRadius:7, padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                      Clear All
                    </button>
                  )}
                </div>
                {history.length===0&&(
                  <div style={{ textAlign:"center", padding:"40px 20px" }}>
                    <div style={{ fontSize:28, marginBottom:10 }}>🕐</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#333", marginBottom:5 }}>No history yet</div>
                    <div style={{ fontSize:12, color:"#2a2a44" }}>Analyses appear here automatically after each audit</div>
                  </div>
                )}
                {history.map(item=>(
                  <HistoryCard key={item.id} item={item} onLoad={loadHistory} onDelete={deleteHistory}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Standalone history view (before first result) */}
        {!result&&!loading&&tab==="history"&&(
          <div className="fade" style={{ marginTop:22 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:"#eee", marginBottom:3 }}>Analysis History</div>
                <div style={{ fontSize:11, color:"#2a2a44" }}>{history.length} saved</div>
              </div>
              {history.length>0&&(
                <button onClick={()=>{history.forEach(i=>localStorage.removeItem(i.id));setHistory([]);}}
                  style={{ background:"#FF475718", color:"#FF4757", border:"1px solid #FF475730", borderRadius:7, padding:"6px 12px", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                  Clear All
                </button>
              )}
            </div>
            {history.length===0&&(
              <div style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>🕐</div>
                <div style={{ fontSize:13, fontWeight:700, color:"#333", marginBottom:5 }}>No history yet</div>
                <div style={{ fontSize:12, color:"#2a2a44" }}>Run your first audit to start building your optimisation history</div>
              </div>
            )}
            {history.map(item=>(
              <HistoryCard key={item.id} item={item} onLoad={i=>{setResult(i.fullResult);setContent(i.contentSnippet||"");setTab("overview");}} onDelete={deleteHistory}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root — handles auth state ──────────────────────────────────────────────
export default function App() {
  const [password, setPassword] = useState(() => {
    // Restore session if previously authenticated
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      return stored ? atob(stored) : null;
    } catch { return null; }
  });

  if (!password) {
    return <PasswordGate onSuccess={pw => setPassword(pw)} />;
  }

  return <MainApp password={password} />;
}
