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
import LogoutButton from "./components/LogoutButton";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    axios.get("/api/user/session", { withCredentials: true })
      .then(res => setIsAuth(res.data.loggedIn))
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div>Loading...</div>;
  
  return children;
}

function HomePage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [idle, setIdle] = useState(true);
  const [idleDelaySec, setIdleDelaySec] = useState(0);
  const idleDurationSec = 25; 
  const [spinMs, setSpinMs] = useState(3000);
  const wheelInnerRef = useRef(null);
  const [count, setCount] = useState(1);
  const [showBook, setShowBook] = useState(false);
  const [showCatGallery, setShowCatGallery] = useState(false);
  const [libraryNewIds, setLibraryNewIds] = useState([]);
  const [libraryAnimating, setLibraryAnimating] = useState(false);
  const [encounteredFacts, setEncounteredFacts] = useState({});
  const [showStackedCards, setShowStackedCards] = useState(false);
  const [stackedFacts, setStackedFacts] = useState([]);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyFact, setDailyFact] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeUserTab, setActiveUserTab] = useState("login");
  const [totalFactsCount, setTotalFactsCount] = useState(0); // Will be fetched from database

  const navigate = useNavigate();

  // Fetch user's encountered facts from backend on load
  useEffect(() => {
    axios.get('/api/facts/user', { withCredentials: true })
      .then(res => {
        setEncounteredFacts(res.data.facts || {});
      })
      .catch(err => {
        console.error("Failed to fetch user facts:", err);
      });
  }, []);

  // Fetch total facts count from backend
  useEffect(() => {
    axios.get('/api/facts/count')
      .then(res => {
        setTotalFactsCount(res.data.count || 91);
      })
      .catch(err => {
        console.error("Failed to fetch facts count:", err);
      });
  }, []);

  const addEncounteredFact = async (id, text) => {
    if (encounteredFacts[id]) return; // Already encountered

    // Store with actual text
    setEncounteredFacts(prev => ({ ...prev, [id]: text }));
    
    try {
      await axios.post('/api/facts/encounter', { factId: id }, { withCredentials: true });
    } catch (err) {
      console.error("Failed to store encountered fact:", err);
      // Revert if failed
      setEncounteredFacts(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const markLibraryNewIds = (ids) => {
    if (!Array.isArray(ids)) ids = [ids];
    setLibraryNewIds(prevIds => [...new Set([...prevIds, ...ids])]);
  };

  const handleOpenLibrary = () => {
    // Refetch total facts count in case admin added/deleted facts
    axios.get('/api/facts/count')
      .then(res => {
        setTotalFactsCount(res.data.count || 91);
      })
      .catch(err => {
        console.error("Failed to fetch facts count:", err);
      });
    
    setLibraryAnimating(true);
    setShowBook(true);
    setTimeout(() => setLibraryAnimating(false), 700);
  };

  const markLibraryIdViewed = (id) => {
    setLibraryNewIds(prev => prev.filter(x => String(x) !== String(id)));
  };

  // daily fact after login
  useEffect(() => {
    const pendingDailyFactStr = localStorage.getItem('pendingDailyFact');
    if (pendingDailyFactStr) {
      try {
        const pendingDailyFact = JSON.parse(pendingDailyFactStr);
        setDailyFact(pendingDailyFact);
        setShowDailyModal(true);
        // Add to encountered facts 
        setEncounteredFacts(prev => ({ ...prev, [pendingDailyFact.id]: pendingDailyFact.text }));
        localStorage.removeItem('pendingDailyFact');
      } catch (err) {
        console.error("Failed to parse pending daily fact:", err);
        localStorage.removeItem('pendingDailyFact');
      }
    }
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
      const res = await axios.get(`/api/spin-facts?count=${count}`);
      const facts = res.data.facts || []; // Note: backend sends { facts: [...] }
      
      // Add all facts to encountered list and store them
      facts.forEach(fact => addEncounteredFact(fact.id, fact.text));
      
      setStackedFacts(facts.map((fact, i) => ({ sub: `Fact #${i + 1}`, content: fact.text })));
      markLibraryNewIds(facts.map(f => f.id));

    } catch {
      setStackedFacts([{ sub: 'Error', content: 'Could not load facts.' }]);
    }
  }

  const modalOpen = showBook || showStackedCards || showDailyModal || showCatGallery || showUserModal;
  
  const [user, setUser] = useState(null);

  useEffect(() => {
  axios
    .get("/api/user/session", { withCredentials: true })
    .then((res) => {
      if (res.data.loggedIn && res.data.user) {
        setUser(res.data.user);
      }
    })
    .catch(() => {});
}, []);



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

      {!user ? (
        <>
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
            {activeUserTab === "login" ? (
              <Login
                onLogin={(userData) => {
                  setUser(userData);
                  setShowUserModal(false);
                }}
              />
            ) : (
              <Register onRegister={() => setActiveUserTab("login")} />
            )}
          </div>
        </>
      ) : (
        <div className="modal-content text-center">
          <h3>Welcome, {user.username}!</h3>
          <LogoutButton />
        </div>
      )}
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

      {showDailyModal && dailyFact && (
        <DailyFact
          fact={dailyFact.text}
          factId={dailyFact.id}
          onClose={() => {
            setShowDailyModal(false);
            markLibraryNewIds([dailyFact.id]);
          }}
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
          totalFacts={totalFactsCount}
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
