import React, { useState, useEffect, useRef } from "react";

// ── Theme Configuration ──────────────────────────────────────────────────────
const GOLD = "#D4AF37";
const T = {
  bg: "#0F172A",
  card: "#1E293B",
  text: "#F8FAFC",
  muted: "#94A3B8",
  border: "#334155",
  success: "#16a34a",
  danger: "#ef4444"
};

// ── Main App Controller ──────────────────────────────────────────────────────
export default function YawmiyatiApp() {
  const [activeTab, setActiveTab] = useState("prayer"); // 'prayer', 'adhkar', 'journey'
  const [showMore, setShowMore] = useState(false);

  return (
    <div style={styles.appShell}>
      {/* ── Contextual Content ── */}
      <div style={styles.mainContent}>
        {activeTab === "prayer" && <PrayerModule />}
        {activeTab === "adhkar" && <AdhkarModule />}
        {activeTab === "journey" && <JourneyModule />}
      </div>

      {/* ── Global Bottom Navigation ── */}
      <nav style={styles.bottomNav}>
        <TabBtn active={activeTab === "prayer"} label="Prayer" icon="🕌" onClick={() => setActiveTab("prayer")} />
        <TabBtn active={activeTab === "adhkar"} label="Adhkar" icon="📿" onClick={() => setActiveTab("adhkar")} />
        <TabBtn active={activeTab === "journey"} label="Journey" icon="🌟" onClick={() => setActiveTab("journey")} />
        <button style={styles.moreTabBtn} onClick={() => setShowMore(true)}><span>⋮</span><small>More</small></button>
      </nav>

      {/* ── Global More/Metrics Overlay ── */}
      {showMore && <MoreOverlay onClose={() => setShowMore(false)} />}
    </div>
  );
}

// ── 1. Prayer Module (The Ritual) ───────────────────────────────────────────
function PrayerModule() {
  return (
    <div style={styles.modulePadding}>
      <header style={styles.moduleHeader}>
        <h2 style={styles.title}>Doha, Qatar</h2>
        <span style={styles.dateText}>Thursday, 1 Ramadan</span>
      </header>
      <div style={styles.prayerCardActive}>
        <span style={styles.prayerName}>Asr</span>
        <span style={styles.prayerTime}>3:30 PM</span>
        <div style={styles.countdown}>Next in 1h 20m</div>
      </div>
      {/* List of other prayers... */}
    </div>
  );
}

// ── 2. Adhkar Module (Classic Post-Prayer) ──────────────────────────────────
function AdhkarModule() {
  const [count, setCount] = useState(0);
  const goal = 33;

  return (
    <div style={styles.modulePadding} onClick={() => count < goal && setCount(count + 1)}>
      <div style={styles.adhkarContent}>
        <h1 style={styles.arabicLarge}>سُبْحَانَ اللَّهِ</h1>
        <p style={styles.translit}>SubhanAllah</p>
        
        <div style={styles.counterCircle}>
          <div style={styles.bigNum}>{count}</div>
          <div style={styles.goalText}>/ {goal}</div>
        </div>
      </div>
      <p style={styles.hintText}>Tap anywhere to count</p>
    </div>
  );
}

// ── 3. Journey Module (Charity, Quran, Fasting) ──────────────────────────────
function JourneyModule() {
  return (
    <div style={styles.modulePadding}>
      <h2 style={styles.title}>Spiritual Journey</h2>
      
      <div style={styles.journeyGrid}>
        <JourneyCard icon="🌙" title="Fasting" desc="Day 1 - Ramadan" progress={100} />
        <JourneyCard icon="📖" title="Quran" desc="Juz 1, Page 12" progress={40} />
        <JourneyCard icon="🤝" title="Charity" desc="3 Acts logged today" progress={60} />
      </div>
    </div>
  );
}

// ── 4. More & Metrics Overlay ────────────────────────────────────────────────
function MoreOverlay({ onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()}>
        <div style={styles.handle} />
        <h3 style={{ marginBottom: "20px" }}>Metrics & Settings</h3>
        
        <div style={styles.metricRow}>
          <span>Monthly Fasting</span>
          <span style={{ color: GOLD }}>12 Days</span>
        </div>
        <div style={styles.metricRow}>
          <span>Charity Streak</span>
          <span style={{ color: GOLD }}>5 Days</span>
        </div>
        
        <button style={styles.logoutBtn} onClick={() => window.location.reload()}>Restart Application</button>
        <button style={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ── UI Components ────────────────────────────────────────────────────────────
const TabBtn = ({ active, label, icon, onClick }) => (
  <button onClick={onClick} style={{ ...styles.tabBtn, color: active ? GOLD : T.muted }}>
    <span style={{ fontSize: "20px" }}>{icon}</span>
    <small>{label}</small>
  </button>
);

const JourneyCard = ({ icon, title, desc, progress }) => (
  <div style={styles.jCard}>
    <div style={{ fontSize: "24px" }}>{icon}</div>
    <div style={{ flex: 1, marginLeft: "15px" }}>
      <div style={{ fontWeight: "bold" }}>{title}</div>
      <div style={{ fontSize: "12px", color: T.muted }}>{desc}</div>
      <div style={styles.miniBarBg}><div style={{ ...styles.miniBarFill, width: `${progress}%` }} /></div>
    </div>
  </div>
);

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  appShell: { height: "100vh", backgroundColor: T.bg, color: T.text, display: "flex", flexDirection: "column", fontFamily: "sans-serif" },
  mainContent: { flex: 1, overflowY: "auto" },
  bottomNav: { height: "70px", background: T.card, display: "flex", borderTop: `1px solid ${T.border}`, paddingBottom: "10px" },
  tabBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer" },
  moreTabBtn: { flex: 0.8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: T.muted },
  
  modulePadding: { padding: "20px", height: "100%", display: "flex", flexDirection: "column" },
  moduleHeader: { marginBottom: "30px" },
  title: { fontSize: "24px", fontWeight: "bold", margin: 0 },
  dateText: { color: GOLD, fontSize: "14px" },
  
  prayerCardActive: { background: GOLD, color: "#fff", padding: "20px", borderRadius: "16px", marginBottom: "15px", textAlign: "center" },
  prayerName: { display: "block", fontSize: "18px", fontWeight: "bold" },
  prayerTime: { fontSize: "32px", fontWeight: "900" },
  
  adhkarContent: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  arabicLarge: { fontSize: "48px", fontFamily: "serif", marginBottom: "10px" },
  translit: { color: T.muted, fontSize: "18px", marginBottom: "40px" },
  counterCircle: { width: "150px", height: "150px", borderRadius: "50%", border: `4px solid ${GOLD}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  bigNum: { fontSize: "54px", fontWeight: "bold" },
  goalText: { fontSize: "14px", color: T.muted },
  hintText: { textAlign: "center", color: T.muted, fontSize: "12px", marginBottom: "20px" },

  journeyGrid: { display: "flex", flexDirection: "column", gap: "15px" },
  jCard: { background: T.card, padding: "15px", borderRadius: "12px", display: "flex", alignItems: "center" },
  miniBarBg: { height: "4px", background: T.border, borderRadius: "2px", marginTop: "8px" },
  miniBarFill: { height: "100%", background: GOLD, borderRadius: "2px" },

  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 100 },
  sheet: { background: T.card, width: "100%", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "30px" },
  handle: { width: "40px", height: "4px", background: T.border, margin: "-15px auto 20px", borderRadius: "2px" },
  metricRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.border}` },
  closeBtn: { width: "100%", padding: "15px", background: GOLD, border: "none", borderRadius: "12px", color: "#fff", fontWeight: "bold", marginTop: "20px" },
  logoutBtn: { width: "100%", padding: "12px", background: "none", border: `1px solid ${T.danger}`, borderRadius: "12px", color: T.danger, marginTop: "10px" }
};
