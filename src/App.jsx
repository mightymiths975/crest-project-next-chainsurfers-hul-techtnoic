import React, { useState, useEffect, useRef } from "react";
import {
  Activity, Compass, PenTool, Globe, Shield, UserCheck, Send,
  Zap, Lock, TrendingUp, Check, AlertTriangle, RefreshCw, Play,
  ChevronRight, Radio, Clock, Sparkles,
} from "lucide-react";

/* ---------------- palette (inline styles; artifact has no Tailwind compiler) ---------------- */
const C = {
  bg: "#0A0E2A", bg2: "#0B1030", cyan: "#2FE0E6", mg: "#FF3D77", pu: "#A855F7",
  gr: "#34D399", amber: "#FFB020", card: "#141C42", cardB: "#2B3670",
  accent: "#1B245A", body: "#D8DEF7", mute: "#97A1D0", faint: "#5A6499",
};
const mono = "'SFMono-Regular',Consolas,'Liberation Mono',monospace";
const display = "'Arial Black','Helvetica Neue',Arial,sans-serif";

/* ---------------- Rexona brand constitution (the moat, made visible) ---------------- */
const BRAND = {
  name: "Rexona",
  positioning: "Confidence and protection that perform under pressure.",
  tagline: "It won't let you down",
  tone: ["Confident", "Energetic", "Human", "Never arrogant"],
  dos: ["Real high-pressure moments", "Movement & resilience", "Everyday heroes", "Inclusive across markets"],
  donts: ["No efficacy / medical claims", "Don't mock competitors", "No unlicensed event marks or footage", "No body-shaming"],
};

/* ---------------- pre-seeded cultural signals ---------------- */
const SIGNALS = [
  {
    id: "rexona", hero: true, match: "HIGH",
    title: "Rexona logo on the fourth official's armband — the meme of the match",
    text: "Deep into stoppage time, cameras catch a Rexona logo tucked under the fourth official's arm as he lifts the board for six added minutes. Fans freeze-frame it and turn it into the meme of the match.",
    velocity: 98, sentiment: 82, reach: "12.4M", tags: ["#football", "stoppage-time", "unscripted"],
  },
  {
    id: "heatwave", match: "MED",
    title: "'Commute sweat' heatwave complaints spike across metros",
    text: "A record heatwave drives a surge of posts about unbearable commute sweat and staying fresh at work.",
    velocity: 71, sentiment: 44, reach: "5.1M", tags: ["#heatwave", "commute", "freshness"],
  },
  {
    id: "gymtok", match: "MED",
    title: "'Last-rep face' gym clips trending on short video",
    text: "A viral format shows athletes' faces on their final, hardest rep — pure effort under pressure.",
    velocity: 64, sentiment: 69, reach: "8.9M", tags: ["#gymtok", "effort", "sport"],
  },
];

/* ---------------- demo-safe seeded agent outputs (Rexona path) ---------------- */
const SEED = {
  compass: {
    relevance: 94, verdict: "HIGH — on-brand match",
    angle: "Own the highest-pressure seat in the stadium: the one official who cannot let the game down, wearing the brand that won't let you down.",
    why: "It turns an unscripted, high-sweat, high-stakes moment into living proof of 'It won't let you down' — the brand serves the moment instead of interrupting it.",
  },
  forge: {
    concept: "Stoppage-Time Hero",
    headline: "When the pressure peaks, it won't let you down.",
    subline: "Six added minutes at the final. Every camera on one arm — and it holds.",
    hashtag: "#ItWontLetYouDown",
  },
  atlas: {
    markets: [
      { code: "IN", name: "India", lang: "Hinglish", headline: "Jab pressure sabse zyada ho — ye kabhi saath nahi chhodta.", subline: "Stoppage time. Poore match ki nazar, ek hi baazu par.", hashtag: "#KabhiNahiChhodega", note: "Hinglish for everyday relatability; energy carried over literal translation." },
      { code: "BR", name: "Brazil", lang: "pt-BR", headline: "Quando a pressão aperta, ele não te deixa na mão.", subline: "Nos acréscimos, todos os olhos em um só braço — e ele segura.", hashtag: "#NãoTeDeixaNaMão", note: "'Deixar na mão' is the local idiom for 'let you down' — transcreated, not translated." },
      { code: "UK", name: "UK", lang: "en-GB", headline: "When the pressure peaks, it won't let you down.", subline: "Deep into stoppage time, the whole match on one arm.", hashtag: "#ItWontLetYouDown", note: "Understated, dry register that fits UK tone-of-voice." },
    ],
  },
  sentry: {
    status: "amber",
    checks: [
      { name: "Trademark & event IP", status: "amber", note: "Concept leans on a live-tournament context and official-broadcast footage. Naming the event or reusing its marks = ambush-marketing / broadcast-IP risk." },
      { name: "Brand alignment (COMPASS)", status: "pass", note: "Faithful to 'It won't let you down' — confident, not arrogant." },
      { name: "Claims & legal", status: "pass", note: "No efficacy or medical claims made." },
      { name: "Cultural sensitivity", status: "pass", note: "Neutral and inclusive across IN, BR and UK." },
    ],
    fix: {
      issue: "Keep the moment brand-owned and generic — drop event/broadcast references and use original footage.",
      headline: "When the pressure peaks, it won't let you down.",
      subline: "Deep into stoppage time, all eyes on one arm — and it holds.",
    },
  },
};

/* ---------------- Claude call helpers (live, with fallback) ---------------- */
async function callClaude(system, prompt, ms = 14000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("");
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return null;
  } finally {
    clearTimeout(t);
  }
}
const brandSys = `You are an agent inside Rexona's brand system. Positioning: ${BRAND.positioning} Tagline: "${BRAND.tagline}". Tone: ${BRAND.tone.join(", ")}. Never make efficacy or medical claims.`;

async function runCompass(signal, live) {
  if (!live) return SEED.compass;
  const r = await callClaude(
    brandSys + " You are COMPASS, the strategy agent. Judge fit and set an angle.",
    `Cultural signal: "${signal}". Return ONLY minified JSON: {"relevance": <int 0-100>, "verdict":"<3-5 words>", "angle":"<one sentence>", "why":"<one sentence tying to the tagline>"}`
  );
  return r && typeof r.relevance === "number" ? r : SEED.compass;
}
async function runForge(angle, live) {
  if (!live) return SEED.forge;
  const r = await callClaude(
    brandSys + " You are FORGE, the creative agent. Write bold, short ad copy.",
    `Strategic angle: "${angle}". Return ONLY minified JSON: {"concept":"<2-4 words>","headline":"<max 9 words>","subline":"<max 18 words>","hashtag":"<one #hashtag>"}`
  );
  return r && r.headline ? r : SEED.forge;
}
async function runAtlas(h, s, live) {
  if (!live) return SEED.atlas;
  const r = await callClaude(
    brandSys + " You are ATLAS, transcreation. Adapt meaning and emotion, not literal words.",
    `Headline: "${h}". Subline: "${s}". Localize for India (Hinglish), Brazil (pt-BR), UK (en-GB). Return ONLY minified JSON: {"markets":[{"code":"IN","name":"India","lang":"Hinglish","headline":"","subline":"","hashtag":"","note":""},{"code":"BR","name":"Brazil","lang":"pt-BR","headline":"","subline":"","hashtag":"","note":""},{"code":"UK","name":"UK","lang":"en-GB","headline":"","subline":"","hashtag":"","note":""}]}`
  );
  return r && Array.isArray(r.markets) && r.markets.length === 3 ? r : SEED.atlas;
}
async function runSentry(signalIsSeed, h, s, live) {
  // Governance beat is protected on the seeded Rexona path.
  if (signalIsSeed || !live) return SEED.sentry;
  const r = await callClaude(
    brandSys + " You are SENTRY, brand-safety & compliance. Flag amber if the concept relies on a live event's marks or footage, or makes claims.",
    `Headline: "${h}". Subline: "${s}". Check event/broadcast IP & ambush-marketing risk, unlicensed marks, legal/efficacy claims, cultural sensitivity, brand alignment. Return ONLY minified JSON: {"status":"amber|pass","checks":[{"name":"","status":"pass|amber|fail","note":""}],"fix":{"issue":"","headline":"","subline":""}}`
  );
  return r && r.status ? r : SEED.sentry;
}

/* ---------------- tiny UI atoms ---------------- */
const Card = ({ children, style, className = "" }) => (
  <div className={"rounded-2xl " + className} style={{ background: C.card, border: `1px solid ${C.cardB}`, boxShadow: "0 8px 30px rgba(0,0,0,.35)", ...style }}>{children}</div>
);
const Eyebrow = ({ children, color = C.mute }) => (
  <div style={{ color, fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>{children}</div>
);
const Dot = ({ c }) => <span style={{ width: 8, height: 8, borderRadius: 99, background: c, display: "inline-block" }} />;

/* ---------------- the signature: stoppage-time board ---------------- */
function Board({ size = 1, glow = C.cyan }) {
  const w = 120 * size, h = 78 * size;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: 12, background: "#05070F",
        border: `2px solid ${glow}`, boxShadow: `0 0 24px ${glow}55, inset 0 0 18px ${glow}22`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontFamily: mono, fontSize: 34 * size, fontWeight: 900, color: glow, lineHeight: 1, textShadow: `0 0 12px ${glow}` }}>+6</div>
        <div style={{ fontFamily: mono, fontSize: 9 * size, letterSpacing: 3, color: C.mute, marginTop: 3 }}>ADDED MIN</div>
      </div>
    </div>
  );
}

/* ---------------- the ad creative (renders in-browser, no image model) ---------------- */
function AdCreative({ concept, headline, subline, hashtag, lang }) {
  return (
    <div style={{
      width: 320, height: 400, borderRadius: 18, overflow: "hidden", position: "relative",
      background: `radial-gradient(120% 80% at 85% 90%, ${C.mg}44, transparent 60%), radial-gradient(90% 70% at 10% 5%, ${C.cyan}22, transparent 55%), linear-gradient(160deg,#12163A,#0A0E2A)`,
      border: `1px solid ${C.cardB}`, boxShadow: "0 14px 40px rgba(0,0,0,.5)",
    }}>
      <div style={{ position: "absolute", top: 16, left: 18, display: "flex", gap: 8, alignItems: "center" }}>
        <Eyebrow color={C.cyan}>Stoppage Time</Eyebrow>
        {lang && <span style={{ fontSize: 9, color: C.mute, border: `1px solid ${C.cardB}`, borderRadius: 6, padding: "1px 6px" }}>{lang}</span>}
      </div>
      <div style={{ position: "absolute", top: 44, left: "50%", transform: "translateX(-50%)" }}><Board size={0.9} /></div>
      {/* armband chip */}
      <div style={{ position: "absolute", top: 118, left: "50%", transform: "translateX(-50%) rotate(-4deg)", background: C.mg, color: "#fff", fontFamily: display, fontStyle: "italic", fontWeight: 900, fontSize: 11, letterSpacing: 2, padding: "3px 12px", borderRadius: 4, boxShadow: `0 0 16px ${C.mg}88` }}>REXONA · ON THE ARM</div>

      <div style={{ position: "absolute", left: 20, right: 20, top: 158 }}>
        <div style={{ fontFamily: display, fontStyle: "italic", fontWeight: 900, textTransform: "uppercase", color: "#fff", fontSize: 22, lineHeight: 1.05, letterSpacing: -0.3 }}>{headline}</div>
        <div style={{ color: C.body, fontSize: 12.5, marginTop: 10, lineHeight: 1.35 }}>{subline}</div>
      </div>

      <div style={{ position: "absolute", left: 20, right: 20, bottom: 16 }}>
        <div style={{ height: 1, background: C.cardB, marginBottom: 10 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: display, fontStyle: "italic", fontWeight: 900, color: "#fff", fontSize: 18, letterSpacing: 1 }}>REXONA</div>
            <div style={{ color: C.cyan, fontSize: 10.5, fontStyle: "italic" }}>{BRAND.tagline}</div>
          </div>
          <div style={{ color: C.mg, fontSize: 11, fontWeight: 700 }}>{hashtag}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- pipeline node ---------------- */
const NODES = [
  { key: "pulse", label: "Signal", agent: "PULSE", Icon: Activity },
  { key: "compass", label: "Relevance", agent: "COMPASS", Icon: Compass },
  { key: "forge", label: "Create", agent: "FORGE", Icon: PenTool },
  { key: "atlas", label: "Localize", agent: "ATLAS", Icon: Globe },
  { key: "sentry", label: "Safety", agent: "SENTRY", Icon: Shield },
  { key: "approve", label: "Approve", agent: "HUMAN", Icon: UserCheck, human: true },
  { key: "activate", label: "Activate", agent: "CHANNELS", Icon: Send },
];
function NodeRow({ status }) {
  return (
    <div className="flex items-center justify-between" style={{ gap: 4 }}>
      {NODES.map((n, i) => {
        const st = status[n.key] || "idle";
        const on = st === "done", run = st === "running";
        const col = n.human ? C.mg : C.cyan;
        const ring = on ? col : run ? col : C.cardB;
        return (
          <React.Fragment key={n.key}>
            <div className="flex flex-col items-center" style={{ width: 70 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center",
                background: on || run ? col : C.accent, border: `2px solid ${ring}`,
                boxShadow: run ? `0 0 0 6px ${col}22` : on ? `0 0 16px ${col}66` : "none",
                transition: "all .3s", opacity: st === "idle" ? 0.5 : 1,
                animation: run ? "crestpulse 1s ease-in-out infinite" : "none",
              }}>
                <n.Icon size={19} color={on || run ? "#08101f" : C.mute} strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: on || run ? "#fff" : C.mute, marginTop: 6 }}>{n.label}</div>
              <div style={{ fontSize: 8, color: n.human ? C.mg : C.faint, fontWeight: 700, letterSpacing: 0.5 }}>{n.agent}</div>
            </div>
            {i < NODES.length - 1 && <ChevronRight size={16} color={status[NODES[i + 1].key] && status[NODES[i + 1].key] !== "idle" ? C.cyan : C.faint} style={{ flexShrink: 0 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---------------- streaming output line ---------------- */
function AgentLine({ Icon, agent, color, title, children, show }) {
  return (
    <div style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(8px)", transition: "all .45s", display: show ? "block" : "none" }}>
      <Card style={{ padding: 14, marginTop: 10 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={15} color="#08101f" strokeWidth={2.4} /></div>
          <Eyebrow color={color}>{agent}</Eyebrow>
          <span style={{ color: C.mute, fontSize: 12 }}>· {title}</span>
        </div>
        <div style={{ marginTop: 8 }}>{children}</div>
      </Card>
    </div>
  );
}

/* ==================================================================== */
export default function App() {
  const [stage, setStage] = useState("radar"); // radar | pipeline | review | activated
  const [live, setLive] = useState(false); // Demo-safe by default for the public deploy
  const [chosen, setChosen] = useState(SIGNALS[0]);
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState({});
  const [out, setOut] = useState({});
  const [fixApplied, setFixApplied] = useState(false);
  const [market, setMarket] = useState("IN");
  const [elapsed, setElapsed] = useState(0);
  const [showConstitution, setShowConstitution] = useState(true);
  const timer = useRef(null);

  const isSeed = chosen?.id === "rexona" && !custom;

  async function run(signal, seedPath) {
    setStage("pipeline"); setOut({}); setFixApplied(false);
    setStatus({ pulse: "done" });
    const t0 = Date.now();
    setElapsed(0);
    timer.current = setInterval(() => setElapsed((Date.now() - t0) / 1000), 100);
    const step = async (key, fn) => {
      setStatus((s) => ({ ...s, [key]: "running" }));
      await new Promise((r) => setTimeout(r, 550));
      const res = await fn();
      setOut((o) => ({ ...o, [key]: res }));
      setStatus((s) => ({ ...s, [key]: "done" }));
      return res;
    };
    const compass = await step("compass", () => runCompass(signal, live));
    const forge = await step("forge", () => runForge(compass.angle, live));
    const atlas = await step("atlas", () => runAtlas(forge.headline, forge.subline, live));
    await step("sentry", () => runSentry(seedPath, forge.headline, forge.subline, live));
    clearInterval(timer.current);
    setStatus((s) => ({ ...s, approve: "running" }));
    setTimeout(() => setStage("review"), 500);
  }

  useEffect(() => () => clearInterval(timer.current), []);

  const forge = out.forge || {};
  const sentry = out.sentry || {};
  const atlas = out.atlas || {};
  const shownHeadline = fixApplied && sentry.fix ? sentry.fix.headline : forge.headline;
  const shownSubline = fixApplied && sentry.fix ? sentry.fix.subline : forge.subline;
  const mk = (atlas.markets || []).find((m) => m.code === market);

  function activate() {
    setStatus((s) => ({ ...s, approve: "done", activate: "done" }));
    setStage("activated");
  }
  function reset() {
    setStage("radar"); setStatus({}); setOut({}); setFixApplied(false); setChosen(SIGNALS[0]); setCustom("");
  }

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(120% 90% at 85% 100%, ${C.mg}18, transparent 55%), radial-gradient(90% 70% at 5% 0%, ${C.cyan}12, transparent 50%), ${C.bg}`, color: C.body, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,sans-serif" }}>
      <style>{`@keyframes crestpulse{0%,100%{box-shadow:0 0 0 6px ${C.cyan}22}50%{box-shadow:0 0 0 10px ${C.cyan}33}} @keyframes tick{from{opacity:.4}to{opacity:1}}`}</style>

      {/* top bar */}
      <div className="flex items-center justify-between" style={{ padding: "16px 22px", borderBottom: `1px solid ${C.cardB}` }}>
        <div className="flex items-center" style={{ gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${C.cyan},${C.pu})`, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={18} color="#08101f" /></div>
          <div>
            <div style={{ fontWeight: 800, color: "#fff", letterSpacing: 0.3 }}>Project NEXT · <span style={{ color: C.cyan }}>CREST</span></div>
            <div style={{ fontSize: 11, color: C.mute }}>Real-time cultural moment → brand-safe campaign</div>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 14 }}>
          <button onClick={() => setLive((v) => !v)} title="Toggle live AI vs demo-safe seeded output"
            style={{ fontSize: 11, color: live ? C.gr : C.mute, background: "transparent", border: `1px solid ${live ? C.gr : C.cardB}`, borderRadius: 20, padding: "5px 12px", cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
            <Dot c={live ? C.gr : C.faint} /> {live ? "Live AI" : "Demo-safe"}
          </button>
          <div style={{ fontSize: 11, color: C.mute }}>ChainSurfers · SJMSOM, IIT Bombay</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, padding: 22, maxWidth: 1180, margin: "0 auto", alignItems: "flex-start" }}>
        {/* ============ main column ============ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ---- RADAR ---- */}
          {stage === "radar" && (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <div className="flex items-center" style={{ gap: 10 }}>
                  <Radio size={18} color={C.cyan} />
                  <h2 style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0 }}>Signal Radar</h2>
                  <span style={{ fontSize: 11, color: C.gr, border: `1px solid ${C.gr}55`, borderRadius: 20, padding: "2px 9px" }}>live · PULSE</span>
                </div>
                <div style={{ fontSize: 12, color: C.mute }}>ranked by velocity × sentiment × brand-fit</div>
              </div>
              <div style={{ color: C.mute, fontSize: 13, marginBottom: 14 }}>Pick a cultural signal to turn into a campaign — or paste your own below.</div>

              {SIGNALS.map((s) => {
                const sel = chosen?.id === s.id && !custom;
                return (
                  <Card key={s.id} className="cursor-pointer" style={{ padding: 15, marginBottom: 12, borderColor: sel ? C.cyan : C.cardB, boxShadow: sel ? `0 0 0 2px ${C.cyan}44` : undefined }}>
                    <div onClick={() => { setChosen(s); setCustom(""); }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center" style={{ gap: 8 }}>
                          {s.hero && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "#08101f", background: C.cyan, borderRadius: 5, padding: "2px 7px" }}>TOP SIGNAL</span>}
                          <span style={{ fontSize: 10.5, color: s.match === "HIGH" ? C.gr : C.amber, fontWeight: 700 }}>brand-fit: {s.match}</span>
                        </div>
                        <div className="flex" style={{ gap: 16 }}>
                          <Metric label="velocity" val={s.velocity} col={C.cyan} />
                          <Metric label="sentiment" val={"+" + s.sentiment} col={C.gr} />
                          <Metric label="reach" val={s.reach} col={C.pu} />
                        </div>
                      </div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 10 }}>{s.title}</div>
                      <div style={{ color: C.body, fontSize: 12.5, marginTop: 5, lineHeight: 1.4 }}>{s.text}</div>
                      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
                        <div className="flex" style={{ gap: 6 }}>{s.tags.map((t) => <span key={t} style={{ fontSize: 10, color: C.mute, background: C.accent, borderRadius: 6, padding: "2px 8px" }}>{t}</span>)}</div>
                        {sel && <button onClick={() => run(s.text, s.id === "rexona")} style={btn(C.cyan)}><Play size={14} /> Catch this moment</button>}
                      </div>
                    </div>
                  </Card>
                );
              })}

              <Card style={{ padding: 14, marginTop: 6 }}>
                <Eyebrow>Or bring your own signal</Eyebrow>
                <div className="flex" style={{ gap: 10, marginTop: 8 }}>
                  <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Paste a trend, headline or cultural moment…"
                    style={{ flex: 1, background: C.bg2, border: `1px solid ${C.cardB}`, borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 13, outline: "none" }} />
                  <button disabled={!custom.trim()} onClick={() => run(custom, false)} style={{ ...btn(C.mg), opacity: custom.trim() ? 1 : 0.4 }}><Zap size={14} /> Analyze</button>
                </div>
              </Card>
            </div>
          )}

          {/* ---- PIPELINE ---- */}
          {(stage === "pipeline" || stage === "review") && (
            <div>
              <Card style={{ padding: "18px 16px" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <Eyebrow color={C.mute}>The CREST loop</Eyebrow>
                  <div className="flex items-center" style={{ gap: 6, color: C.cyan, fontSize: 12 }}>
                    <Clock size={13} /> {elapsed.toFixed(1)}s <span style={{ color: C.faint }}>vs ~3 weeks legacy</span>
                  </div>
                </div>
                <NodeRow status={status} />
              </Card>

              {stage === "pipeline" && (
                <div>
                  <AgentLine show={!!out.compass} Icon={Compass} agent="COMPASS" color={C.cyan} title="brand relevance & angle">
                    <div className="flex items-center" style={{ gap: 10, marginBottom: 6 }}>
                      <RelevanceBar v={out.compass?.relevance || 0} />
                      <span style={{ color: C.gr, fontWeight: 800, fontSize: 13 }}>{out.compass?.verdict}</span>
                    </div>
                    <div style={{ color: "#fff", fontSize: 13 }}>{out.compass?.angle}</div>
                    <div style={{ color: C.mute, fontSize: 12, marginTop: 4 }}>{out.compass?.why}</div>
                  </AgentLine>
                  <AgentLine show={!!out.forge} Icon={PenTool} agent="FORGE" color={C.cyan} title="creative concept & copy">
                    <div style={{ color: C.pu, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{(out.forge?.concept || "").toUpperCase()}</div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 3 }}>{out.forge?.headline}</div>
                    <div style={{ color: C.body, fontSize: 12.5 }}>{out.forge?.subline}</div>
                  </AgentLine>
                  <AgentLine show={!!out.atlas} Icon={Globe} agent="ATLAS" color={C.cyan} title="transcreation across markets">
                    <div className="flex" style={{ gap: 8, flexWrap: "wrap" }}>
                      {(out.atlas?.markets || []).map((m) => <span key={m.code} style={{ fontSize: 11, color: C.body, background: C.accent, borderRadius: 7, padding: "4px 9px" }}><b style={{ color: C.cyan }}>{m.code}</b> {m.headline.length > 34 ? m.headline.slice(0, 34) + "…" : m.headline}</span>)}
                    </div>
                  </AgentLine>
                  <AgentLine show={!!out.sentry} Icon={Shield} agent="SENTRY" color={out.sentry?.status === "amber" ? C.amber : C.gr} title="autonomous brand-safety">
                    <div style={{ color: out.sentry?.status === "amber" ? C.amber : C.gr, fontWeight: 700, fontSize: 13 }}>
                      {out.sentry?.status === "amber" ? "1 flag to review before activation" : "All checks passed"}
                    </div>
                  </AgentLine>
                </div>
              )}
            </div>
          )}

          {/* ---- REVIEW ---- */}
          {stage === "review" && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <Eyebrow color={C.mute}>Campaign preview {mk ? "· " + mk.name : ""}</Eyebrow>
                  <div style={{ marginTop: 8 }}>
                    <AdCreative
                      concept={forge.concept}
                      headline={market === "IN" || market === "BR" ? (mk?.headline || shownHeadline) : shownHeadline}
                      subline={market === "IN" || market === "BR" ? (mk?.subline || shownSubline) : shownSubline}
                      hashtag={mk?.hashtag || forge.hashtag}
                      lang={mk?.lang}
                    />
                  </div>
                  {/* market tabs */}
                  <div className="flex" style={{ gap: 8, marginTop: 12 }}>
                    {(atlas.markets || []).map((m) => (
                      <button key={m.code} onClick={() => setMarket(m.code)}
                        style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: market === m.code ? C.cyan : C.accent, color: market === m.code ? "#08101f" : C.body, border: `1px solid ${market === m.code ? C.cyan : C.cardB}` }}>
                        {m.code} · {m.name}
                      </button>
                    ))}
                  </div>
                  {mk?.note && <div style={{ color: C.mute, fontSize: 11.5, marginTop: 8, maxWidth: 320, lineHeight: 1.4 }}><b style={{ color: C.pu }}>ATLAS ·</b> {mk.note}</div>}
                </div>

                <div style={{ flex: 1, minWidth: 300 }}>
                  {/* SENTRY report */}
                  <Card style={{ padding: 16 }}>
                    <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
                      <Shield size={17} color={sentry.status === "amber" && !fixApplied ? C.amber : C.gr} />
                      <span style={{ color: "#fff", fontWeight: 800 }}>SENTRY — brand-safety report</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: sentry.status === "amber" && !fixApplied ? C.amber : C.gr }}>{sentry.status === "amber" && !fixApplied ? "REVIEW NEEDED" : "CLEARED"}</span>
                    </div>
                    {(sentry.checks || []).map((c, i) => {
                      const resolved = fixApplied && c.status === "amber";
                      const col = resolved || c.status === "pass" ? C.gr : c.status === "amber" ? C.amber : C.mg;
                      return (
                        <div key={i} style={{ display: "flex", gap: 9, padding: "8px 0", borderTop: i ? `1px solid ${C.accent}` : "none" }}>
                          <div style={{ marginTop: 2 }}>{resolved || c.status === "pass" ? <Check size={15} color={C.gr} /> : <AlertTriangle size={15} color={col} />}</div>
                          <div>
                            <div style={{ color: "#fff", fontSize: 12.5, fontWeight: 700 }}>{c.name} <span style={{ color: col, fontWeight: 700 }}>· {resolved ? "resolved" : c.status}</span></div>
                            <div style={{ color: C.mute, fontSize: 11.5, lineHeight: 1.4 }}>{c.note}</div>
                          </div>
                        </div>
                      );
                    })}
                    {sentry.status === "amber" && sentry.fix && (
                      <div style={{ marginTop: 10, padding: 11, borderRadius: 10, background: fixApplied ? `${C.gr}14` : `${C.amber}14`, border: `1px solid ${fixApplied ? C.gr : C.amber}44` }}>
                        <div style={{ fontSize: 11.5, color: fixApplied ? C.gr : C.amber, fontWeight: 700, marginBottom: 4 }}>{fixApplied ? "Fix applied — copy is now brand-owned & generic" : "Suggested fix"}</div>
                        <div style={{ fontSize: 11.5, color: C.body, lineHeight: 1.4 }}>{sentry.fix.issue}</div>
                        {!fixApplied && <button onClick={() => setFixApplied(true)} style={{ ...btn(C.amber), marginTop: 9, padding: "6px 12px", fontSize: 12 }}><RefreshCw size={13} /> Apply fix</button>}
                      </div>
                    )}
                  </Card>

                  {/* human approval gate */}
                  <Card style={{ padding: 16, marginTop: 14, borderColor: C.mg + "66" }}>
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <UserCheck size={17} color={C.mg} />
                      <span style={{ color: "#fff", fontWeight: 800 }}>Human approval</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: C.mute }}>Brand Manager sign-off required</span>
                    </div>
                    <div style={{ color: C.mute, fontSize: 12, margin: "8px 0 12px", lineHeight: 1.4 }}>
                      AI drafted, localized and safety-checked in <b style={{ color: C.cyan }}>{elapsed.toFixed(1)}s</b>. Public activation always needs a human decision.
                    </div>
                    <div className="flex" style={{ gap: 10 }}>
                      <button disabled={sentry.status === "amber" && !fixApplied} onClick={activate}
                        style={{ ...btn(C.gr), opacity: sentry.status === "amber" && !fixApplied ? 0.4 : 1, cursor: sentry.status === "amber" && !fixApplied ? "not-allowed" : "pointer" }}>
                        <Check size={15} /> Approve &amp; activate
                      </button>
                      <button onClick={reset} style={btnGhost()}>Request changes</button>
                    </div>
                    {sentry.status === "amber" && !fixApplied && <div style={{ color: C.amber, fontSize: 11, marginTop: 8 }}>Resolve the SENTRY flag above to enable activation.</div>}
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ---- ACTIVATED ---- */}
          {stage === "activated" && <Activated elapsed={elapsed} onReset={reset} headline={shownHeadline} />}
        </div>

        {/* ============ brand constitution rail (the moat) ============ */}
        <div style={{ width: 288, flexShrink: 0 }}>
          <Card style={{ padding: 16, position: "sticky", top: 16 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <Lock size={15} color={C.pu} />
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Brand Constitution</span>
            </div>
            <div style={{ fontSize: 11, color: C.mute, marginTop: 2 }}>COMPASS memory · what makes CREST hard to copy</div>

            <div style={{ marginTop: 12 }}>
              <div style={{ background: C.accent, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 10, color: C.mute, letterSpacing: 1 }}>{BRAND.name.toUpperCase()} · TAGLINE</div>
                <div style={{ color: C.cyan, fontStyle: "italic", fontWeight: 700, fontSize: 14, marginTop: 2 }}>{BRAND.tagline}</div>
              </div>
              <ConstBlock label="Positioning" items={[BRAND.positioning]} col={C.body} />
              <ConstBlock label="Tone" items={BRAND.tone} chip col={C.cyan} />
              <ConstBlock label="Do" items={BRAND.dos} col={C.gr} bullet />
              <ConstBlock label="Don't" items={BRAND.donts} col={C.mg} bullet />
            </div>
            <div style={{ fontSize: 10.5, color: C.faint, marginTop: 12, lineHeight: 1.4, borderTop: `1px solid ${C.accent}`, paddingTop: 10 }}>
              Every agent decision is grounded here. Rivals can buy the same model — not this.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- sub-components & helpers ---------------- */
function Metric({ label, val, col }) {
  return <div style={{ textAlign: "right" }}><div style={{ color: col, fontWeight: 800, fontSize: 14, fontFamily: mono }}>{val}</div><div style={{ color: C.faint, fontSize: 9, letterSpacing: 1 }}>{label}</div></div>;
}
function RelevanceBar({ v }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <div style={{ width: 90, height: 8, borderRadius: 6, background: C.accent, overflow: "hidden" }}>
        <div style={{ width: v + "%", height: "100%", background: `linear-gradient(90deg,${C.cyan},${C.gr})` }} />
      </div>
      <span style={{ color: "#fff", fontWeight: 800, fontFamily: mono, fontSize: 14 }}>{v}</span>
      <span style={{ color: C.mute, fontSize: 11 }}>/100 fit</span>
    </div>
  );
}
function ConstBlock({ label, items, col, chip, bullet }) {
  return (
    <div style={{ marginTop: 11 }}>
      <div style={{ fontSize: 10, color: C.mute, letterSpacing: 1, marginBottom: 5 }}>{label.toUpperCase()}</div>
      {chip ? (
        <div className="flex" style={{ gap: 5, flexWrap: "wrap" }}>{items.map((t) => <span key={t} style={{ fontSize: 10.5, color: col, border: `1px solid ${col}44`, borderRadius: 6, padding: "2px 7px" }}>{t}</span>)}</div>
      ) : (
        items.map((t, i) => <div key={i} style={{ fontSize: 11.5, color: C.body, lineHeight: 1.45, display: "flex", gap: 6 }}>{bullet && <span style={{ color: col }}>•</span>}<span>{t}</span></div>)
      )}
    </div>
  );
}
function Activated({ elapsed, onReset, headline }) {
  const [m, setM] = useState({ imp: 128000, eng: 4.1, sen: 78, sh: 2400 });
  useEffect(() => {
    const id = setInterval(() => setM((p) => ({ imp: p.imp + Math.round(Math.random() * 9000), eng: +(p.eng + Math.random() * 0.05).toFixed(2), sen: Math.min(95, +(p.sen + Math.random() * 0.4).toFixed(1)), sh: p.sh + Math.round(Math.random() * 180) })), 900);
    return () => clearInterval(id);
  }, []);
  const chans = ["Instagram", "TikTok", "X", "YouTube Shorts", "DOOH"];
  return (
    <div>
      <Card style={{ padding: 20, borderColor: C.gr + "66" }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 99, background: C.gr, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={22} color="#08101f" strokeWidth={3} /></div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Campaign activated</div>
            <div style={{ color: C.mute, fontSize: 12.5 }}>Signal → brand-safe, localized, human-approved campaign in <b style={{ color: C.cyan }}>{elapsed.toFixed(1)}s</b> · legacy ≈ 3 weeks</div>
          </div>
          <button onClick={onReset} style={{ ...btnGhost(), marginLeft: "auto" }}><RefreshCw size={14} /> Run again</button>
        </div>
        <div className="flex" style={{ gap: 7, marginTop: 14, flexWrap: "wrap" }}>
          {chans.map((c) => <span key={c} style={{ fontSize: 11, color: C.gr, border: `1px solid ${C.gr}44`, borderRadius: 20, padding: "3px 11px" }}><Check size={11} style={{ display: "inline", marginRight: 4 }} />{c}</span>)}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 14 }}>
        <Stat Icon={TrendingUp} label="Impressions" val={m.imp.toLocaleString()} col={C.cyan} live />
        <Stat Icon={Activity} label="Engagement rate" val={m.eng + "%"} col={C.pu} live />
        <Stat Icon={Sparkles} label="Positive sentiment" val={m.sen + "%"} col={C.gr} live />
        <Stat Icon={Send} label="Shares" val={m.sh.toLocaleString()} col={C.mg} live />
      </div>

      <Card style={{ padding: 14, marginTop: 14 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <RefreshCw size={15} color={C.gr} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>LOOP</span>
          <span style={{ color: C.mute, fontSize: 12 }}>— live results feeding back to PULSE &amp; COMPASS to sharpen the next moment.</span>
        </div>
      </Card>
    </div>
  );
}
function Stat({ Icon, label, val, col, live }) {
  return (
    <Card style={{ padding: 13 }}>
      <div className="flex items-center justify-between"><Icon size={15} color={col} />{live && <span style={{ fontSize: 8.5, color: C.gr, letterSpacing: 1, animation: "tick 1s infinite alternate" }}>● LIVE</span>}</div>
      <div style={{ color: "#fff", fontWeight: 800, fontSize: 20, fontFamily: mono, marginTop: 8 }}>{val}</div>
      <div style={{ color: C.mute, fontSize: 10.5, marginTop: 2 }}>{label}</div>
    </Card>
  );
}
function btn(color) {
  return { display: "inline-flex", alignItems: "center", gap: 7, background: color, color: "#08101f", fontWeight: 800, fontSize: 13, border: "none", borderRadius: 10, padding: "9px 15px", cursor: "pointer" };
}
function btnGhost() {
  return { display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", color: C.body, fontWeight: 700, fontSize: 13, border: `1px solid ${C.cardB}`, borderRadius: 10, padding: "9px 15px", cursor: "pointer" };
}
