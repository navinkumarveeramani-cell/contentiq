// src/App.jsx — ContentIQ v3 · Professional Redesign
import { useState, useEffect } from "react";

// ─── Config ────────────────────────────────────────────────────────────────
const DAILY_LIMIT = parseInt(import.meta.env.VITE_DAILY_LIMIT || "20", 10);
const STORAGE_KEY = "ciq_usage";
const AUTH_KEY    = "ciq_authed";

const SYSTEM_PROMPT = `You are a world-class SEO, AEO, GEO (Generative Engine Optimization), and LLM visibility strategist with deep expertise in 2026's AI-first search landscape. You understand Google AI Overviews, ChatGPT Search, Perplexity, Bing Copilot, and Gemini citation mechanics. You think at both page-level AND fact-level. You understand RAG pipelines, token efficiency, E-E-A-T, semantic chunking, and agentic discoverability.

Analyse the provided content and return ONLY a valid JSON object (no markdown, no backticks, no preamble) with this exact structure:

{
  "overallScore": <0-100>,
  "contentSummary": "<1 sentence: what this content is about and its current state>",
  "strategiesUsed": ["<strategy 1>","<strategy 2>","<strategy 3>","<strategy 4>","<strategy 5>"],
  "seo": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2-sentence overview>",
    "eeat": { "experience": <0-100>, "expertise": <0-100>, "authoritativeness": <0-100>, "trustworthiness": <0-100>, "notes": "<detail>" },
    "keywords": { "primary": ["<kw1>","<kw2>","<kw3>"], "missing": ["<kw1>","<kw2>","<kw3>"], "semanticGaps": ["<gap1>","<gap2>"], "density": "<X%>" },
    "technicalSignals": [{ "type": "error|warning|ok", "signal": "<name>", "detail": "<detail>" }],
    "issues": [{ "type": "error|warning|suggestion", "title": "<title>", "detail": "<detail>" }],
    "quickWins": ["<win1>","<win2>","<win3>"]
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
    "issues": [{ "type": "error|warning|suggestion", "title": "<title>", "detail": "<detail>" }],
    "quickWins": ["<win1>","<win2>","<win3>"]
  },
  "llmCitation": {
    "score": <0-100>, "grade": "<A/B/C/D/F>", "summary": "<2-sentence overview>",
    "ragSurvivability": { "score": <0-100>, "chunkingRisk": "low|medium|high", "embeddingClarity": <0-100>, "semanticCoherence": <0-100>, "note": "<detail>" },
    "tokenEfficiency": { "score": <0-100>, "bloatRisk": "low|medium|high", "frontLoadScore": <0-100>, "note": "<detail>" },
    "citabilityFactors": { "authoritySignals": <0-100>, "factualDensity": <0-100>, "structureClarity": <0-100>, "uniqueInsights": <0-100>, "dataAndStatistics": <0-100>, "entityConsistency": <0-100> },
    "suggestedCitableStatements": [{ "statement": "<statement>", "why": "<why LLM would cite>" }],
    "agenticDiscoverability": { "score": <0-100>, "cleanSemanticStructure": <true|false>, "machineReadableSignals": <true|false>, "note": "<detail>" },
    "issues": [{ "type": "error|warning|suggestion", "title": "<title>", "detail": "<detail>" }],
    "quickWins": ["<win1>","<win2>","<win3>"]
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

// ─── Utils ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0,10);

function getUsage() {
  try {
    const r = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return r?.date === today() ? r : { date: today(), count: 0 };
  } catch { return { date: today(), count: 0 }; }
}
function incrementUsage() {
  const u = { date: today(), count: getUsage().count + 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  return u;
}

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg:       "#0B0E1A",
  surface:  "#111827",
  surface2: "#1C2333",
  border:   "#1F2937",
  border2:  "#2D3748",
  text:     "#F1F5F9",
  muted:    "#64748B",
  muted2:   "#94A3B8",
  blue:     "#3B82F6",
  blueD:    "#1D4ED8",
  green:    "#10B981",
  amber:    "#F59E0B",
  red:      "#EF4444",
  indigo:   "#6366F1",
};

const scoreColor = s => s >= 75 ? C.green : s >= 50 ? C.amber : C.red;
const gradeColor = g => ({ A: C.green, B: "#22D3EE", C: C.amber, D: C.amber, F: C.red }[g] || C.muted);

const issueColors = { error: C.red, warning: C.amber, suggestion: C.green, ok: C.green };
const issueIcons  = { error: "✕", warning: "!", suggestion: "→", ok: "✓" };

// ─── Shared components ──────────────────────────────────────────────────────
function ScoreDonut({ score, size = 72, stroke = 6, label, grade }) {
  const col = scoreColor(score || 0);
  const r   = (size - stroke) / 2;
  const c   = size / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - ((score || 0) / 100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)", position:"absolute" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={C.surface2} strokeWidth={stroke}/>
        <circle cx={c} cy={c} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize: size > 80 ? 20 : 14, fontWeight:800, color:col, lineHeight:1, fontFamily:"'Sora',sans-serif" }}>{score||0}</span>
        {grade && <span style={{ fontSize:10, fontWeight:700, color:col, lineHeight:1, marginTop:1 }}>{grade}</span>}
      </div>
    </div>
  );
}

function StatBar({ label, value, showVal = true }) {
  const col = scoreColor(value || 0);
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <span style={{ fontSize:12, color:C.muted2, fontWeight:500 }}>{label}</span>
        {showVal && <span style={{ fontSize:12, fontWeight:700, color:col }}>{value||0}</span>}
      </div>
      <div style={{ background:C.surface2, borderRadius:99, height:5, overflow:"hidden" }}>
        <div style={{ width:`${value||0}%`, height:"100%", background:`linear-gradient(90deg,${col}99,${col})`, borderRadius:99, transition:"width 1s ease" }}/>
      </div>
    </div>
  );
}

function Pill({ label, color = C.blue }) {
  return (
    <span style={{ fontSize:11, fontWeight:600, color, background:`${color}18`, border:`1px solid ${color}33`, padding:"2px 10px", borderRadius:99, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function SectionCard({ title, icon, children, accent = C.blue }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, marginBottom:12, overflow:"hidden" }}>
      <div onClick={() => setOpen(o=>!o)} style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", borderBottom: open ? `1px solid ${C.border}` : "none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:`${accent}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>{icon}</div>
          <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{title}</span>
        </div>
        <span style={{ color:C.muted, fontSize:11, transition:"transform .2s", display:"inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </div>
      {open && <div style={{ padding:"16px 20px" }}>{children}</div>}
    </div>
  );
}

function IssueRow({ issue }) {
  const col = issueColors[issue.type] || C.muted;
  return (
    <div style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
      <div style={{ width:22, height:22, borderRadius:6, background:`${col}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
        <span style={{ fontSize:11, fontWeight:800, color:col }}>{issueIcons[issue.type]}</span>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:3 }}>{issue.title}</div>
        <div style={{ fontSize:12, color:C.muted2, lineHeight:1.65 }}>{issue.detail}</div>
      </div>
    </div>
  );
}

function QuickWinList({ wins, accent }) {
  return (
    <div style={{ background:C.surface2, borderRadius:10, padding:"14px 16px", marginTop:14 }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>Quick Wins</div>
      {wins?.map((w,i) => (
        <div key={i} style={{ display:"flex", gap:10, marginBottom:8, fontSize:12, color:C.muted2, lineHeight:1.6 }}>
          <span style={{ color:accent||C.blue, fontWeight:800, minWidth:14, flexShrink:0 }}>{i+1}.</span>{w}
        </div>
      ))}
    </div>
  );
}

// ─── Score Summary Bar ──────────────────────────────────────────────────────
function ScoreSummaryCard({ result }) {
  const col = scoreColor(result.overallScore);
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"24px 28px", marginBottom:20 }}>
      <div style={{ display:"flex", gap:24, alignItems:"center", flexWrap:"wrap" }}>
        {/* Overall */}
        <div style={{ display:"flex", alignItems:"center", gap:18, paddingRight:24, borderRight:`1px solid ${C.border}` }}>
          <ScoreDonut score={result.overallScore} size={88} stroke={7}/>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:4 }}>Overall Score</div>
            <div style={{ fontSize:20, fontWeight:800, color:C.text, lineHeight:1.2, marginBottom:6 }}>
              {result.overallScore>=80?"Strong Content":result.overallScore>=60?"Good Foundation":result.overallScore>=40?"Needs Work":"Major Revision Needed"}
            </div>
            <div style={{ fontSize:12, color:C.muted2, lineHeight:1.5, maxWidth:240 }}>{result.contentSummary}</div>
          </div>
        </div>
        {/* Three scores */}
        <div style={{ display:"flex", gap:20, flex:1, flexWrap:"wrap" }}>
          {[
            { label:"SEO", score:result.seo?.score, grade:result.seo?.grade, icon:"⬡", col:"#22D3EE" },
            { label:"AEO", score:result.aeo?.score, grade:result.aeo?.grade, icon:"◎", col:"#A78BFA" },
            { label:"LLM", score:result.llmCitation?.score, grade:result.llmCitation?.grade, icon:"◈", col:"#FB923C" },
          ].map(item => (
            <div key={item.label} style={{ flex:1, minWidth:110, background:C.surface2, borderRadius:12, padding:"16px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, border:`1px solid ${C.border}` }}>
              <ScoreDonut score={item.score||0} size={64} stroke={5} grade={item.grade}/>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1.5 }}>{item.icon} {item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Strategies strip */}
      {result.strategiesUsed?.length > 0 && (
        <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>🔍 Live strategies applied</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {result.strategiesUsed.map((s,i) => <Pill key={i} label={s} color={C.muted}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nav tabs ───────────────────────────────────────────────────────────────
const NAV = [
  { key:"overview", label:"Overview",    icon:"▦" },
  { key:"seo",      label:"SEO",         icon:"⬡" },
  { key:"aeo",      label:"AEO",         icon:"◎" },
  { key:"llm",      label:"LLM Citation",icon:"◈" },
  { key:"rewrite",  label:"Rewrite",     icon:"✦" },
  { key:"actions",  label:"Actions",     icon:"⚡" },
  { key:"history",  label:"History",     icon:"🕐" },
];

function NavBar({ tab, setTab, historyCount }) {
  return (
    <div style={{ display:"flex", gap:2, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:4, marginBottom:20, overflowX:"auto" }}>
      {NAV.map(n => {
        const active = tab === n.key;
        return (
          <button key={n.key} onClick={() => setTab(n.key)}
            style={{ background: active ? C.surface2 : "none", border: active ? `1px solid ${C.border2}` : "1px solid transparent", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight: active ? 700 : 500, color: active ? C.text : C.muted, whiteSpace:"nowrap", transition:"all .15s", display:"flex", alignItems:"center", gap:6 }}>
            <span>{n.icon}</span>
            <span>{n.key === "history" ? `${n.label} (${historyCount})` : n.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Tabs content ───────────────────────────────────────────────────────────
function OverviewTab({ result }) {
  const metrics = [
    { label:"Answer-First Score",      val:result.aeo?.answerFirstScore },
    { label:"RAG Survivability",       val:result.llmCitation?.ragSurvivability?.score },
    { label:"Token Efficiency",        val:result.llmCitation?.tokenEfficiency?.score },
    { label:"Zero-Click Optimisation", val:result.aeo?.zeroClickOptimization },
    { label:"Schema Readiness",        val:result.aeo?.schemaReadiness },
    { label:"Agentic Discoverability", val:result.llmCitation?.agenticDiscoverability?.score },
    { label:"Entity Clarity",          val:result.aeo?.entityClarity },
    { label:"Featured Snippet",        val:result.aeo?.featuredSnippetReadiness },
  ];
  return (
    <div>
      {/* Metric grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {metrics.map(m => {
          const col = scoreColor(m.val||0);
          return (
            <div key={m.label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8, fontWeight:500 }}>{m.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:col, fontFamily:"'Sora',sans-serif", marginBottom:6 }}>{m.val||0}</div>
              <div style={{ background:C.surface2, borderRadius:99, height:4 }}>
                <div style={{ width:`${m.val||0}%`, height:"100%", background:col, borderRadius:99, transition:"width 1s ease" }}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority actions */}
      {result.priorityActions && (
        <SectionCard title="Priority Action Plan" icon="⚡" accent={C.amber}>
          {result.priorityActions.map(a => {
            const impactCol = a.impact==="high" ? C.red : a.impact==="medium" ? C.amber : C.green;
            const catCol    = a.category==="SEO" ? "#22D3EE" : a.category==="AEO" ? "#A78BFA" : "#FB923C";
            return (
              <div key={a.priority} style={{ display:"flex", gap:14, padding:"12px 0", borderBottom:`1px solid ${C.border}`, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:C.surface2, border:`1px solid ${C.border2}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:C.blue, flexShrink:0 }}>{a.priority}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                    <Pill label={a.category} color={catCol}/>
                    <Pill label={`Impact: ${a.impact}`} color={impactCol}/>
                    <Pill label={`Effort: ${a.effort}`} color={C.muted}/>
                  </div>
                  <div style={{ fontSize:13, color:C.muted2, lineHeight:1.65 }}>{a.action}</div>
                </div>
              </div>
            );
          })}
        </SectionCard>
      )}
    </div>
  );
}

function SeoTab({ seo }) {
  return (
    <div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", marginBottom:12 }}>
        <p style={{ fontSize:13, color:C.muted2, lineHeight:1.7, borderLeft:`3px solid #22D3EE`, paddingLeft:14 }}>{seo.summary}</p>
      </div>

      {/* E-E-A-T */}
      {seo.eeat && (
        <SectionCard title="E-E-A-T Signals" icon="🏅" accent="#22D3EE">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:14 }}>
            {["experience","expertise","authoritativeness","trustworthiness"].map(k => (
              <StatBar key={k} label={k.charAt(0).toUpperCase()+k.slice(1)} value={seo.eeat[k]}/>
            ))}
          </div>
          <div style={{ background:C.surface2, borderRadius:8, padding:"10px 14px", fontSize:12, color:C.muted2, lineHeight:1.65 }}>{seo.eeat.notes}</div>
        </SectionCard>
      )}

      {/* Keywords */}
      {seo.keywords && (
        <SectionCard title="Keywords & Semantic Gaps" icon="⬡" accent="#22D3EE">
          {[["Primary Keywords", seo.keywords.primary, C.green],["Missing Keywords", seo.keywords.missing, C.red],["Topic Cluster Gaps", seo.keywords.semanticGaps, C.amber]].map(([label,arr,col]) => (
            <div key={label} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1.2, marginBottom:8 }}>{label}</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {arr?.map(k => <Pill key={k} label={k} color={col}/>)}
              </div>
            </div>
          ))}
          <div style={{ fontSize:12, color:C.muted }}>Keyword density: <span style={{ color:C.amber, fontWeight:700 }}>{seo.keywords.density}</span></div>
        </SectionCard>
      )}

      {/* Technical */}
      {seo.technicalSignals && (
        <SectionCard title="Technical Signals" icon="⚙" accent="#22D3EE">
          {seo.technicalSignals.map((s,i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ color:issueColors[s.type], fontSize:12, marginTop:2, minWidth:12, fontWeight:800 }}>{issueIcons[s.type]}</span>
              <div><div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:2 }}>{s.signal}</div>
                <div style={{ fontSize:12, color:C.muted2, lineHeight:1.6 }}>{s.detail}</div></div>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Issues & Recommendations" icon="⚠" accent={C.amber}>
        {seo.issues?.map((issue,i) => <IssueRow key={i} issue={issue}/>)}
        <QuickWinList wins={seo.quickWins} accent="#22D3EE"/>
      </SectionCard>
    </div>
  );
}

function AeoTab({ aeo }) {
  return (
    <div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", marginBottom:12 }}>
        <p style={{ fontSize:13, color:C.muted2, lineHeight:1.7, borderLeft:`3px solid #A78BFA`, paddingLeft:14 }}>{aeo.summary}</p>
      </div>

      {/* AEO metric grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
        {[["Answer-First",aeo.answerFirstScore],["Featured Snippet",aeo.featuredSnippetReadiness],["Voice Search",aeo.voiceSearchScore],["Zero-Click",aeo.zeroClickOptimization],["Schema Readiness",aeo.schemaReadiness],["Entity Clarity",aeo.entityClarity]].map(([l,v])=>{
          const col=scoreColor(v||0);
          return (
            <div key={l} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontSize:11, color:C.muted, marginBottom:8, fontWeight:500 }}>{l}</div>
              <div style={{ fontSize:20, fontWeight:800, color:col, fontFamily:"'Sora',sans-serif", marginBottom:6 }}>{v||0}</div>
              <div style={{ background:C.surface2, borderRadius:99, height:4 }}>
                <div style={{ width:`${v||0}%`, height:"100%", background:col, borderRadius:99 }}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Answer-first audit */}
      {aeo.answerFirstAudit && (
        <SectionCard title="Answer-First Audit" icon="◎" accent="#A78BFA">
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <Pill label={aeo.answerFirstAudit.hasDirectOpeningAnswer ? "✓ Has Direct Opening Answer" : "✕ No Direct Opening Answer"} color={aeo.answerFirstAudit.hasDirectOpeningAnswer ? C.green : C.red}/>
          </div>
          <div style={{ background:C.surface2, borderRadius:8, padding:"12px 14px", fontSize:12, color:C.muted, fontStyle:"italic", lineHeight:1.7, marginBottom:10 }}>"{aeo.answerFirstAudit.openingTokens}"</div>
          <div style={{ fontSize:12, color:C.muted2, lineHeight:1.65 }}>{aeo.answerFirstAudit.verdict}</div>
        </SectionCard>
      )}

      {/* Platform scores */}
      {aeo.platforms && (
        <SectionCard title="Multi-Platform Visibility" icon="🌐" accent="#A78BFA">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {Object.entries(aeo.platforms).map(([k,v])=>{
              const labels={googleAIOverviews:"Google AI Overviews",chatGPTSearch:"ChatGPT Search",perplexity:"Perplexity",bingCopilot:"Bing Copilot"};
              const icons={googleAIOverviews:"G",chatGPTSearch:"C",perplexity:"P",bingCopilot:"B"};
              const col=scoreColor(v.score);
              return (
                <div key={k} style={{ background:C.surface2, borderRadius:10, padding:"14px 16px", border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:C.muted2 }}>{icons[k]} {labels[k]}</span>
                    <span style={{ fontSize:16, fontWeight:800, color:col, fontFamily:"'Sora',sans-serif" }}>{v.score}</span>
                  </div>
                  <div style={{ background:C.surface, borderRadius:99, height:4, marginBottom:8 }}>
                    <div style={{ width:`${v.score}%`, height:"100%", background:col, borderRadius:99 }}/>
                  </div>
                  <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{v.note}</div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Questions */}
      <SectionCard title="Question Coverage" icon="❓" accent="#A78BFA">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.green, textTransform:"uppercase", letterSpacing:1.2, marginBottom:10 }}>Covered</div>
            {aeo.questionsCovered?.map(q=><div key={q} style={{ fontSize:12, color:C.muted2, padding:"5px 0", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8 }}><span style={{ color:C.green }}>✓</span>{q}</div>)}
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:1.2, marginBottom:10 }}>Missing</div>
            {aeo.questionsMissing?.map(q=><div key={q} style={{ fontSize:12, color:C.muted2, padding:"5px 0", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8 }}><span style={{ color:C.red }}>✕</span>{q}</div>)}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Issues & Recommendations" icon="⚠" accent={C.amber}>
        {aeo.issues?.map((issue,i)=><IssueRow key={i} issue={issue}/>)}
        <QuickWinList wins={aeo.quickWins} accent="#A78BFA"/>
      </SectionCard>
    </div>
  );
}

function LlmTab({ llm }) {
  return (
    <div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", marginBottom:12 }}>
        <p style={{ fontSize:13, color:C.muted2, lineHeight:1.7, borderLeft:`3px solid #FB923C`, paddingLeft:14 }}>{llm.summary}</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        {/* RAG */}
        {llm.ragSurvivability && (
          <SectionCard title="RAG Survivability" icon="◈" accent="#FB923C">
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <Pill label={`Chunking Risk: ${llm.ragSurvivability.chunkingRisk}`} color={llm.ragSurvivability.chunkingRisk==="low"?C.green:llm.ragSurvivability.chunkingRisk==="medium"?C.amber:C.red}/>
            </div>
            <StatBar label="Embedding Clarity" value={llm.ragSurvivability.embeddingClarity}/>
            <StatBar label="Semantic Coherence" value={llm.ragSurvivability.semanticCoherence}/>
            <div style={{ fontSize:12, color:C.muted2, lineHeight:1.65, marginTop:10 }}>{llm.ragSurvivability.note}</div>
          </SectionCard>
        )}
        {/* Token efficiency */}
        {llm.tokenEfficiency && (
          <SectionCard title="Token Efficiency" icon="⚡" accent="#FB923C">
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <Pill label={`Bloat Risk: ${llm.tokenEfficiency.bloatRisk}`} color={llm.tokenEfficiency.bloatRisk==="low"?C.green:llm.tokenEfficiency.bloatRisk==="medium"?C.amber:C.red}/>
            </div>
            <StatBar label="Front-Load Score" value={llm.tokenEfficiency.frontLoadScore}/>
            <StatBar label="Overall Efficiency" value={llm.tokenEfficiency.score}/>
            <div style={{ fontSize:12, color:C.muted2, lineHeight:1.65, marginTop:10 }}>{llm.tokenEfficiency.note}</div>
          </SectionCard>
        )}
      </div>

      {/* Citability */}
      <SectionCard title="Citability Factors" icon="📊" accent="#FB923C">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" }}>
          {Object.entries(llm.citabilityFactors||{}).map(([k,v])=>(
            <StatBar key={k} label={k.replace(/([A-Z])/g," $1").trim()} value={v}/>
          ))}
        </div>
      </SectionCard>

      {/* Citable statements */}
      {llm.suggestedCitableStatements && (
        <SectionCard title="Suggested Citable Statements" icon="💬" accent="#FB923C">
          {llm.suggestedCitableStatements.map((s,i)=>(
            <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ fontSize:13, color:C.text, lineHeight:1.7, fontStyle:"italic", marginBottom:8 }}>"{s.statement}"</div>
              <div style={{ fontSize:11, color:"#FB923C", fontWeight:600 }}>→ {s.why}</div>
            </div>
          ))}
        </SectionCard>
      )}

      {/* Agentic */}
      {llm.agenticDiscoverability && (
        <SectionCard title="Agentic Discoverability" icon="🤖" accent="#FB923C">
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
            <Pill label={llm.agenticDiscoverability.cleanSemanticStructure?"✓ Clean Semantic Structure":"✕ Needs Semantic Cleanup"} color={llm.agenticDiscoverability.cleanSemanticStructure?C.green:C.red}/>
            <Pill label={llm.agenticDiscoverability.machineReadableSignals?"✓ Machine-Readable":"✕ Not Machine-Readable"} color={llm.agenticDiscoverability.machineReadableSignals?C.green:C.red}/>
          </div>
          <StatBar label="Discovery Score" value={llm.agenticDiscoverability.score}/>
          <div style={{ fontSize:12, color:C.muted2, lineHeight:1.65, marginTop:10 }}>{llm.agenticDiscoverability.note}</div>
        </SectionCard>
      )}

      <SectionCard title="Issues & Recommendations" icon="⚠" accent={C.amber}>
        {llm.issues?.map((issue,i)=><IssueRow key={i} issue={issue}/>)}
        <QuickWinList wins={llm.quickWins} accent="#FB923C"/>
      </SectionCard>
    </div>
  );
}

function RewriteTab({ rw }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(rw.rewritten); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  return (
    <div>
      <SectionCard title="Original Opening" icon="📄" accent={C.red}>
        <div style={{ fontSize:13, color:C.muted2, lineHeight:1.8, borderLeft:`3px solid ${C.red}55`, paddingLeft:14, fontStyle:"italic" }}>{rw.original}</div>
      </SectionCard>
      <SectionCard title="Optimised Rewrite" icon="✦" accent={C.green}>
        <div style={{ fontSize:14, color:C.text, lineHeight:1.85, borderLeft:`3px solid ${C.green}55`, paddingLeft:14, marginBottom:16 }}>{rw.rewritten}</div>
        <button onClick={copy} style={{ background: copied?`${C.green}20`:C.surface2, color: copied?C.green:C.muted2, border:`1px solid ${copied?C.green:C.border2}`, borderRadius:8, padding:"8px 18px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .2s" }}>
          {copied ? "✓ Copied to clipboard!" : "Copy rewrite"}
        </button>
      </SectionCard>
      <SectionCard title="What Was Improved" icon="⬆" accent={C.blue}>
        {rw.whatsImproved?.map((w,i)=>(
          <div key={i} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}`, fontSize:13, color:C.muted2, lineHeight:1.65 }}>
            <div style={{ width:22, height:22, borderRadius:6, background:`${C.green}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:11, fontWeight:800, color:C.green }}>{i+1}</span>
            </div>
            {w}
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

function HistoryTab({ history, onLoad, onDelete, onClearAll }) {
  if (history.length === 0) return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🕐</div>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>No history yet</div>
      <div style={{ fontSize:13, color:C.muted }}>Run your first audit to start building your optimisation history</div>
    </div>
  );
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.text }}>Analysis History</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{history.length} saved · stored in your browser</div>
        </div>
        <button onClick={onClearAll} style={{ background:`${C.red}15`, color:C.red, border:`1px solid ${C.red}30`, borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Clear All</button>
      </div>
      {history.map(item => {
        const col = scoreColor(item.overallScore);
        const d   = new Date(item.savedAt);
        return (
          <div key={item.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", marginBottom:10, transition:"border-color .2s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ flex:1, marginRight:16 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4, lineHeight:1.5 }}>{item.contentSummary||"Content analysis"}</div>
                <div style={{ fontSize:11, color:C.muted }}>{d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})} · {d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:28, fontWeight:800, color:col, fontFamily:"'Sora',sans-serif", lineHeight:1 }}>{item.overallScore}</div>
                <div style={{ fontSize:10, color:C.muted }}>/ 100</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {[["SEO",item.seoScore,item.seoGrade,"#22D3EE"],["AEO",item.aeoScore,item.aeoGrade,"#A78BFA"],["LLM",item.llmScore,item.llmGrade,"#FB923C"]].map(([l,s,g,c])=>(
                <div key={l} style={{ background:`${c}15`, border:`1px solid ${c}30`, borderRadius:8, padding:"4px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:c, fontWeight:700 }}>{l}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:c, fontFamily:"'Sora',sans-serif" }}>{g}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>onLoad(item)} style={{ background:C.blue, color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Load Analysis</button>
              <button onClick={()=>onDelete(item.id)} style={{ background:"none", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 16px", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
            </div>
          </div>
        );
      })}
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
      const res = await fetch("/api/generate", {
        method:"POST",
        headers:{ "Content-Type":"application/json","x-app-password":pw,"x-usage-date":today(),"x-usage-count":"0" },
        body: JSON.stringify({ model:"gemini", max_tokens:10, messages:[{role:"user",content:"hi"}] }),
      });
      const data = await res.json();
      if (res.status===401||data.error==="incorrect_password") {
        setError("Incorrect password. Please try again.");
      } else {
        localStorage.setItem(AUTH_KEY, btoa(pw));
        onSuccess(pw);
      }
    } catch { setError("Connection error — please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Plus Jakarta Sans','Helvetica Neue',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .pw-input:focus{outline:none!important;border-color:${C.blue}!important;box-shadow:0 0 0 3px ${C.blue}25!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        .fade{animation:fadeUp .5s ease}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .7s linear infinite}
      `}</style>
      <div className="fade" style={{ width:"100%", maxWidth:420, textAlign:"center" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${C.blue},${C.indigo})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, margin:"0 auto 18px", boxShadow:`0 8px 32px ${C.blue}40` }}>◈</div>
        <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:24, color:C.text, marginBottom:4 }}>ContentIQ</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:32, letterSpacing:2, textTransform:"uppercase" }}>SEO · AEO · LLM Optimizer</div>

        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"28px 24px" }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>Welcome back</div>
          <div style={{ fontSize:13, color:C.muted, marginBottom:22, lineHeight:1.6 }}>Enter your access password to continue</div>

          <div style={{ position:"relative", marginBottom:14 }}>
            <input className="pw-input" type={show?"text":"password"} value={pw}
              onChange={e=>{setPw(e.target.value);setError("");}}
              onKeyDown={e=>e.key==="Enter"&&attempt()}
              placeholder="Enter password"
              style={{ width:"100%", background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:10, padding:"12px 44px 12px 16px", fontSize:14, color:C.text, fontFamily:"inherit", transition:"all .2s" }}
            />
            <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:15 }}>
              {show?"🙈":"👁"}
            </button>
          </div>

          {error && (
            <div style={{ background:`${C.red}15`, border:`1px solid ${C.red}30`, borderRadius:8, padding:"10px 14px", fontSize:12, color:C.red, marginBottom:14, textAlign:"left" }}>{error}</div>
          )}

          <button onClick={attempt} disabled={!pw.trim()||loading}
            style={{ width:"100%", background:pw.trim()&&!loading?`linear-gradient(135deg,${C.blue},${C.indigo})`:`${C.surface2}`, color:pw.trim()&&!loading?"#fff":C.muted, border:"none", borderRadius:10, padding:"13px", fontSize:14, fontWeight:700, cursor:pw.trim()&&!loading?"pointer":"not-allowed", fontFamily:"inherit", transition:"all .2s", boxShadow:pw.trim()&&!loading?`0 4px 20px ${C.blue}40`:"none" }}>
            {loading ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}><span className="spin" style={{ width:14, height:14, border:`2px solid #ffffff40`, borderTopColor:"#fff", borderRadius:"50%", display:"inline-block" }}/>Verifying...</span> : "Sign In →"}
          </button>
        </div>
        <div style={{ fontSize:11, color:C.border2, marginTop:18 }}>Powered by Google Gemini · Always-current strategies</div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
function MainApp({ password }) {
  const [content, setContent] = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus]   = useState("");
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState("overview");
  const [history, setHistory] = useState([]);
  const [usage, setUsage]     = useState(getUsage);

  useEffect(() => {
    const keys  = Object.keys(localStorage).filter(k=>k.startsWith("analysis:"));
    const items = keys.map(k=>{try{return JSON.parse(localStorage.getItem(k));}catch{return null;}}).filter(Boolean);
    items.sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt));
    setHistory(items);
  }, []);

  const saveToHistory = (r, c) => {
    const id   = `analysis:${Date.now()}`;
    const item = { id, savedAt:new Date().toISOString(), overallScore:r.overallScore, contentSummary:r.contentSummary, seoScore:r.seo?.score, seoGrade:r.seo?.grade, aeoScore:r.aeo?.score, aeoGrade:r.aeo?.grade, llmScore:r.llmCitation?.score, llmGrade:r.llmCitation?.grade, strategiesUsed:r.strategiesUsed, contentSnippet:c.slice(0,300), fullResult:r };
    localStorage.setItem(id, JSON.stringify(item));
    setHistory(prev=>[item,...prev]);
  };

  const deleteHistory = id => { localStorage.removeItem(id); setHistory(prev=>prev.filter(i=>i.id!==id)); };
  const clearAll = () => { history.forEach(i=>localStorage.removeItem(i.id)); setHistory([]); };
  const loadHistory = item => { setResult(item.fullResult); setContent(item.contentSnippet||""); setTab("overview"); };
  const logout = () => { localStorage.removeItem(AUTH_KEY); window.location.reload(); };

  const analyze = async () => {
    if (!content.trim()) return;
    const cur = getUsage();
    if (cur.count >= DAILY_LIMIT) { setError(`Daily limit of ${DAILY_LIMIT} reached. Resets at midnight.`); return; }
    setLoading(true); setError(null); setResult(null);
    setStatus("Searching latest SEO/AEO/GEO strategies...");
    try {
      const res = await fetch("/api/generate", {
        method:"POST",
        headers:{ "Content-Type":"application/json","x-app-password":password,"x-usage-date":today(),"x-usage-count":String(cur.count) },
        body: JSON.stringify({
          model:"gemini-2.5-flash",
          max_tokens:8192,
          system:SYSTEM_PROMPT,
          messages:[{role:"user",content:`Analyse this content for SEO, AEO, GEO and LLM citation optimisation. Return only valid JSON:\n\n${content}`}],
        }),
      });
      setStatus("Applying live strategies to your content...");
      const data = await res.json();
      if (res.status===429||data.error==="daily_limit_reached") { setError(data.message||"Daily limit reached."); setLoading(false); setStatus(""); return; }
      if (res.status===401) { setError("Session expired — please sign out and sign in again."); setLoading(false); setStatus(""); return; }
      const raw   = (data.content||[]).filter(c=>c.type==="text").map(c=>c.text||"").join("");
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      const parsed = JSON.parse(match[0]);
      const newUsage = incrementUsage();
      setUsage(newUsage);
      setResult(parsed);
      setTab("overview");
      saveToHistory(parsed, content);
    } catch(e) { setError("Analysis failed — " + e.message); }
    setLoading(false); setStatus("");
  };

  const limitReached = usage.count >= DAILY_LIMIT;
  const pct = Math.min((usage.count/DAILY_LIMIT)*100, 100);
  const usageCol = usage.count/DAILY_LIMIT < 0.6 ? C.green : usage.count/DAILY_LIMIT < 0.85 ? C.amber : C.red;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Plus Jakarta Sans','Helvetica Neue',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:${C.surface}}::-webkit-scrollbar-thumb{background:${C.border2};border-radius:4px}
        textarea:focus{outline:none!important;border-color:${C.blue}!important;box-shadow:0 0 0 3px ${C.blue}20!important}
        .fade{animation:fadeUp .3s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:${C.blue};animation:blink 1.2s infinite}
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        @keyframes blink{0%,100%{opacity:.15}50%{opacity:1}}
        .run-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px ${C.blue}50!important}
        .run-btn{transition:all .2s}
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${C.blue},${C.indigo})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, boxShadow:`0 2px 10px ${C.blue}40` }}>◈</div>
          <div>
            <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:C.text }}>ContentIQ</span>
            <span style={{ fontSize:10, color:C.muted, marginLeft:8, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:4, padding:"1px 6px", fontWeight:600 }}>v3</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* Usage */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:120, background:C.surface2, borderRadius:99, height:5 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:usageCol, borderRadius:99, transition:"width .6s" }}/>
            </div>
            <span style={{ fontSize:12, color:usageCol, fontWeight:700, whiteSpace:"nowrap" }}>{usage.count}/{DAILY_LIMIT}</span>
          </div>
          <button onClick={logout} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 12px", fontSize:12, color:C.muted, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:"0 auto", padding:"32px 24px" }}>

        {/* Input section */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:26, fontWeight:800, color:C.text, marginBottom:6, letterSpacing:-.5 }}>AI Content Audit</h1>
          <p style={{ fontSize:13, color:C.muted, marginBottom:20, lineHeight:1.7 }}>Searches live for the latest SEO, AEO, and GEO best practices before every audit. Scores and history saved automatically.</p>

          {limitReached && (
            <div style={{ background:`${C.amber}15`, border:`1px solid ${C.amber}30`, borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13, color:C.amber, display:"flex", alignItems:"center", gap:10 }}>
              <span>⚠</span> Daily limit reached — resets at midnight.
            </div>
          )}

          <div style={{ position:"relative" }}>
            <textarea value={content} onChange={e=>setContent(e.target.value)}
              placeholder="Paste your content here — blog posts, landing pages, articles, product descriptions..."
              rows={9} disabled={limitReached}
              style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 20px", fontSize:13, color:limitReached?C.muted:C.text, lineHeight:1.8, fontFamily:"inherit", transition:"all .2s", cursor:limitReached?"not-allowed":"text", resize:"none" }}
            />
            <div style={{ position:"absolute", bottom:14, right:16, fontSize:11, color:C.border2, fontWeight:600 }}>
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          <div style={{ marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:12, color:C.muted }}>{history.length>0 && `${history.length} analysis${history.length>1?"es":""} in history`}</div>
            <button onClick={analyze} disabled={!content.trim()||loading||limitReached} className="run-btn"
              style={{ background:content.trim()&&!loading&&!limitReached?`linear-gradient(135deg,${C.blue},${C.indigo})`:C.surface2, color:content.trim()&&!loading&&!limitReached?"#fff":C.muted, border:"none", borderRadius:10, padding:"12px 28px", fontSize:13, fontWeight:700, cursor:content.trim()&&!loading&&!limitReached?"pointer":"not-allowed", fontFamily:"inherit", boxShadow:content.trim()&&!loading&&!limitReached?`0 4px 20px ${C.blue}40`:"none" }}>
              {loading ? "Analysing..." : "Run Live Audit →"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:"48px 32px", textAlign:"center", marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:18 }}>
              <span className="dot"/><span className="dot"/><span className="dot"/>
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>{status}</div>
            <div style={{ fontSize:12, color:C.muted }}>Fetching latest strategies · Scoring your content · Building recommendations</div>
          </div>
        )}

        {error && (
          <div style={{ background:`${C.red}15`, border:`1px solid ${C.red}30`, borderRadius:10, padding:"14px 18px", color:C.red, fontSize:13, marginBottom:20 }}>{error}</div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="fade">
            <ScoreSummaryCard result={result}/>
            <NavBar tab={tab} setTab={setTab} historyCount={history.length}/>

            {tab==="overview" && <OverviewTab result={result}/>}
            {tab==="seo"      && result.seo && <SeoTab seo={result.seo}/>}
            {tab==="aeo"      && result.aeo && <AeoTab aeo={result.aeo}/>}
            {tab==="llm"      && result.llmCitation && <LlmTab llm={result.llmCitation}/>}
            {tab==="rewrite"  && result.rewriteSuggestion && <RewriteTab rw={result.rewriteSuggestion}/>}
            {tab==="actions"  && result.priorityActions && (
              <SectionCard title="Priority Action Plan" icon="⚡" accent={C.amber}>
                {result.priorityActions.map(a=>{
                  const impactCol=a.impact==="high"?C.red:a.impact==="medium"?C.amber:C.green;
                  const catCol=a.category==="SEO"?"#22D3EE":a.category==="AEO"?"#A78BFA":"#FB923C";
                  return (
                    <div key={a.priority} style={{ display:"flex", gap:14, padding:"14px 0", borderBottom:`1px solid ${C.border}`, alignItems:"flex-start" }}>
                      <div style={{ width:30, height:30, borderRadius:8, background:C.surface2, border:`1px solid ${C.border2}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:C.blue, flexShrink:0 }}>{a.priority}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                          <Pill label={a.category} color={catCol}/>
                          <Pill label={`Impact: ${a.impact}`} color={impactCol}/>
                          <Pill label={`Effort: ${a.effort}`} color={C.muted}/>
                        </div>
                        <div style={{ fontSize:13, color:C.muted2, lineHeight:1.65 }}>{a.action}</div>
                      </div>
                    </div>
                  );
                })}
              </SectionCard>
            )}
            {tab==="history" && <HistoryTab history={history} onLoad={loadHistory} onDelete={deleteHistory} onClearAll={clearAll}/>}
          </div>
        )}

        {/* History accessible before first result */}
        {!result && !loading && tab==="history" && (
          <div className="fade">
            <HistoryTab history={history} onLoad={item=>{setResult(item.fullResult);setContent(item.contentSnippet||"");setTab("overview");}} onDelete={deleteHistory} onClearAll={clearAll}/>
          </div>
        )}

        {!result && !loading && tab!=="history" && history.length > 0 && (
          <div style={{ textAlign:"center", marginTop:8 }}>
            <button onClick={()=>setTab("history")} style={{ background:"none", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 18px", fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
              🕐 View History ({history.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  const [password, setPassword] = useState(() => {
    try { const s = localStorage.getItem(AUTH_KEY); return s ? atob(s) : null; } catch { return null; }
  });
  if (!password) return <PasswordGate onSuccess={pw=>setPassword(pw)}/>;
  return <MainApp password={password}/>;
}
