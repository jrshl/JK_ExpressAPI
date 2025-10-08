import React, { useState, useEffect, useRef } from "react";
import DailyFact from "./components/DailyFact";
import StackedCards from "./components/StackedCards";
import FactLibrary from "./components/FactLibrary";
import CatGallery from "./components/CatGallery";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import SpeedTyping from "./pages/SpeedTyping";
import TriviaMaster from "./pages/TriviaMaster";
import JumbledFacts from "./pages/JumbledFacts";
import "./App.css";
import CatCursor from "./components/CatCursor";
import LoaderWrapper from "./components/LoaderWrapper";

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
  const idleDurationSec = 25; // keep in sync with CSS .wheel-inner.idle duration
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
  // bookFocusIds removed (unused in classic flipbook)
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

  const navigate = useNavigate();

  // persist encounteredFacts to localStorage when it changes
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

  // Mark items as newly-stored in the library (called after the store animation completes)
  const markLibraryNewIds = (ids) => {
    if (!Array.isArray(ids)) ids = [ids];
    console.log("Adding new library IDs:", ids, "Types:", ids.map(id => typeof id));
    
    setLibraryNewIds(prevIds => {
      console.log("Previous libraryNewIds:", prevIds);
      const next = [...new Set([...prevIds, ...ids])];
      console.log("New libraryNewIds:", next);
      
      try {
        localStorage.setItem("libraryNewIds", JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist libraryNewIds:", e);
      }
      return next;
    });
  };

  const handleOpenLibrary = () => {
    // capture the current new ids to pass to modal
  const newIds = libraryNewIds.slice();
    // Note: do NOT clear the persisted libraryNewIds here. We'll keep the
    // paw visible until the user actually views each new fact. Individual
    // cards will be marked-read from inside the FlipBook when opened.
    setLibraryAnimating(true);
    setShowBook(true);
    // hide the paw after the fly animation completes (600ms)
    setTimeout(() => setLibraryAnimating(false), 700);
    return newIds; // available if needed
  };

  // Mark a single library id as viewed/read (called when user opens that fact)
  const markLibraryIdViewed = (id) => {
    console.log("Marking as viewed:", id, "Type:", typeof id);
    console.log("Current libraryNewIds:", libraryNewIds);
    
    setLibraryNewIds(prev => {
      console.log("Before filtering:", prev);
      const next = prev.filter(x => {
        const match = String(x) !== String(id);
        console.log(`Comparing ${x} (${typeof x}) with ${id} (${typeof id}): keep=${match}`);
        return match;
      });
      console.log("After filtering:", next);
      
      try {
        localStorage.setItem("libraryNewIds", JSON.stringify(next));
        console.log("Saved to localStorage:", next);
      } catch (e) {
        console.warn("Failed to persist libraryNewIds after marking viewed:", e);
      }
      return next;
    });
  };

  // Ensure weekly 7 facts exist and are reserved (not used elsewhere).
  useEffect(() => {
    let mounted = true;

    async function ensureWeeklyFacts() {
      const todayIso = new Date().toISOString().slice(0, 10);
      const stored = JSON.parse(localStorage.getItem("weeklyFacts") || "null");

      // validate stored weekly set
      if (stored && stored.startDate) {
        const start = new Date(stored.startDate);
        const diffDays = Math.floor((new Date(todayIso) - start) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7 && Array.isArray(stored.facts) && stored.facts.length === 7) {
          const map = {};
          for (let i = 0; i < 7; i++) {
            const dayKey = addDaysISO(stored.startDate, i);
            map[dayKey] = stored.facts[i];
            const id = generateFactId(stored.facts[i]);
            addEncounteredFact(id, stored.facts[i]); // reserve
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

      // Need to fetch 7 unique facts (avoid duplicates and existing encounteredFacts)
      const uniqueFacts = [];
      const seenIds = new Set(Object.keys(encounteredFacts).map(k => Number(k)));
      let attempts = 0;
      while (uniqueFacts.length < 7 && attempts < 12) {
        attempts++;
        try {
          const fetchCount = Math.max(1, 7 - uniqueFacts.length);
          const res = await fetch(`/api/facts?count=${fetchCount}`);
          const data = await res.json();
          // server may return { fact: [...] } or { facts: [...] } or upstream { data: [...] }
          const list = Array.isArray(data.fact)
            ? data.fact
            : Array.isArray(data.facts)
            ? data.facts
            : Array.isArray(data.data)
            ? data.data
            : (typeof data === 'string' ? [data] : []);
          for (const txt of list) {
            const id = generateFactId(txt);
            if (seenIds.has(id)) continue;
            if (uniqueFacts.some(f => generateFactId(f) === id)) continue;
            uniqueFacts.push(txt);
            seenIds.add(id);
            if (uniqueFacts.length === 7) break;
          }
          } catch (e) {
          console.warn("Failed to fetch facts API (attempt", attempts, "):", e);
          // ignore and retry
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
        addEncounteredFact(id, uniqueFacts[i]); // reserve
      }

      const toStore = { startDate, facts: uniqueFacts };
      try {
        localStorage.setItem("weeklyFacts", JSON.stringify(toStore));
      } catch (e) {
        console.warn("Failed to persist weeklyFacts to localStorage:", e);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

    // TESTING ONLY (development): force the Daily Fact modal to appear on every reload
    // when the weekly map is ready. Remove this block before deploying to production.
    useEffect(() => {
      if (!weeklyMap) return;
      // Avoid referencing `process` in browser code; detect local/dev via hostname.
      const hostname = window && window.location && window.location.hostname ? window.location.hostname : '';
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
      if (!isLocal) return;
      // Always show the daily modal during development so it's easy to verify behavior.
      setShowDailyModal(true);
      // Intentionally do NOT set localStorage.dailyShownDate here so the modal appears
      // again on reload. This is only for testing.
    }, [weeklyMap]);

  const slices = 6;
  const sliceAngle = 360 / slices;

  // read current angle from computed transform of wheelInner (handles idle CSS animation)
  const readCurrentAngle = () => {
    const el = wheelInnerRef.current;
    if (!el) return rotation % 360;
    const st = window.getComputedStyle(el);
    const tr = st.transform || st.webkitTransform || "none";
    if (tr === "none") return rotation % 360;
    // matrix(a, b, c, d, e, f)
    const m = tr.match(/matrix\(([^)]+)\)/);
    if (!m) return rotation % 360;
    const parts = m[1].split(',').map(v => parseFloat(v));
    const a = parts[0];
    const b = parts[1];
    let ang = Math.atan2(b, a) * (180 / Math.PI);
    if (ang < 0) ang += 360;
    return ang;
  };

  // Resume idle spin from the exact current angle by applying a negative animation delay
  const resumeIdleFromCurrent = () => {
    const ang = readCurrentAngle();
    const phase = (ang % 360) / 360;
    const delaySec = phase * idleDurationSec;
    setIdleDelaySec(delaySec);
    setIdle(true);
  };

  async function spinWheel() {
    if (spinning) return;

    // Freeze the wheel at the exact current idle angle for continuity
    const currentAngle = idle ? readCurrentAngle() : (rotation % 360);
    setIdle(false); // remove idle CSS animation so we control transform
    setRotation(currentAngle); // inline style holds the frozen angle (no transition)

    // Compute target angle and start the spin immediately (no pause)
    const selectedSlice = Math.floor(Math.random() * slices);
    const stopAngle = selectedSlice * sliceAngle + sliceAngle / 2;
    const extraSpins = 720 + Math.floor(Math.random() * 360);
    const base = currentAngle; // start from frozen current angle
    const finalRotation = base + extraSpins + stopAngle;

  // Randomize spin duration between 5s and 7s for a fuller deceleration
  const duration = 5000 + Math.floor(Math.random() * 2001);
    setSpinMs(duration);

    // Ensure transition is applied before transform change to avoid a frame pause
    requestAnimationFrame(() => {
      setSpinning(true);
      requestAnimationFrame(() => {
        setRotation(finalRotation);
      });
    });

    // Stop handling after duration; do NOT resume idle here. Idle will resume only after
    // the facts store animation completes (via StackedCards onStoreComplete).
    setTimeout(() => {
      setSpinning(false);
      setShowStackedCards(true);
      // keep rotation small to avoid big numbers
      setRotation(finalRotation % 360);
    }, duration);

    // Fetch concurrently while spinning
    try {
      const res = await fetch(`/api/facts?count=${count}`);
      const data = await res.json();
      const raw = Array.isArray(data.fact)
        ? data.fact
        : Array.isArray(data.facts)
        ? data.facts
        : Array.isArray(data.data)
        ? data.data
        : (typeof data === 'string' ? [data] : []);

      // Build a final list of up to `count` facts, preferring not-yet-encountered facts.
      const finalList = [];
      for (const f of raw) {
        const id = generateFactId(f);
        if (!encounteredFacts[id]) {
          finalList.push(f);
        }
        if (finalList.length === count) break;
      }
      // If still short, fill from raw (including previously encountered) to reach requested count
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
      setFacts(["😿 Error loading facts."]);
      // Stopping animation is handled by the timer above
    }
  }

  const modalOpen = showBook || showStackedCards || showDailyModal || showCatGallery;

  return (
    <div className="homepage" data-modal={modalOpen ? 'true' : 'false'}>
      <h1 className="title">MEÖW FACTS</h1>

      <div className="layout">
        <div className="left-side">
          <div className="cat-gallery" onClick={() => setShowCatGallery(true)}>Cat Gallery</div>
          <div className="fact-collection" onClick={handleOpenLibrary}>
            Fact Library
            {/* paw notification */}
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
              <button className="btn-spin" onClick={spinWheel} disabled={spinning}>
                {spinning ? "..." : "SPIN"}
              </button>
              <div className="controller">
                <button className="btn-control" onClick={() => setCount(Math.max(1, count - 1))}>-</button>
                <div className="count-display">x{count}</div>
                <button className="btn-control" onClick={() => setCount(count + 1)}>+</button>
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
          onStoreComplete={(ids) => {
            markLibraryNewIds(ids);
            // resume idle only after the store animation finishes, from the same frame
            resumeIdleFromCurrent();
          }}
        />
      )}

      {showBook && (
        <FactLibrary
          encounteredFacts={encounteredFacts}
          libraryNewIds={libraryNewIds}
          onClose={() => { setShowBook(false); }}
          onMarkViewed={(id) => markLibraryIdViewed(id)}
          maxPages={27}
        />
      )}

      {showCatGallery && (
        <CatGallery onClose={() => setShowCatGallery(false)} />
      )}
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
      <LoaderWrapper>
        <CursorForHome />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/speed-typing" element={<SpeedTyping />} />
          <Route path="/trivia" element={<TriviaMaster />} />
          <Route path="/jumbled-facts" element={<JumbledFacts />} />
        </Routes>
      </LoaderWrapper>
    </BrowserRouter>
  );
}