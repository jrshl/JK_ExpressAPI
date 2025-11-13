import React, { useState, useEffect, useRef } from "react";
import DailyFact from "./components/DailyFact";
import StackedCards from "./components/StackedCards";
import FactLibrary from "./components/FactLibrary";
import CatGallery from "./components/CatGallery";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import SpeedTyping from "./pages/SpeedTyping";
import TriviaMaster from "./pages/TriviaMaster";
import JumbledFacts from "./pages/JumbledFacts";
import AdminFacts from "./pages/AdminFacts";
import LeaderboardModal from "./components/LeaderboardModal";
import { Settings, Trophy, User } from "lucide-react";
import "./App.css";
import CatCursor from "./components/CatCursor";
import LoaderWrapper from "./components/LoaderWrapper";
import { UserProvider } from "./context/UserContext";
import Login from "./components/Login";
import Register from "./components/Register";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    axios.get("/api/check-auth")
      .then(res => setIsAuth(res.data.authenticated))
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Loading...</div>;
  
  return children;
}

function generateFactId(fact) {
  let hash = 0;
  for (let i = 0; i < fact.length; i++) {
    const char = fact.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const id = Math.abs(hash) % 234 + 1;
  console.log("Generated ID for fact:", fact.substring(0, 50) + "...", "ID:", id);
  return id;
}

function addDaysISO(baseIso, offset) {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function HomePage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [idle, setIdle] = useState(true);
  const [idleDelaySec, setIdleDelaySec] = useState(0);
  const idleDurationSec = 25; 
  const [spinMs, setSpinMs] = useState(3000);
  const wheelInnerRef = useRef(null);
  const [_facts, setFacts] = useState([]);
  const [count, setCount] = useState(1);
  const [showBook, setShowBook] = useState(false);
  const [showCatGallery, setShowCatGallery] = useState(false);
  const [libraryNewIds, setLibraryNewIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("libraryNewIds") || "[]");
    } catch (err) {
      console.warn("Failed to read libraryNewIds:", err);
      return [];
    }
  });
  const [libraryAnimating, setLibraryAnimating] = useState(false);
  const [encounteredFacts, setEncounteredFacts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("encounteredFacts") || "{}");
    } catch (e) {
      console.warn("Failed to parse encounteredFacts from localStorage:", e);
      return {};
    }
  });
  const [showStackedCards, setShowStackedCards] = useState(false);
  const [stackedFacts, setStackedFacts] = useState([]);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [weeklyMap, setWeeklyMap] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState("login");

  const navigate = useNavigate();

  // persist encounteredFacts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("encounteredFacts", JSON.stringify(encounteredFacts));
    } catch (e) {
      console.warn("Failed to persist encounteredFacts to localStorage:", e);
    }
  }, [encounteredFacts]);

  const addEncounteredFact = (id, text) => {
    setEncounteredFacts(prev => {
      if (prev[id]) return prev;
      return { ...prev, [id]: text };
    });
  };

  const markLibraryNewIds = (ids) => {
    if (!Array.isArray(ids)) ids = [ids];
    setLibraryNewIds(prevIds => {
      const next = [...new Set([...prevIds, ...ids])];
      try {
        localStorage.setItem("libraryNewIds", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist libraryNewIds:", e);
      }
      return next;
    });
  };

  const handleOpenLibrary = () => {
    setLibraryAnimating(true);
    setShowBook(true);
    setTimeout(() => setLibraryAnimating(false), 700);
  };

  const markLibraryIdViewed = (id) => {
    setLibraryNewIds(prev => {
      const next = prev.filter(x => String(x) !== String(id));
      try {
        localStorage.setItem("libraryNewIds", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist libraryNewIds after marking viewed:", e);
      }
      return next;
    });
  };

  // Weekly facts logic (same as your previous code)
  useEffect(() => {
    let mounted = true;

    async function ensureWeeklyFacts() {
      const todayIso = new Date().toISOString().slice(0, 10);
      const stored = JSON.parse(localStorage.getItem("weeklyFacts") || "null");

      if (stored && stored.startDate) {
        const start = new Date(stored.startDate);
        const diffDays = Math.floor((new Date(todayIso) - start) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7 && Array.isArray(stored.facts) && stored.facts.length === 7) {
          const map = {};
          for (let i = 0; i < 7; i++) {
            const dayKey = addDaysISO(stored.startDate, i);
            map[dayKey] = stored.facts[i];
            const id = generateFactId(stored.facts[i]);
            addEncounteredFact(id, stored.facts[i]);
          }
          if (mounted) {
            setWeeklyMap(map);
            const shownDate = localStorage.getItem("dailyShownDate");
            if (shownDate !== todayIso) {
              setShowDailyModal(true);
              localStorage.setItem("dailyShownDate", todayIso);
            }
          }
          return;
        }
      }

      const uniqueFacts = [];
      const seenIds = new Set(Object.keys(encounteredFacts).map(k => Number(k)));
      let attempts = 0;

      while (uniqueFacts.length < 7 && attempts < 12) {
        attempts++;
        try {
          const fetchCount = Math.max(1, 7 - uniqueFacts.length);
          const res = await fetch(`/api/facts?count=${fetchCount}`);
          const data = await res.json();
          const list = Array.isArray(data.fact) ? data.fact : Array.isArray(data.facts) ? data.facts : Array.isArray(data.data) ? data.data : (typeof data === 'string' ? [data] : []);
          for (const txt of list) {
            const id = generateFactId(txt);
            if (seenIds.has(id)) continue;
            if (uniqueFacts.some(f => generateFactId(f) === id)) continue;
            uniqueFacts.push(txt);
            seenIds.add(id);
            if (uniqueFacts.length === 7) break;
          }
        } catch (e) {
          console.warn("Failed to fetch facts API:", e);
        }
      }

      while (uniqueFacts.length < 7) uniqueFacts.push("😿 (No new fact available)");

      // shuffle
      for (let i = uniqueFacts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueFacts[i], uniqueFacts[j]] = [uniqueFacts[j], uniqueFacts[i]];
      }

      const startDate = todayIso;
      const map = {};
      for (let i = 0; i < 7; i++) {
        const dayKey = addDaysISO(startDate, i);
        map[dayKey] = uniqueFacts[i];
        const id = generateFactId(uniqueFacts[i]);
        addEncounteredFact(id, uniqueFacts[i]);
      }

      try {
        localStorage.setItem("weeklyFacts", JSON.stringify({ startDate, facts: uniqueFacts }));
      } catch (e) {
        console.warn("Failed to persist weeklyFacts:", e);
      }

      if (mounted) {
        setWeeklyMap(map);
        const shownDate = localStorage.getItem("dailyShownDate");
        if (shownDate !== todayIso) {
          setShowDailyModal(true);
          localStorage.setItem("dailyShownDate", todayIso);
        }
      }
    }

    ensureWeeklyFacts();
    return () => { mounted = false; };
  }, []);

  const slices = 6;
  const sliceAngle = 360 / slices;

  const readCurrentAngle = () => {
    const el = wheelInnerRef.current;
    if (!el) return rotation % 360;
    const st = window.getComputedStyle(el);
    const tr = st.transform || st.webkitTransform || "none";
    if (tr === "none") return rotation % 360;
    const m = tr.match(/matrix\(([^)]+)\)/);
    if (!m) return rotation % 360;
    const parts = m[1].split(',').map(v => parseFloat(v));
    const a = parts[0];
    const b = parts[1];
    let ang = Math.atan2(b, a) * (180 / Math.PI);
    if (ang < 0) ang += 360;
    return ang;
  };

  const resumeIdleFromCurrent = () => {
    const ang = readCurrentAngle();
    const phase = (ang % 360) / 360;
    const delaySec = phase * idleDurationSec;
    setIdleDelaySec(delaySec);
    setIdle(true);
  };

  async function spinWheel() {
    if (spinning) return;
    const currentAngle = idle ? readCurrentAngle() : (rotation % 360);
    setIdle(false);
    setRotation(currentAngle);

    const selectedSlice = Math.floor(Math.random() * slices);
    const stopAngle = selectedSlice * sliceAngle + sliceAngle / 2;
    const extraSpins = 720 + Math.floor(Math.random() * 360);
    const finalRotation = currentAngle + extraSpins + stopAngle;
    const duration = 5000 + Math.floor(Math.random() * 2001);
    setSpinMs(duration);

    requestAnimationFrame(() => {
      setSpinning(true);
      requestAnimationFrame(() => {
        setRotation(finalRotation);
      });
    });

    setTimeout(() => {
      setSpinning(false);
      setShowStackedCards(true);
      setRotation(finalRotation % 360);
    }, duration);

    try {
      const res = await fetch(`/api/facts?count=${count}`);
      const data = await res.json();
      const raw = Array.isArray(data.fact) ? data.fact : Array.isArray(data.facts) ? data.facts : Array.isArray(data.data) ? data.data : (typeof data === 'string' ? [data] : []);

      const finalList = [];
      for (const f of raw) {
        const id = generateFactId(f);
        if (!encounteredFacts[id]) finalList.push(f);
        if (finalList.length === count) break;
      }

      if (finalList.length < count) {
        for (const f of raw) {
          if (finalList.length === count) break;
          if (!finalList.includes(f)) finalList.push(f);
        }
      }

      setFacts(finalList);
      finalList.forEach(f => addEncounteredFact(generateFactId(f), f));
      setStackedFacts(finalList.map((fact, i) => ({ sub: `Fact #${i + 1}`, content: fact })));
    } catch {
      setFacts(["Error loading facts."]);
    }
  }

  const modalOpen = showBook || showStackedCards || showDailyModal || showCatGallery || showUserModal;

  return (
    <div className="homepage" data-modal={modalOpen ? 'true' : 'false'}>
      <div className="title-row">
        <h1 className="title">MEÖW FACTS</h1>
        <div className="title-controls">
          <button className="control-icon leaderboard-icon" onClick={() => setShowLeaderboard(true)} aria-label="Leaderboard" title="Leaderboard">
            <Trophy size={50} />
          </button>
          <button className="control-icon admin-icon" onClick={() => navigate("/admin/facts")} aria-label="Admin" title="Admin">
            <Settings size={50} />
          </button>
          <button className="control-icon user-icon" onClick={() => setShowUserModal(true)} aria-label="User" title="User">
            <User size={50} />
          </button>
        </div>
      </div>


      {showUserModal && (
  <div className="modal-overlay">
    <div className="modal-box modal-box-user">
      <button className="close-btn" onClick={() => setShowUserModal(false)}>✖</button>
      <div className="modal-tabs-text">
        <span
          className={activeUserTab === "login" ? "active-tab" : ""}
          onClick={() => setActiveUserTab("login")}
        >
          Login
        </span>
        <span
          className={activeUserTab === "register" ? "active-tab" : ""}
          onClick={() => setActiveUserTab("register")}
        >
          Register
        </span>
      </div>
      <div className="modal-content">
        {activeUserTab === "login" ? <Login /> : <Register />}
      </div>
    </div>
  </div>
)}


      {/* Rest of your layout */}
      <div className="layout">
        <div className="left-side">
          <div className="cat-gallery" onClick={() => setShowCatGallery(true)}>Cat Gallery</div>
          <div className="fact-collection" onClick={handleOpenLibrary}>
            Fact Library
            {libraryNewIds.length > 0 && (
              <img src="/images/paw.png" alt="new" className={`paw-notif ${libraryAnimating ? 'fly-away' : 'pulse'}`} />
            )}
          </div>
        </div>

        <div className="center-section">
          <div className="wheel-wrapper">
            <div className="wheel" style={{ transform: `translate(-50%, -50%)` }}>
              <div
                ref={wheelInnerRef}
                className={`wheel-inner ${idle ? 'idle' : ''}`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? `transform ${spinMs}ms cubic-bezier(0.15, 0.9, 0.25, 1)` : "none",
                  animationDelay: idle ? `${-idleDelaySec}s` : undefined
                }}
              >
                <div className="wheel-face" />
              </div>
            </div>
            <div className="spin-area">
              <button className="btn-spin" onClick={spinWheel} disabled={spinning}>{spinning ? "..." : "SPIN"}</button>
              <div className="controller">
                <button 
                  className="btn-control" 
                  onClick={() => setCount(Math.max(1, count - 1))}
                  >
                    -
                  </button>
                <button 
                  className="btn-control" 
                  onClick={() => setCount(Math.max(1, count - 1))}
                  >
                    -
                  </button>
                <div className="count-display">x{count}</div>
                <button className="btn-control" onClick={() => setCount(c => Math.min(5, c + 1))} disabled={count >= 5}>+</button>
              </div>
            </div>
            <div className="arrow" />
          </div>
        </div>

        <div className="right-side">
          <div className="game-modal" onClick={() => navigate("/speed-typing")}>Game 1</div>
          <div className="game-modal" onClick={() => navigate("/trivia")}>Game 2</div>
          <div className="game-modal" onClick={() => navigate("/jumbled-facts")}>Game 3</div>
        </div>
      </div>

      {showDailyModal && weeklyMap && (
        <DailyFact
          weeklyMap={weeklyMap}
          todayKey={new Date().toISOString().slice(0, 10)}
          addEncounteredFact={(id, txt) => addEncounteredFact(id, txt)}
          onStoreComplete={(ids) => markLibraryNewIds(ids)}
          onClose={() => setShowDailyModal(false)}
        />
      )}

      {showStackedCards && (
        <StackedCards
          cards={stackedFacts}
          onClose={() => setShowStackedCards(false)}
          onStoreComplete={(ids) => { markLibraryNewIds(ids); resumeIdleFromCurrent(); }}
        />
      )}

      {showBook && (
        <FactLibrary
          encounteredFacts={encounteredFacts}
          libraryNewIds={libraryNewIds}
          onClose={() => setShowBook(false)}
          onMarkViewed={(id) => markLibraryIdViewed(id)}
          maxPages={27}
        />
      )}

      {showCatGallery && <CatGallery onClose={() => setShowCatGallery(false)} />}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}

export default function App() {
  function CursorForHome() {
    const location = useLocation();
    return location.pathname === "/" ? <CatCursor /> : null;
  }
  return (
    <BrowserRouter>
      <UserProvider>
        <LoaderWrapper>
          <CursorForHome />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/admin/facts"
              element={
                <ProtectedRoute>
                  <AdminFacts />
                </ProtectedRoute>
              }
            />
            <Route path="/speed-typing" element={<SpeedTyping />} />
            <Route path="/trivia" element={<TriviaMaster />} />
            <Route path="/jumbled-facts" element={<JumbledFacts />} />
          </Routes>
        </LoaderWrapper>
      </UserProvider>
    </BrowserRouter>
  );
}
