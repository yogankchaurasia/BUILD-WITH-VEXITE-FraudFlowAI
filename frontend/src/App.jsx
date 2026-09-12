import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Shield, ShieldAlert, ShieldCheck, LayoutDashboard, FileWarning, Network,
  Brain, Map as MapIcon, Siren, BarChart3, FolderKanban, Settings, Search,
  Bell, ChevronDown, ChevronRight, LogOut, Menu, X, ArrowRight, ArrowUpRight,
  ArrowDownRight, CheckCircle2, Clock, AlertTriangle, MapPin, Wallet, User,
  Landmark, Radar, FileText, Printer, Download, Filter, Lock, Eye, EyeOff,
  Users, Database, ClipboardList, Activity, TrendingUp, Zap, Target,
  ChevronLeft, Plus, RefreshCw, Fingerprint, ScanLine, CircleAlert,
  BadgeCheck, History, SlidersHorizontal, Building2, CreditCard, Smartphone,
  MousePointerClick,
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar,
} from "recharts";

/* ============================================================================
   DESIGN TOKENS
   Base: deep navy command-center. Signal color: amber (alert/prediction),
   not the usual cyan-on-black security cliche. Mono used only for IDs/data,
   because that is literally how case/txn IDs are rendered in real systems.
============================================================================ */
const C = {
  bg: "#0B1220",
  bgElevated: "#111B2E",
  panel: "#14213A",
  panelAlt: "#182747",
  border: "#233451",
  borderSoft: "#1B2A45",
  text: "#E7ECF5",
  textMute: "#8CA0C2",
  textFaint: "#5B6E8E",
  amber: "#F5A524",
  amberSoft: "#3A2E14",
  teal: "#2DD4BF",
  blue: "#4C8DFF",
  critical: "#EF4A5E",
  criticalSoft: "#3A1620",
  high: "#F5793B",
  highSoft: "#3A2414",
  medium: "#F0C33C",
  mediumSoft: "#332C13",
  low: "#3FCB7E",
  lowSoft: "#12301F",
  violet: "#9B7CF0",
};

const RISK_COLORS = { CRITICAL: C.critical, HIGH: C.high, MEDIUM: C.medium, LOW: C.low };
const RISK_SOFT = { CRITICAL: C.criticalSoft, HIGH: C.highSoft, MEDIUM: C.mediumSoft, LOW: C.lowSoft };

function riskLevel(score) {
  if (score >= 81) return "CRITICAL";
  if (score >= 61) return "HIGH";
  if (score >= 31) return "MEDIUM";
  return "LOW";
}

/* ============================================================================
   SEEDED RNG — deterministic synthetic data every render
============================================================================ */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(87231);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => Math.floor(rnd() * (max - min + 1)) + min;
const pad = (n, len) => String(n).padStart(len, "0");

/* ============================================================================
   SYNTHETIC DATA — fully fictional, generated. Zone/location names are
   invented (no real cities/banks) per hackathon-demo data policy.
============================================================================ */
const FRAUD_TYPES = ["UPI Fraud", "Phishing Link", "Investment Scam", "Loan App Fraud",
  "OTP Fraud", "Fake Job Offer", "Romance Scam", "Card Skimming", "SIM Swap", "Fake E-commerce"];

const ZONES = ["Sector 4", "Sector 7", "Sector 9", "Sector 12", "Old Town", "Riverside",
  "Tech Park", "Highway Junction", "University Belt", "North Ring", "Harbor Road", "Central Market"];

const LOCATION_TYPES = ["ATM", "Bank Branch", "Merchant"];
const LOCATIONS = Array.from({ length: 20 }).map((_, i) => {
  const type = pick(LOCATION_TYPES);
  const zone = ZONES[i % ZONES.length];
  const name = type === "ATM" ? `${zone} ATM Cluster ${i % 3 === 0 ? "II" : "I"}`
    : type === "Bank Branch" ? `${zone} Branch Office`
    : `${zone} Merchant Row`;
  return {
    id: `LOC-${pad(i + 1, 3)}`,
    name, type, zone,
    x: 8 + (i * 137 + int(0, 40)) % 84,
    y: 10 + (i * 211 + int(0, 40)) % 80,
    riskZone: pick(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    withdrawalsLast30d: int(2, 46),
  };
});

const ACCOUNT_TYPES = ["Source", "Mule", "Mule", "Wallet", "Destination"];
const ACCOUNTS = Array.from({ length: 15 }).map((_, i) => ({
  id: `ACC-${pad(i + 1, 4)}`,
  masked: `XXXX-XXXX-${pad(int(1000, 9999), 4)}`,
  holder: `Subject-${String.fromCharCode(65 + (i % 26))}${int(10, 99)}`,
  type: ACCOUNT_TYPES[i % ACCOUNT_TYPES.length],
  bank: pick(["Nimbus Bank", "Anchorage Financial", "Wellgate Bank", "Coral Trust", "Meridian Coop"]),
  riskScore: int(20, 98),
  openedDaysAgo: int(3, 900),
}));

const STATUSES = ["New", "Under Investigation", "High Risk", "Action Required", "Resolved"];
const OFFICERS = ["Insp. R. Mehta", "SI A. Kulkarni", "Insp. P. Nair", "SI D. Verma", "ACP S. Rao"];

function genComplaint(i) {
  const id = `CYB-${2024_0000 + int(1000, 9999)}-${pad(i + 1, 3)}`;
  const amount = int(8, 480) * 1000;
  const risk = int(18, 99);
  const originLoc = pick(LOCATIONS);
  const daysAgo = int(0, 45);
  const date = new Date(Date.now() - daysAgo * 86400000);
  return {
    id,
    date: date.toISOString().slice(0, 10),
    fraudType: pick(FRAUD_TYPES),
    amount,
    victim: `Victim-${pad(i + 1, 3)} (masked)`,
    sourceAccount: pick(ACCOUNTS.filter(a => a.type === "Source")).id,
    destAccount: pick(ACCOUNTS.filter(a => a.type === "Destination")).id,
    upi: `syn.user${int(100, 999)}@mockpay`,
    txnCount: int(2, 11),
    txnTimestamp: date.toISOString().slice(0, 16).replace("T", " "),
    originLocation: originLoc.id,
    status: pick(STATUSES),
    riskScore: risk,
    riskLevel: riskLevel(risk),
    officer: pick(OFFICERS),
  };
}
const COMPLAINTS = Array.from({ length: 20 }).map((_, i) => genComplaint(i));

// Money trail: victim -> source -> mule A -> mule B -> wallet -> withdrawal
function genMoneyTrail(complaint) {
  const muleA = pick(ACCOUNTS.filter(a => a.type === "Mule"));
  let muleB = pick(ACCOUNTS.filter(a => a.type === "Mule"));
  if (muleB.id === muleA.id) muleB = ACCOUNTS.find(a => a.type === "Mule" && a.id !== muleA.id) || muleB;
  const wallet = pick(ACCOUNTS.filter(a => a.type === "Wallet"));
  const dropLoc = LOCATIONS.find(l => l.id === complaint.originLocation);
  const predictedLoc = pick(LOCATIONS.filter(l => l.id !== dropLoc.id));

  const nodes = [
    { id: "victim", label: "Victim", sub: complaint.victim, type: "victim" },
    { id: "source", label: "Source Account", sub: complaint.sourceAccount, type: "source" },
    { id: "muleA", label: "Suspicious Account A", sub: muleA.id, type: "mule" },
    { id: "muleB", label: "Suspicious Account B", sub: muleB.id, type: "mule" },
    { id: "wallet", label: "Wallet / UPI", sub: complaint.upi, type: "wallet" },
    { id: "withdrawal", label: "Predicted Withdrawal", sub: predictedLoc.name, type: "predicted" },
  ];
  let remaining = complaint.amount;
  const hop = (frac) => Math.max(500, Math.round((remaining * frac) / 100) * 100);
  const edges = [
    { from: "victim", to: "source", amount: complaint.amount, ts: complaint.txnTimestamp, freq: 1 },
    { from: "source", to: "muleA", amount: hop(0.94), ts: shiftTime(complaint.txnTimestamp, 4), freq: int(1, 3) },
    { from: "muleA", to: "muleB", amount: hop(0.88), ts: shiftTime(complaint.txnTimestamp, 19), freq: int(1, 4) },
    { from: "muleB", to: "wallet", amount: hop(0.81), ts: shiftTime(complaint.txnTimestamp, 41), freq: int(1, 5) },
    { from: "wallet", to: "withdrawal", amount: hop(0.74), ts: shiftTime(complaint.txnTimestamp, 63), freq: 1, predicted: true },
  ];
  return { nodes, edges, hops: 5, accounts: [muleA, muleB, wallet], predictedLoc, dropLoc };
}
function shiftTime(ts, minutes) {
  const d = new Date(ts.replace(" ", "T"));
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const FACTOR_LABELS = [
  ["Transaction Pattern", 32], ["Location Pattern", 24], ["Time Pattern", 18],
  ["Network Connections", 15], ["Previous Cash-out Pattern", 11],
];

function genPredictions(complaint, trail) {
  const others = LOCATIONS.filter(l => l.id !== trail.predictedLoc.id && l.id !== trail.dropLoc.id);
  const second = pick(others);
  const third = pick(others.filter(l => l.id !== second.id));
  const base = [
    { loc: trail.predictedLoc, probability: int(80, 92), window: "30–60 min" },
    { loc: second, probability: int(62, 76), window: "1–2 hrs" },
    { loc: third, probability: int(45, 60), window: "2–4 hrs" },
  ];
  return base.map((b, i) => ({
    rank: i + 1,
    location: b.loc.name,
    zone: b.loc.zone,
    type: b.loc.type,
    probability: b.probability,
    riskScore: Math.min(99, Math.round(b.probability * 0.95 + int(2, 10))),
    window: b.window,
    reason: i === 0
      ? "Matches historical cash-out pattern and short hop-distance from wallet node."
      : i === 1
      ? "Secondary pattern match based on network-adjacent withdrawal history."
      : "Lower-confidence match from broader zone-level withdrawal trends.",
    x: b.loc.x, y: b.loc.y,
  }));
}

const ALERT_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM"];
function genAlerts() {
  const templates = [
    { sev: "CRITICAL", text: "High-probability cash withdrawal predicted at {loc}." },
    { sev: "HIGH", text: "Suspicious account routed funds through multiple intermediary accounts." },
    { sev: "MEDIUM", text: "Unusual transaction velocity detected on wallet node." },
    { sev: "HIGH", text: "New mule account linked to existing money-trail network." },
    { sev: "CRITICAL", text: "Predicted withdrawal window closing in under 30 minutes." },
    { sev: "MEDIUM", text: "Complaint reopened after new transaction activity." },
  ];
  return Array.from({ length: 10 }).map((_, i) => {
    const t = pick(templates);
    const c = pick(COMPLAINTS);
    const loc = pick(LOCATIONS);
    return {
      id: `ALT-${pad(i + 1, 3)}`,
      severity: t.sev,
      text: t.text.replace("{loc}", loc.name),
      caseId: c.id,
      minsAgo: int(1, 240),
    };
  }).sort((a, b) => a.minsAgo - b.minsAgo);
}
const ALERTS = genAlerts();

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const TREND = MONTHS.map((m, i) => ({
  month: m,
  complaints: int(28, 70) + i * 4,
  resolved: int(15, 40) + i * 3,
}));
const RISK_DIST = [
  { name: "Critical", value: COMPLAINTS.filter(c => c.riskLevel === "CRITICAL").length, color: C.critical },
  { name: "High", value: COMPLAINTS.filter(c => c.riskLevel === "HIGH").length, color: C.high },
  { name: "Medium", value: COMPLAINTS.filter(c => c.riskLevel === "MEDIUM").length, color: C.medium },
  { name: "Low", value: COMPLAINTS.filter(c => c.riskLevel === "LOW").length, color: C.low },
];
const TXN_ACTIVITY = Array.from({ length: 12 }).map((_, i) => ({
  hour: `${pad(i * 2, 2)}:00`,
  volume: int(4, 60),
}));
const FRAUD_TYPE_DIST = FRAUD_TYPES.map(t => ({
  name: t, value: COMPLAINTS.filter(c => c.fraudType === t).length,
})).filter(d => d.value > 0);
const ACCURACY_TREND = MONTHS.map((m, i) => ({ month: m, accuracy: 71 + i * 3 + int(-2, 2) }));
const HOP_LENGTHS = Array.from({ length: 8 }).map((_, i) => ({ case: `Wk ${i + 1}`, hops: int(3, 7) }));

const CASES = COMPLAINTS.map((c) => ({
  ...c,
  caseId: c.id,
  timeline: [
    { t: c.date, label: "Complaint registered", done: true },
    { t: c.date, label: "Initial triage & risk scoring", done: true },
    { t: c.date, label: "Money-trail analysis run", done: c.status !== "New" },
    { t: c.date, label: "Prediction generated", done: ["High Risk", "Action Required", "Resolved"].includes(c.status) },
    { t: c.date, label: "Officer intervention", done: ["Action Required", "Resolved"].includes(c.status) },
    { t: c.date, label: "Case resolved", done: c.status === "Resolved" },
  ],
}));

/* ============================================================================
   SMALL UI PRIMITIVES
============================================================================ */
function RiskBadge({ level, size = "md" }) {
  const color = RISK_COLORS[level] || C.textMute;
  const soft = RISK_SOFT[level] || C.panel;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"}`}
      style={{ background: soft, color, border: `1px solid ${color}44` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {level}
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    New: C.blue, "Under Investigation": C.amber, "High Risk": C.high,
    "Action Required": C.critical, Resolved: C.low,
  };
  const color = map[status] || C.textMute;
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ color, background: `${color}1A`, border: `1px solid ${color}33` }}>
      {status}
    </span>
  );
}

function KPICard({ icon: Icon, label, value, delta, deltaUp, accent }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${accent}1A` }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {delta && (
          <span className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color: deltaUp ? C.critical : C.low }}>
            {deltaUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{delta}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
        <div className="text-[12.5px] mt-0.5" style={{ color: C.textMute }}>{label}</div>
      </div>
    </div>
  );
}

function Panel({ title, action, children, className = "", right }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      {title && (
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h3 className="text-[13.5px] font-semibold" style={{ color: C.text }}>{title}</h3>
          {right}
          {action}
        </div>
      )}
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function ProbabilityBar({ value, color }) {
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.borderSoft }}>
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function GaugeRisk({ score }) {
  const level = riskLevel(score);
  const color = RISK_COLORS[level];
  const r = 54, circ = 2 * Math.PI * r;
  const pct = score / 100;
  const arc = circ * 0.75; // 270 degree gauge
  return (
    <div className="relative flex items-center justify-center" style={{ width: 150, height: 150 }}>
      <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: "rotate(135deg)" }}>
        <circle cx="75" cy="75" r={r} fill="none" stroke={C.borderSoft} strokeWidth="12"
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
        <circle cx="75" cy="75" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${arc * pct} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
        <span className="text-[11px]" style={{ color: C.textMute }}>/ 100</span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-2">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: C.borderSoft }}>
        <Icon size={20} style={{ color: C.textFaint }} />
      </div>
      <p className="text-sm font-medium" style={{ color: C.textMute }}>{title}</p>
      {sub && <p className="text-xs" style={{ color: C.textFaint }}>{sub}</p>}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "#00000099" }} onClick={onClose}>
      <div
        className={`rounded-xl w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto`}
        style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 sticky top-0" style={{ background: C.bgElevated, borderBottom: `1px solid ${C.border}` }}>
          <h3 className="font-semibold text-[15px]" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:opacity-70" style={{ color: C.textMute }}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function fmtINR(n) {
  return "₹" + n.toLocaleString("en-IN");
}

/* ============================================================================
   LANDING PAGE
============================================================================ */
function LandingPage({ onEnter }) {
  const sections = [
    { icon: FileWarning, title: "The Problem", body: "Cybercrime complaints are logged after the money has already moved. By the time a report is filed, mule accounts have passed funds through several hops and cash is withdrawn — investigators are always a step behind." },
    { icon: Brain, title: "The Solution", body: "FraudFlow AI reconstructs the money trail the moment a complaint is filed, scores every account in the chain, and forecasts where the cash is most likely to surface next — before it does." },
  ];
  const how = [
    { n: "01", t: "Complaint intake", d: "Fraud details, accounts, and transaction history are logged." },
    { n: "02", t: "Money-trail graph", d: "Every hop between accounts, wallets and merchants is mapped." },
    { n: "03", t: "Risk scoring", d: "Velocity, distance, network depth and history combine into one score." },
    { n: "04", t: "Location forecast", d: "A ranked list of likely withdrawal points, with a confidence window." },
    { n: "05", t: "Officer action", d: "Ranked intelligence goes to the nearest unit for verification." },
  ];
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }} className="font-sans">
      <div className="max-w-6xl mx-auto px-6">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.amberSoft }}>
              <Shield size={17} style={{ color: C.amber }} />
            </div>
            <span className="font-semibold tracking-tight text-[15px]">FraudFlow<span style={{ color: C.amber }}>AI</span></span>
          </div>
          <button onClick={onEnter} className="text-sm font-medium px-4 py-2 rounded-lg" style={{ background: C.amber, color: "#20160A" }}>
            Access Dashboard
          </button>
        </header>

        <section className="pt-14 pb-16 border-b" style={{ borderColor: C.borderSoft }}>
          <div className="flex items-center gap-2 mb-5 text-xs" style={{ color: C.textMute }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.low }} />
            Smart India Hackathon · Prototype · Synthetic data only
          </div>
          <h1 className="text-[44px] leading-[1.08] font-semibold max-w-2xl tracking-tight">
            From complaint detection to next-move prediction.
          </h1>
          <p className="mt-5 max-w-lg text-[16px]" style={{ color: C.textMute }}>
            AI-powered predictive intelligence for proactive cybercrime intervention — built for investigators who need to move before the cash does.
          </p>
          <div className="flex gap-3 mt-8">
            <button onClick={onEnter} className="text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-2" style={{ background: C.amber, color: "#20160A" }}>
              Enter Command Dashboard <ArrowRight size={15} />
            </button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 py-16 border-b" style={{ borderColor: C.borderSoft }}>
          {sections.map((s) => (
            <div key={s.title} className="p-6 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <s.icon size={20} style={{ color: C.amber }} className="mb-4" />
              <h3 className="font-semibold text-[16px] mb-2">{s.title}</h3>
              <p className="text-[14px] leading-relaxed" style={{ color: C.textMute }}>{s.body}</p>
            </div>
          ))}
        </section>

        <section className="py-16 border-b" style={{ borderColor: C.borderSoft }}>
          <h2 className="text-2xl font-semibold mb-8">How it works</h2>
          <div className="grid md:grid-cols-5 gap-4">
            {how.map((h) => (
              <div key={h.n}>
                <div className="text-[13px] mb-2" style={{ color: C.textFaint, fontFamily: "'JetBrains Mono', monospace" }}>{h.n}</div>
                <div className="font-medium text-[14.5px] mb-1.5">{h.t}</div>
                <div className="text-[13px]" style={{ color: C.textMute }}>{h.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 py-16 border-b" style={{ borderColor: C.borderSoft }}>
          {[
            { icon: Radar, t: "GIS Intelligence", d: "Predicted withdrawal points plotted alongside live risk zones on a tactical map." },
            { icon: Siren, t: "Actionable Intelligence", d: "Ranked recommendations, framed as decision support — never as certainty." },
            { icon: Lock, t: "Security by design", d: "Role-based access, masked identifiers, and a full audit trail on every action." },
          ].map((f) => (
            <div key={f.t}>
              <f.icon size={19} style={{ color: C.teal }} className="mb-3" />
              <div className="font-medium text-[15px] mb-1.5">{f.t}</div>
              <div className="text-[13.5px]" style={{ color: C.textMute }}>{f.d}</div>
            </div>
          ))}
        </section>

        <section className="py-16 text-center">
          <p className="text-xs mb-3" style={{ color: C.textFaint }}>PROTOTYPE DISCLAIMER</p>
          <p className="max-w-xl mx-auto text-[14px]" style={{ color: C.textMute }}>
            All complaints, accounts and locations in this system are synthetic and generated for demonstration only. Predictions are decision-support signals; investigators must verify before acting.
          </p>
          <button onClick={onEnter} className="mt-8 text-sm font-medium px-5 py-2.5 rounded-lg" style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text }}>
            Continue to login
          </button>
        </section>
      </div>
    </div>
  );
}

/* ============================================================================
   LOGIN PAGE
============================================================================ */
function LoginPage({ onLogin }) {
  const [role, setRole] = useState("analyst");
  const [showPw, setShowPw] = useState(false);
  const roles = [
    { id: "police", label: "Police Officer", icon: Shield },
    { id: "analyst", label: "Cybercrime Analyst", icon: ScanLine },
    { id: "admin", label: "Admin", icon: Settings },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: C.amberSoft }}>
            <Shield size={18} style={{ color: C.amber }} />
          </div>
          <span className="font-semibold text-[17px]" style={{ color: C.text }}>FraudFlow<span style={{ color: C.amber }}>AI</span></span>
        </div>
        <div className="rounded-xl p-6" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <p className="text-[13px] mb-4" style={{ color: C.textMute }}>Sign in to the intelligence dashboard</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {roles.map((r) => (
              <button key={r.id} onClick={() => setRole(r.id)}
                className="flex flex-col items-center gap-1.5 py-2.5 rounded-lg text-[11px] font-medium"
                style={{
                  background: role === r.id ? C.amberSoft : C.bgElevated,
                  border: `1px solid ${role === r.id ? C.amber : C.border}`,
                  color: role === r.id ? C.amber : C.textMute,
                }}>
                <r.icon size={16} />
                {r.label}
              </button>
            ))}
          </div>
          <label className="text-[11.5px] font-medium" style={{ color: C.textMute }}>Username</label>
          <input defaultValue={role === "admin" ? "admin.control" : role === "police" ? "officer.mehta" : "analyst.kulkarni"}
            className="w-full mt-1.5 mb-3.5 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text }} />
          <label className="text-[11.5px] font-medium" style={{ color: C.textMute }}>Password</label>
          <div className="relative mt-1.5 mb-5">
            <input type={showPw ? "text" : "password"} defaultValue="••••••••"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text }} />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-2.5" style={{ color: C.textFaint }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={() => onLogin(role)} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ background: C.amber, color: "#20160A" }}>
            Sign in
          </button>
          <button onClick={() => onLogin(role)} className="w-full mt-2.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5" style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMute }}>
            <Zap size={14} /> Demo login as {roles.find(r => r.id === role).label}
          </button>
        </div>
        <p className="text-center text-[11.5px] mt-5" style={{ color: C.textFaint }}>
          Synthetic demo environment · JWT + RBAC simulated
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
   SIDEBAR + HEADER
============================================================================ */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["police", "analyst", "admin"] },
  { id: "complaints", label: "Complaints", icon: FileWarning, roles: ["police", "analyst", "admin"] },
  { id: "map", label: "GIS Prediction Map", icon: MapIcon, roles: ["police", "analyst", "admin"] },
  { id: "cases", label: "Case Management", icon: FolderKanban, roles: ["police", "analyst", "admin"] },
  { id: "alerts", label: "Alerts", icon: Siren, roles: ["police", "analyst", "admin"] },
  { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["analyst", "admin"] },
  { id: "admin", label: "Admin Panel", icon: Settings, roles: ["admin"] },
];

function Sidebar({ view, setView, role, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const items = NAV.filter(n => n.roles.includes(role));
  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-[18px]" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.amberSoft }}>
          <Shield size={16} style={{ color: C.amber }} />
        </div>
        {!collapsed && <span className="font-semibold text-[14.5px] whitespace-nowrap" style={{ color: C.text }}>FraudFlow<span style={{ color: C.amber }}>AI</span></span>}
      </div>
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {items.map((n) => (
          <button key={n.id} onClick={() => { setView(n.id); setMobileOpen(false); }}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors"
            style={{
              background: view === n.id ? C.panelAlt : "transparent",
              color: view === n.id ? C.amber : C.textMute,
            }}>
            <n.icon size={17} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{n.label}</span>}
          </button>
        ))}
      </nav>
      <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex items-center gap-2 px-4 py-3.5 text-xs" style={{ color: C.textFaint, borderTop: `1px solid ${C.borderSoft}` }}>
        {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> Collapse</>}
      </button>
    </div>
  );
  return (
    <>
      <aside className={`hidden lg:flex flex-col shrink-0 transition-all ${collapsed ? "w-[68px]" : "w-60"}`}
        style={{ background: C.bgElevated, borderRight: `1px solid ${C.borderSoft}` }}>
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: "#00000099" }} onClick={() => setMobileOpen(false)}>
          <aside className="w-64 h-full" style={{ background: C.bgElevated }} onClick={(e) => e.stopPropagation()}>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

function Header({ role, onLogout, setMobileOpen, title }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const roleLabel = { police: "Police Officer", analyst: "Cybercrime Analyst", admin: "Administrator" }[role];
  return (
    <header className="flex items-center gap-3 px-4 lg:px-6 py-3 shrink-0" style={{ borderBottom: `1px solid ${C.borderSoft}`, background: C.bg }}>
      <button className="lg:hidden" onClick={() => setMobileOpen(true)} style={{ color: C.textMute }}><Menu size={20} /></button>
      <h1 className="font-semibold text-[15px] hidden sm:block" style={{ color: C.text }}>{title}</h1>
      <div className="flex-1 flex justify-center max-w-md mx-auto">
        <div className="w-full relative hidden md:block">
          <Search size={14} className="absolute left-3 top-2.5" style={{ color: C.textFaint }} />
          <input placeholder="Search case ID, account, location…" className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none"
            style={{ background: C.panel, border: `1px solid ${C.border}`, color: C.text }} />
        </div>
      </div>
      <div className="relative">
        <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
          <Bell size={16} style={{ color: C.textMute }} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold" style={{ background: C.critical, color: "white" }}>
            {ALERTS.filter(a => a.severity === "CRITICAL").length}
          </span>
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-11 w-80 rounded-xl overflow-hidden z-30" style={{ background: C.bgElevated, border: `1px solid ${C.border}` }}>
            <div className="px-4 py-3 text-[13px] font-semibold" style={{ borderBottom: `1px solid ${C.borderSoft}`, color: C.text }}>Live alerts</div>
            <div className="max-h-80 overflow-y-auto">
              {ALERTS.slice(0, 5).map(a => (
                <div key={a.id} className="px-4 py-3 flex gap-2.5" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: RISK_COLORS[a.severity] }} />
                  <div>
                    <p className="text-[12.5px]" style={{ color: C.text }}>{a.text}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: C.textFaint }}>{a.caseId} · {a.minsAgo}m ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2.5 pl-2.5" style={{ borderLeft: `1px solid ${C.borderSoft}` }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.panelAlt }}>
          <User size={15} style={{ color: C.textMute }} />
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-[12.5px] font-medium" style={{ color: C.text }}>{roleLabel}</p>
        </div>
        <button onClick={onLogout} className="p-1.5 rounded-md" style={{ color: C.textFaint }}><LogOut size={15} /></button>
      </div>
    </header>
  );
}

/* ============================================================================
   DASHBOARD VIEW
============================================================================ */
function DashboardView({ goToComplaint }) {
  const totalComplaints = COMPLAINTS.length;
  const activeInv = COMPLAINTS.filter(c => c.status === "Under Investigation" || c.status === "High Risk").length;
  const highRisk = COMPLAINTS.filter(c => c.riskLevel === "CRITICAL" || c.riskLevel === "HIGH").length;
  const amountAtRisk = COMPLAINTS.reduce((s, c) => s + c.amount, 0);
  const actionNeeded = COMPLAINTS.filter(c => c.status === "Action Required").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard icon={FileWarning} label="Total Complaints" value={totalComplaints} delta="12%" deltaUp accent={C.blue} />
        <KPICard icon={Activity} label="Active Investigations" value={activeInv} delta="5%" deltaUp accent={C.teal} />
        <KPICard icon={ShieldAlert} label="High Risk Cases" value={highRisk} delta="8%" deltaUp accent={C.high} />
        <KPICard icon={Target} label="Predicted Locations" value={COMPLAINTS.length * 3} accent={C.violet} />
        <KPICard icon={Wallet} label="Amount at Risk" value={fmtINR(amountAtRisk)} delta="3%" accent={C.amber} />
        <KPICard icon={Siren} label="Needs Immediate Action" value={actionNeeded} delta="2%" deltaUp accent={C.critical} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Complaint Trend" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TREND}>
              <defs>
                <linearGradient id="gComplaints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.amber} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="month" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="complaints" stroke={C.amber} fill="url(#gComplaints)" strokeWidth={2} name="Complaints" />
              <Line type="monotone" dataKey="resolved" stroke={C.teal} strokeWidth={2} dot={false} name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Risk Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={RISK_DIST} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                {RISK_DIST.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
            {RISK_DIST.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-[12px]" style={{ color: C.textMute }}>
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} /> {d.name} ({d.value})
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="Transaction Activity (24h)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={TXN_ACTIVITY}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="hour" stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} interval={1} />
              <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="volume" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Live Alert Feed" right={<span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: C.criticalSoft, color: C.critical }}>{ALERTS.length} active</span>}>
          <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
            {ALERTS.slice(0, 5).map(a => (
              <div key={a.id} className="flex gap-2.5 p-2.5 rounded-lg" style={{ background: C.bgElevated }}>
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 animate-pulse" style={{ background: RISK_COLORS[a.severity] }} />
                <div className="min-w-0">
                  <p className="text-[12px] leading-snug" style={{ color: C.text }}>{a.text}</p>
                  <p className="text-[10.5px] mt-0.5" style={{ color: C.textFaint }}>{a.minsAgo}m ago</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Recent Suspicious Cases" right={<span className="text-[12px]" style={{ color: C.textFaint }}>Showing 6 of {COMPLAINTS.length}</span>}>
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead>
              <tr style={{ color: C.textFaint }} className="text-left text-[11px] uppercase tracking-wide">
                <th className="px-4 py-2 font-medium">Case ID</th>
                <th className="px-4 py-2 font-medium">Fraud Type</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Risk</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {COMPLAINTS.slice(0, 6).map(c => (
                <tr key={c.id} className="cursor-pointer hover:opacity-90" style={{ borderTop: `1px solid ${C.borderSoft}` }} onClick={() => goToComplaint(c.id)}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{c.id}</td>
                  <td className="px-4 py-2.5" style={{ color: C.textMute }}>{c.fraudType}</td>
                  <td className="px-4 py-2.5" style={{ color: C.text }}>{fmtINR(c.amount)}</td>
                  <td className="px-4 py-2.5"><RiskBadge level={c.riskLevel} size="sm" /></td>
                  <td className="px-4 py-2.5"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-2.5 text-right"><ChevronRight size={15} style={{ color: C.textFaint }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================================
   MONEY TRAIL GRAPH (custom SVG)
============================================================================ */
const NODE_STYLE = {
  victim: { color: C.textMute, icon: User },
  source: { color: C.blue, icon: Landmark },
  mule: { color: C.high, icon: AlertTriangle },
  wallet: { color: C.violet, icon: Wallet },
  predicted: { color: C.critical, icon: MapPin },
};

function MoneyTrailGraph({ trail }) {
  const n = trail.nodes.length;
  const W = 900, H = 190;
  const gap = W / (n - 1 + 0.15);
  const positions = trail.nodes.map((node, i) => ({ ...node, cx: 55 + i * gap, cy: H / 2 }));
  const posMap = Object.fromEntries(positions.map(p => [p.id, p]));

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H + 55} viewBox={`0 0 ${W} ${H + 55}`} className="min-w-[720px]">
        {trail.edges.map((e, i) => {
          const a = posMap[e.from], b = posMap[e.to];
          const midX = (a.cx + b.cx) / 2;
          return (
            <g key={i}>
              <line x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
                stroke={e.predicted ? C.critical : C.border} strokeWidth={2}
                strokeDasharray={e.predicted ? "5 4" : "0"} markerEnd="url(#arrow)" />
              <text x={midX} y={a.cy - 32} textAnchor="middle" fontSize="10.5" fill={C.textMute} fontFamily="'JetBrains Mono', monospace">
                {fmtINR(e.amount)}
              </text>
              <text x={midX} y={a.cy - 19} textAnchor="middle" fontSize="9.5" fill={C.textFaint}>
                {e.ts.slice(5)} · x{e.freq}
              </text>
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={C.textFaint} />
          </marker>
        </defs>
        {positions.map((p) => {
          const style = NODE_STYLE[p.type];
          return (
            <g key={p.id}>
              <circle cx={p.cx} cy={p.cy} r={26} fill={C.bgElevated} stroke={style.color} strokeWidth={2.5} />
              <text x={p.cx} y={p.cy + 5} textAnchor="middle" fontSize="15" fill={style.color}>●</text>
              <text x={p.cx} y={p.cy + 48} textAnchor="middle" fontSize="11.5" fontWeight="600" fill={C.text}>{p.label}</text>
              <text x={p.cx} y={p.cy + 63} textAnchor="middle" fontSize="10" fill={C.textFaint} fontFamily="'JetBrains Mono', monospace">{p.sub}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================================
   COMPLAINTS LIST + DETAIL
============================================================================ */
function ComplaintsListView({ onOpen, onNew }) {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? COMPLAINTS : COMPLAINTS.filter(c => c.riskLevel === filter);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
              style={{
                background: filter === f ? C.panelAlt : "transparent",
                border: `1px solid ${filter === f ? C.amber : C.border}`,
                color: filter === f ? C.amber : C.textMute,
              }}>{f === "All" ? "All complaints" : f}</button>
          ))}
        </div>
        <button onClick={onNew} className="flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-lg" style={{ background: C.amber, color: "#20160A" }}>
          <Plus size={15} /> New Complaint
        </button>
      </div>
      <Panel>
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-[13px] min-w-[820px]">
            <thead>
              <tr style={{ color: C.textFaint }} className="text-left text-[11px] uppercase tracking-wide">
                <th className="px-4 py-2 font-medium">Case ID</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Fraud Type</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Risk</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Officer</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="cursor-pointer hover:opacity-90" style={{ borderTop: `1px solid ${C.borderSoft}` }} onClick={() => onOpen(c.id)}>
                  <td className="px-4 py-2.5 font-medium" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{c.id}</td>
                  <td className="px-4 py-2.5" style={{ color: C.textMute }}>{c.date}</td>
                  <td className="px-4 py-2.5" style={{ color: C.textMute }}>{c.fraudType}</td>
                  <td className="px-4 py-2.5" style={{ color: C.text }}>{fmtINR(c.amount)}</td>
                  <td className="px-4 py-2.5"><RiskBadge level={c.riskLevel} size="sm" /></td>
                  <td className="px-4 py-2.5"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-2.5" style={{ color: C.textMute }}>{c.officer}</td>
                  <td className="px-4 py-2.5 text-right"><ChevronRight size={15} style={{ color: C.textFaint }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function NewComplaintModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState("form");
  return (
    <Modal open={open} onClose={() => { onClose(); setStep("form"); }} title="New Cybercrime Complaint" wide>
      {step === "form" ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ["Complaint Date", "date"], ["Fraud Type", "select"], ["Fraud Amount (₹)", "number"],
              ["Transaction Timestamp", "datetime-local"], ["Source Account", "text"], ["Destination Account", "text"],
              ["UPI / Wallet ID (masked)", "text"], ["Transaction Count", "number"],
            ].map(([label, type]) => (
              <div key={label}>
                <label className="text-[11.5px] font-medium block mb-1.5" style={{ color: C.textMute }}>{label}</label>
                {type === "select" ? (
                  <select className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text }}>
                    {FRAUD_TYPES.map(f => <option key={f}>{f}</option>)}
                  </select>
                ) : (
                  <input type={type} placeholder={type === "text" ? "e.g. syn.user482@mockpay" : undefined}
                    className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text }} />
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="text-[11.5px] font-medium block mb-1.5" style={{ color: C.textMute }}>Previous Transaction History / Notes</label>
            <textarea rows={3} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none" style={{ background: C.bgElevated, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: C.borderSoft }}>
            <span className="text-[11px]" style={{ color: C.textFaint }}>All fields are synthetic — no real financial data is stored.</span>
            <button onClick={() => setStep("done")} className="text-[13px] font-semibold px-4 py-2 rounded-lg" style={{ background: C.amber, color: "#20160A" }}>
              Submit complaint
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <CheckCircle2 size={36} style={{ color: C.low }} className="mx-auto mb-3" />
          <p className="font-semibold text-[15px]" style={{ color: C.text }}>Complaint registered</p>
          <p className="text-[13px] mt-1" style={{ color: C.textMute }}>Assigned ID CYB-{int(20240000, 20249999)}-{pad(int(1, 999), 3)}. Run analysis to generate a prediction.</p>
          <button onClick={() => { onClose(); setStep("form"); }} className="mt-5 text-[13px] font-medium px-4 py-2 rounded-lg" style={{ background: C.panelAlt, color: C.text }}>Close</button>
        </div>
      )}
    </Modal>
  );
}

function ComplaintDetail({ complaint, onBack, onOpenReport }) {
  const [tab, setTab] = useState("overview");
  const [analyzed, setAnalyzed] = useState(false);
  const [predicted, setPredicted] = useState(false);
  const trail = useMemo(() => genMoneyTrail(complaint), [complaint.id]);
  const predictions = useMemo(() => genPredictions(complaint, trail), [complaint.id]);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "trail", label: "Money Trail" },
    { id: "prediction", label: "Prediction" },
    { id: "risk", label: "Risk Score" },
    { id: "xai", label: "Explainable AI" },
    { id: "intel", label: "Intelligence" },
  ];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.textMute }}>
        <ChevronLeft size={15} /> Back to complaints
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{complaint.id}</h2>
            <RiskBadge level={complaint.riskLevel} />
            <StatusPill status={complaint.status} />
          </div>
          <p className="text-[13px] mt-1" style={{ color: C.textMute }}>{complaint.fraudType} · Filed {complaint.date} · {fmtINR(complaint.amount)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setAnalyzed(true)} className="text-[12.5px] font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5" style={{ background: C.panelAlt, color: C.text, border: `1px solid ${C.border}` }}>
            <Network size={14} /> Analyze Complaint
          </button>
          <button onClick={() => { setAnalyzed(true); setPredicted(true); setTab("prediction"); }} className="text-[12.5px] font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5" style={{ background: C.panelAlt, color: C.text, border: `1px solid ${C.border}` }}>
            <Brain size={14} /> Predict Next Location
          </button>
          <button onClick={onOpenReport} className="text-[12.5px] font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5" style={{ background: C.amber, color: "#20160A" }}>
            <FileText size={14} /> Generate Intelligence Report
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: C.borderSoft }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap"
            style={{ color: tab === t.id ? C.amber : C.textMute, borderBottom: tab === t.id ? `2px solid ${C.amber}` : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Panel title="Complaint Details" className="lg:col-span-2">
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              {[
                ["Victim", complaint.victim], ["Source Account", complaint.sourceAccount],
                ["Destination Account", complaint.destAccount], ["UPI / Wallet ID", complaint.upi],
                ["Transaction Count", complaint.txnCount], ["Transaction Timestamp", complaint.txnTimestamp],
                ["Assigned Officer", complaint.officer], ["Origin Location", LOCATIONS.find(l => l.id === complaint.originLocation)?.name],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <span style={{ color: C.textFaint }}>{k}</span>
                  <span style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Status">
            <div className="flex flex-col items-center py-2">
              <GaugeRisk score={complaint.riskScore} />
              <RiskBadge level={complaint.riskLevel} />
              <p className="text-[12px] text-center mt-3" style={{ color: C.textMute }}>
                {analyzed ? "Analysis complete — money trail and risk factors are ready." : "Run \"Analyze Complaint\" to build the money-trail graph."}
              </p>
            </div>
          </Panel>
        </div>
      )}

      {tab === "trail" && (
        <Panel title="Money Trail Analysis" right={<span className="text-[12px]" style={{ color: C.textFaint }}>{trail.hops} hops detected</span>}>
          <MoneyTrailGraph trail={trail} />
          <div className="grid sm:grid-cols-4 gap-3 mt-5">
            {trail.accounts.map(a => (
              <div key={a.id} className="p-3 rounded-lg" style={{ background: C.bgElevated }}>
                <p className="text-[11px]" style={{ color: C.textFaint }}>{a.type} account</p>
                <p className="text-[13px] font-medium mt-0.5" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{a.id}</p>
                <p className="text-[11.5px] mt-1" style={{ color: C.textMute }}>Risk score: <span style={{ color: RISK_COLORS[riskLevel(a.riskScore)] }}>{a.riskScore}</span></p>
              </div>
            ))}
            <div className="p-3 rounded-lg" style={{ background: C.bgElevated }}>
              <p className="text-[11px]" style={{ color: C.textFaint }}>Number of hops</p>
              <p className="text-[13px] font-medium mt-0.5" style={{ color: C.text }}>{trail.hops}</p>
              <p className="text-[11.5px] mt-1 flex items-center gap-1" style={{ color: C.high }}><AlertTriangle size={11} /> Multi-hop laundering pattern</p>
            </div>
          </div>
        </Panel>
      )}

      {tab === "prediction" && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg flex items-start gap-2.5 text-[12.5px]" style={{ background: C.amberSoft, color: C.amber, border: `1px solid ${C.amber}33` }}>
            <CircleAlert size={16} className="shrink-0 mt-0.5" />
            Predictions are decision-support signals derived from synthetic pattern data — investigators must verify before acting.
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {predictions.map(p => (
              <Panel key={p.rank} title={`Predicted Location #${p.rank}`} right={<RiskBadge level={riskLevel(p.riskScore)} size="sm" />}>
                <p className="text-[14px] font-semibold" style={{ color: C.text }}>{p.location}</p>
                <p className="text-[11.5px] mb-3" style={{ color: C.textFaint }}>{p.type} · {p.zone}</p>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11.5px] mb-1" style={{ color: C.textMute }}><span>Probability</span><span style={{ color: C.text }}>{p.probability}%</span></div>
                    <ProbabilityBar value={p.probability} color={C.amber} />
                  </div>
                  <div className="flex justify-between text-[12px]"><span style={{ color: C.textMute }}>Risk score</span><span style={{ color: C.text }}>{p.riskScore}/100</span></div>
                  <div className="flex justify-between text-[12px]"><span style={{ color: C.textMute }}>Expected window</span><span style={{ color: C.text }}>{p.window}</span></div>
                  <p className="text-[11.5px] pt-2" style={{ color: C.textFaint, borderTop: `1px solid ${C.borderSoft}` }}>{p.reason}</p>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}

      {tab === "risk" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Panel title="Composite Risk Score">
            <div className="flex flex-col items-center py-2">
              <GaugeRisk score={complaint.riskScore} />
              <p className="text-[13px] font-medium mt-2" style={{ color: RISK_COLORS[complaint.riskLevel] }}>{complaint.riskLevel} RISK</p>
            </div>
          </Panel>
          <Panel title="Contributing Factors" className="lg:col-span-2">
            <div className="space-y-3">
              {[
                ["Transaction velocity", int(60, 95)], ["Transaction amount", int(50, 90)],
                ["Intermediary accounts", int(55, 92)], ["Previous suspicious behavior", int(40, 88)],
                ["Time pattern anomaly", int(35, 80)], ["Geographic distance", int(30, 75)],
                ["Cash withdrawal history", int(45, 85)], ["Network / graph connections", int(50, 90)],
              ].map(([label, val]) => (
                <div key={label}>
                  <div className="flex justify-between text-[12.5px] mb-1"><span style={{ color: C.textMute }}>{label}</span><span style={{ color: C.text }}>{val}</span></div>
                  <ProbabilityBar value={val} color={RISK_COLORS[riskLevel(val)]} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === "xai" && (
        <Panel title="Why was this location predicted?">
          <div className="space-y-3 max-w-xl">
            {FACTOR_LABELS.map(([label, val]) => (
              <div key={label}>
                <div className="flex justify-between text-[12.5px] mb-1"><span style={{ color: C.textMute }}>{label}</span><span style={{ color: C.text }}>{val}%</span></div>
                <ProbabilityBar value={val} color={C.teal} />
              </div>
            ))}
          </div>
          <p className="text-[12.5px] mt-5 p-3 rounded-lg" style={{ background: C.bgElevated, color: C.textMute }}>
            The prediction is based on historical transaction patterns, money-trail structure, temporal behavior and geographic relationships in the synthetic dataset.
          </p>
        </Panel>
      )}

      {tab === "intel" && (
        <Panel>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.criticalSoft }}>
              <Siren size={19} style={{ color: C.critical }} />
            </div>
            <div>
              <p className="font-semibold text-[15px]" style={{ color: C.critical }}>Urgent action recommended</p>
              <p className="text-[13px] mt-1" style={{ color: C.text }}>
                Predicted withdrawal: <strong>{predictions[0].location}</strong> · Confidence {predictions[0].probability}% · Expected in {predictions[0].window} · Risk {riskLevel(predictions[0].riskScore)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {["Alert nearest cybercrime/police unit", "Monitor predicted location", "Flag suspicious transaction via authorized procedure", "Continue transaction monitoring", "Verify new transaction activity"].map(a => (
              <div key={a} className="flex items-center gap-2.5 text-[13px] p-2.5 rounded-lg" style={{ background: C.bgElevated, color: C.text }}>
                <CheckCircle2 size={15} style={{ color: C.low }} /> {a}
              </div>
            ))}
          </div>
          <p className="text-[11.5px] mt-4 flex items-start gap-1.5" style={{ color: C.textFaint }}>
            <CircleAlert size={13} className="shrink-0 mt-0.5" /> This is decision-support information, not certainty. Investigators must verify before acting.
          </p>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================================
   REPORT MODAL
============================================================================ */
function ReportModal({ open, onClose, complaint }) {
  if (!complaint) return null;
  const trail = genMoneyTrail(complaint);
  const predictions = genPredictions(complaint, trail);
  return (
    <Modal open={open} onClose={onClose} title="Intelligence Report" wide>
      <div className="space-y-5 text-[13px]" style={{ color: C.text }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[15px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{complaint.id}</p>
            <p style={{ color: C.textMute }}>Generated {new Date().toISOString().slice(0, 16).replace("T", " ")}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{ background: C.panelAlt, border: `1px solid ${C.border}` }}><Printer size={13} /> Print</button>
            <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{ background: C.amber, color: "#20160A" }}><Download size={13} /> Export PDF</button>
          </div>
        </div>
        <section>
          <h4 className="text-[11px] uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Complaint Summary</h4>
          <p style={{ color: C.textMute }}>{complaint.fraudType} reported on {complaint.date} involving {fmtINR(complaint.amount)}. Filed against source account {complaint.sourceAccount}, currently {complaint.status}.</p>
        </section>
        <section>
          <h4 className="text-[11px] uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Money Trail</h4>
          <p style={{ color: C.textMute }}>{trail.hops} hops: victim → {complaint.sourceAccount} → {trail.accounts[0].id} → {trail.accounts[1].id} → wallet {complaint.upi} → predicted withdrawal at {trail.predictedLoc.name}.</p>
        </section>
        <section className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-[11px] uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Risk Score</h4>
            <p className="text-2xl font-bold" style={{ color: RISK_COLORS[complaint.riskLevel] }}>{complaint.riskScore}/100</p>
            <RiskBadge level={complaint.riskLevel} size="sm" />
          </div>
          <div>
            <h4 className="text-[11px] uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Top Predicted Location</h4>
            <p className="font-medium">{predictions[0].location}</p>
            <p style={{ color: C.textMute }}>{predictions[0].probability}% confidence · {predictions[0].window}</p>
          </div>
        </section>
        <section>
          <h4 className="text-[11px] uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Key Factors</h4>
          <div className="flex flex-wrap gap-2">
            {FACTOR_LABELS.map(([l, v]) => <span key={l} className="text-[11.5px] px-2.5 py-1 rounded-md" style={{ background: C.bgElevated, color: C.textMute }}>{l} · {v}%</span>)}
          </div>
        </section>
        <section>
          <h4 className="text-[11px] uppercase tracking-wide mb-2" style={{ color: C.textFaint }}>Recommended Actions</h4>
          <ul className="list-disc pl-5 space-y-1" style={{ color: C.textMute }}>
            <li>Alert nearest cybercrime/police unit</li>
            <li>Monitor predicted location during expected window</li>
            <li>Flag suspicious transaction via authorized procedure</li>
          </ul>
        </section>
        <p className="text-[11px] pt-3" style={{ color: C.textFaint, borderTop: `1px solid ${C.borderSoft}` }}>
          Synthetic demo report. Predictions require human verification before action.
        </p>
      </div>
    </Modal>
  );
}

/* ============================================================================
   MAP VIEW (stylized tactical map — fictional zones, no real geodata)
============================================================================ */
function MapView() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const filterOptions = ["All", "ATM", "Bank Branch", "Merchant", "High Risk", "Predicted"];
  const predictedIds = useMemo(() => new Set(COMPLAINTS.slice(0, 6).map(c => {
    const t = genMoneyTrail(c);
    return t.predictedLoc.id;
  })), []);

  const visible = LOCATIONS.filter(l => {
    if (typeFilter === "All") return true;
    if (typeFilter === "High Risk") return l.riskZone === "HIGH" || l.riskZone === "CRITICAL";
    if (typeFilter === "Predicted") return predictedIds.has(l.id);
    return l.type === typeFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} className="text-[12px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            style={{ background: typeFilter === f ? C.panelAlt : "transparent", border: `1px solid ${typeFilter === f ? C.amber : C.border}`, color: typeFilter === f ? C.amber : C.textMute }}>
            <Filter size={12} /> {f}
          </button>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden relative" style={{ border: `1px solid ${C.border}`, background: "#0D1830", height: 520 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={"v" + i} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke={C.borderSoft} strokeWidth="0.15" />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={"h" + i} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke={C.borderSoft} strokeWidth="0.15" />
            ))}
          </svg>
          {visible.map(l => {
            const isPredicted = predictedIds.has(l.id);
            const color = isPredicted ? C.critical : RISK_COLORS[l.riskZone];
            return (
              <button key={l.id} onClick={() => setSelected(l)}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group"
                style={{ left: `${l.x}%`, top: `${l.y}%` }}>
                <span className="rounded-full flex items-center justify-center transition-transform group-hover:scale-125"
                  style={{ width: isPredicted ? 16 : 11, height: isPredicted ? 16 : 11, background: color, boxShadow: `0 0 0 4px ${color}22` }} />
              </button>
            );
          })}
          <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 p-2.5 rounded-lg text-[11px]" style={{ background: "#0B1220CC", color: C.textMute }}>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: C.critical }} /> Predicted withdrawal</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: C.high }} /> High-risk zone</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: C.low }} /> Standard location</span>
          </div>
        </div>
        <Panel title={selected ? selected.name : "Location Detail"}>
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <RiskBadge level={selected.riskZone} size="sm" />
                <span className="text-[12px]" style={{ color: C.textMute }}>{selected.type} · {selected.zone}</span>
              </div>
              {predictedIds.has(selected.id) && (
                <div className="p-3 rounded-lg text-[12.5px]" style={{ background: C.criticalSoft, color: C.critical }}>
                  Flagged as a predicted withdrawal point for an active case.
                </div>
              )}
              <div className="text-[12.5px] space-y-2">
                <div className="flex justify-between" style={{ color: C.textMute }}><span>Withdrawals (30d)</span><span style={{ color: C.text }}>{selected.withdrawalsLast30d}</span></div>
                <div className="flex justify-between" style={{ color: C.textMute }}><span>Location ID</span><span style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{selected.id}</span></div>
              </div>
              <p className="text-[11.5px] pt-2" style={{ color: C.textFaint, borderTop: `1px solid ${C.borderSoft}` }}>
                Supporting evidence: transaction-pattern and network-adjacency match from linked case money-trails.
              </p>
            </div>
          ) : (
            <EmptyState icon={MapPin} title="No location selected" sub="Click a marker on the map to view prediction detail." />
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================================
   CASE MANAGEMENT
============================================================================ */
function CasesView() {
  const [selected, setSelected] = useState(null);
  if (selected) {
    const c = selected;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-[13px]" style={{ color: C.textMute }}><ChevronLeft size={15} /> Back to cases</button>
        <div className="grid lg:grid-cols-3 gap-4">
          <Panel title="Case Details" className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <h3 className="font-semibold" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{c.caseId}</h3>
              <RiskBadge level={c.riskLevel} size="sm" /><StatusPill status={c.status} />
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              {[["Fraud type", c.fraudType], ["Amount", fmtINR(c.amount)], ["Assigned officer", c.officer], ["Filed", c.date]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
                  <span style={{ color: C.textFaint }}>{k}</span><span style={{ color: C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Investigation Timeline">
            <div className="space-y-0">
              {c.timeline.map((t, i) => (
                <div key={i} className="flex gap-3 pb-4 relative">
                  {i < c.timeline.length - 1 && <span className="absolute left-[7px] top-4 bottom-0 w-px" style={{ background: C.borderSoft }} />}
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: t.done ? C.low : C.borderSoft }}>
                    {t.done && <CheckCircle2 size={12} style={{ color: "#0B1220" }} />}
                  </span>
                  <div>
                    <p className="text-[12.5px]" style={{ color: t.done ? C.text : C.textFaint }}>{t.label}</p>
                    <p className="text-[10.5px]" style={{ color: C.textFaint }}>{t.t}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }
  return (
    <Panel title="All Cases">
      <div className="overflow-x-auto -mx-4">
        <table className="w-full text-[13px] min-w-[760px]">
          <thead>
            <tr style={{ color: C.textFaint }} className="text-left text-[11px] uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Case ID</th><th className="px-4 py-2 font-medium">Officer</th>
              <th className="px-4 py-2 font-medium">Risk</th><th className="px-4 py-2 font-medium">Prediction</th>
              <th className="px-4 py-2 font-medium">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {CASES.map(c => (
              <tr key={c.caseId} className="cursor-pointer hover:opacity-90" style={{ borderTop: `1px solid ${C.borderSoft}` }} onClick={() => setSelected(c)}>
                <td className="px-4 py-2.5 font-medium" style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{c.caseId}</td>
                <td className="px-4 py-2.5" style={{ color: C.textMute }}>{c.officer}</td>
                <td className="px-4 py-2.5"><RiskBadge level={c.riskLevel} size="sm" /></td>
                <td className="px-4 py-2.5" style={{ color: C.textMute }}>{["High Risk", "Action Required", "Resolved"].includes(c.status) ? "Generated" : "Pending"}</td>
                <td className="px-4 py-2.5"><StatusPill status={c.status} /></td>
                <td className="px-4 py-2.5 text-right"><ChevronRight size={15} style={{ color: C.textFaint }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ============================================================================
   ALERTS VIEW
============================================================================ */
function AlertsView() {
  const [sev, setSev] = useState("All");
  const filtered = sev === "All" ? ALERTS : ALERTS.filter(a => a.severity === sev);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["All", ...ALERT_SEVERITIES].map(s => (
          <button key={s} onClick={() => setSev(s)} className="text-[12px] font-medium px-3 py-1.5 rounded-lg"
            style={{ background: sev === s ? C.panelAlt : "transparent", border: `1px solid ${sev === s ? C.amber : C.border}`, color: sev === s ? C.amber : C.textMute }}>{s}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(a => (
          <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: RISK_SOFT[a.severity], border: `1px solid ${RISK_COLORS[a.severity]}33` }}>
            <ShieldAlert size={18} style={{ color: RISK_COLORS[a.severity] }} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-bold" style={{ color: RISK_COLORS[a.severity] }}>{a.severity} ALERT</span>
                <span className="text-[11px]" style={{ color: C.textFaint }}>{a.caseId} · {a.minsAgo}m ago</span>
              </div>
              <p className="text-[13.5px] mt-1" style={{ color: C.text }}>{a.text}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState icon={Siren} title="No alerts at this severity" />}
      </div>
    </div>
  );
}

/* ============================================================================
   ANALYTICS VIEW
============================================================================ */
function AnalyticsView() {
  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Complaints by Month">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TREND}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="month" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="complaints" fill={C.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Prediction Accuracy Trend">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ACCURACY_TREND}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="month" stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={12} tickLine={false} axisLine={false} domain={[50, 100]} />
              <Tooltip contentStyle={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="accuracy" stroke={C.teal} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Most Common Fraud Types">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={FRAUD_TYPE_DIST} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke={C.borderSoft} horizontal={false} />
              <XAxis type="number" stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={110} />
              <Tooltip contentStyle={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" fill={C.amber} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Average Money-Trail Length (hops/week)">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={HOP_LENGTHS}>
              <defs>
                <linearGradient id="gHops" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.violet} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="case" stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="hops" stroke={C.violet} fill="url(#gHops)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <KPICard icon={Target} label="Avg. Prediction Accuracy" value="84%" delta="4%" deltaUp accent={C.teal} />
        <KPICard icon={Zap} label="Interventions this month" value={int(14, 28)} delta="6%" deltaUp accent={C.amber} />
        <KPICard icon={Network} label="Avg. Money-Trail Hops" value="4.6" accent={C.violet} />
      </div>
    </div>
  );
}

/* ============================================================================
   ADMIN PANEL
============================================================================ */
function AdminView() {
  const [tab, setTab] = useState("users");
  const tabs = [
    { id: "users", label: "Users", icon: Users },
    { id: "thresholds", label: "Risk Thresholds", icon: SlidersHorizontal },
    { id: "dataset", label: "Synthetic Dataset", icon: Database },
    { id: "audit", label: "Audit Logs", icon: History },
  ];
  const users = [
    { name: "Insp. R. Mehta", role: "Police Officer", status: "Active" },
    { name: "SI A. Kulkarni", role: "Cybercrime Analyst", status: "Active" },
    { name: "ACP S. Rao", role: "Police Officer", status: "Active" },
    { name: "admin.control", role: "Admin", status: "Active" },
    { name: "SI D. Verma", role: "Cybercrime Analyst", status: "Suspended" },
  ];
  const audit = [
    { who: "analyst.kulkarni", action: "Ran prediction on CYB-20240412-006", t: "6m ago" },
    { who: "officer.mehta", action: "Generated intelligence report for CYB-20240298-011", t: "24m ago" },
    { who: "admin.control", action: "Updated CRITICAL risk threshold to 81", t: "1h ago" },
    { who: "analyst.kulkarni", action: "Viewed money-trail graph for CYB-20240187-003", t: "2h ago" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: C.borderSoft }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap"
            style={{ color: tab === t.id ? C.amber : C.textMute, borderBottom: tab === t.id ? `2px solid ${C.amber}` : "2px solid transparent" }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>
      {tab === "users" && (
        <Panel title="Manage Users" right={<button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg" style={{ background: C.amber, color: "#20160A" }}><Plus size={13} /> Add user</button>}>
          <div className="divide-y" style={{ borderColor: C.borderSoft }}>
            {users.map(u => (
              <div key={u.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.panelAlt }}><User size={14} style={{ color: C.textMute }} /></div>
                  <div><p className="text-[13px] font-medium" style={{ color: C.text }}>{u.name}</p><p className="text-[11.5px]" style={{ color: C.textFaint }}>{u.role}</p></div>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ color: u.status === "Active" ? C.low : C.critical, background: u.status === "Active" ? C.lowSoft : C.criticalSoft }}>{u.status}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {tab === "thresholds" && (
        <Panel title="Risk Thresholds">
          <div className="space-y-4 max-w-md">
            {[["Low", "0", "30", C.low], ["Medium", "31", "60", C.medium], ["High", "61", "80", C.high], ["Critical", "81", "100", C.critical]].map(([label, min, max, color]) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: C.bgElevated }}>
                <span className="text-[13px] font-medium flex items-center gap-2" style={{ color }}><span className="w-2 h-2 rounded-full" style={{ background: color }} />{label}</span>
                <span className="text-[12.5px]" style={{ color: C.textMute, fontFamily: "'JetBrains Mono', monospace" }}>{min} – {max}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {tab === "dataset" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <KPICard icon={FileWarning} label="Synthetic complaints" value={COMPLAINTS.length} accent={C.blue} />
          <KPICard icon={CreditCard} label="Synthetic accounts" value={ACCOUNTS.length} accent={C.violet} />
          <KPICard icon={MapPin} label="Synthetic locations" value={LOCATIONS.length} accent={C.teal} />
          <Panel title="Regenerate Dataset" className="sm:col-span-3">
            <p className="text-[13px] mb-3" style={{ color: C.textMute }}>Regenerating creates a new fictional dataset — no production data exists in this environment.</p>
            <button className="flex items-center gap-1.5 text-[12.5px] font-medium px-3.5 py-2 rounded-lg" style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text }}>
              <RefreshCw size={13} /> Regenerate synthetic dataset
            </button>
          </Panel>
        </div>
      )}
      {tab === "audit" && (
        <Panel title="Audit Log">
          <div className="divide-y" style={{ borderColor: C.borderSoft }}>
            {audit.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <Fingerprint size={15} className="mt-0.5" style={{ color: C.textFaint }} />
                <div className="flex-1">
                  <p className="text-[13px]" style={{ color: C.text }}>{a.action}</p>
                  <p className="text-[11.5px]" style={{ color: C.textFaint }}>{a.who} · {a.t}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================================
   ROOT APP
============================================================================ */
const VIEW_TITLES = {
  dashboard: "Command Dashboard", complaints: "Complaints", map: "GIS Prediction Map",
  cases: "Case Management", alerts: "Alerts", analytics: "Analytics", admin: "Admin Panel",
};

export default function App() {
  const [stage, setStage] = useState("landing"); // landing | login | app
  const [role, setRole] = useState(null);
  const [view, setView] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [newComplaintOpen, setNewComplaintOpen] = useState(false);
  const [reportComplaint, setReportComplaint] = useState(null);

  const fontLink = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      * { font-family: 'Inter', sans-serif; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
    `}</style>
  );

  if (stage === "landing") {
    return <>{fontLink}<LandingPage onEnter={() => setStage("login")} /></>;
  }
  if (stage === "login") {
    return <>{fontLink}<LoginPage onLogin={(r) => { setRole(r); setStage("app"); setView("dashboard"); }} /></>;
  }

  const selectedComplaint = COMPLAINTS.find(c => c.id === selectedComplaintId);

  return (
    <div className="flex h-screen w-full" style={{ background: C.bg }}>
      {fontLink}
      <Sidebar view={view} setView={(v) => { setView(v); setSelectedComplaintId(null); }} role={role}
        collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header role={role} onLogout={() => { setStage("landing"); setRole(null); }} setMobileOpen={setMobileOpen}
          title={selectedComplaint ? "Complaint Detail" : VIEW_TITLES[view]} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {view === "dashboard" && <DashboardView goToComplaint={(id) => { setView("complaints"); setSelectedComplaintId(id); }} />}
          {view === "complaints" && (
            selectedComplaint
              ? <ComplaintDetail complaint={selectedComplaint} onBack={() => setSelectedComplaintId(null)} onOpenReport={() => setReportComplaint(selectedComplaint)} />
              : <ComplaintsListView onOpen={setSelectedComplaintId} onNew={() => setNewComplaintOpen(true)} />
          )}
          {view === "map" && <MapView />}
          {view === "cases" && <CasesView />}
          {view === "alerts" && <AlertsView />}
          {view === "analytics" && <AnalyticsView />}
          {view === "admin" && <AdminView />}
        </main>
      </div>
      <NewComplaintModal open={newComplaintOpen} onClose={() => setNewComplaintOpen(false)} />
      <ReportModal open={!!reportComplaint} onClose={() => setReportComplaint(null)} complaint={reportComplaint} />
    </div>
  );
}
