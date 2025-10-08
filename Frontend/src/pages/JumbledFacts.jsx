import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AnswerReveal from "../components/AnswerReveal";
import "./JumbledFacts.css";

function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function JumbledFacts() {
  const [index, setIndex] = useState(0);
  const [fact, setFact] = useState("");
  const [words, setWords] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [result, setResult] = useState("");
  const [dragSource, setDragSource] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const [dropArea, setDropArea] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  //Cat image state
  const [catImage, setCatImage] = useState("/images/jumbledGuide.png");

  // Timer states
  const TOTAL_TIME = 60; // 60 seconds per fact
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef(null);
  const isPausedRef = useRef(false);

  const navigate = useNavigate();
  const wordsAreaRef = useRef(null);

  const guides = [
    "Drag the words below into the answer area to form the correct sentence!",
    "Tip: You can drag words back if you make a mistake.",
    "Keep practicing to get faster!"
  ];

  function handlePrev() {
    setIndex(prev => (prev > 0 ? prev - 1 : prev));
  }
  function handleNextGuide() {
    setIndex(prev => (prev + 1) % guides.length);
  }
  function handleStartGame() {
    setGameStarted(true);
    fetchFact();
    resetTimer();
    setCatImage("/images/jumbledGuide.png"); // reset default cat
  }

  async function fetchFact() {
    try {
      const res = await fetch("/api/facts");
      const data = await res.json();
      const factText = Array.isArray(data.fact) ? data.fact[0] : data.fact;
      setFact(factText);
      setWords(shuffle(factText.split(" ")));
      setUserSequence([]);
      setResult("");
      setShowAnswer(false);
      setCatImage("/images/jumbledGuide.png"); // reset default cat
      resetTimer();
    } catch {
      const fallback = "Cats are mysterious creatures.";
      setFact(fallback);
      setWords(shuffle(fallback.split(" ")));
      setUserSequence([]);
      setResult("");
      setShowAnswer(false);
      setCatImage("/images/jumbledGuide.png"); // reset default cat
      resetTimer();
    }
  }

  // Reset + start timer
  function resetTimer() {
    clearInterval(timerRef.current);
    setTimeLeft(TOTAL_TIME);
    isPausedRef.current = false;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (isPausedRef.current) return prev; // pause guard
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setResult("Time's up!");
          setCatImage("/images/jumbledWrong.png"); // time up → sad cat
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Pause/Resume logic
  function handlePause() {
    isPausedRef.current = true;
    setIsMenuOpen(true);
  }
  function handleResume() {
    isPausedRef.current = false;
    setIsMenuOpen(false);
  }

  // === Dynamic Font Resize ===
  useEffect(() => {
    if (!wordsAreaRef.current) return;
    const container = wordsAreaRef.current;
    let fontSize = 18; // base size
    const resize = () => {
      fontSize = 18;
      container.style.fontSize = fontSize + "px";
      while (container.scrollHeight > container.clientHeight && fontSize > 10) {
        fontSize -= 1;
        container.style.fontSize = fontSize + "px";
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [words]);

  // === Drag & Drop ===
  function handleDragStart(area, idx) {
    setDragSource({ area, idx });
  }
  function handleDragOver(e, area, idx) {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const tileCenter = rect.left + rect.width / 2;
    const position = mouseX < tileCenter ? "before" : "after";
    setDropTargetIdx(idx);
    setDropArea(area);
    setDropPosition(position);
  }
  function handleDragLeave(e) {
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetIdx(null);
      setDropArea(null);
      setDropPosition(null);
    }
  }
  function handleDrop(e, area, idx) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragSource) return;

    let newWords = [...words];
    let newSequence = [...userSequence];
    let insertIdx = idx;
    if (dropPosition === "after") insertIdx = idx + 1;

    if (dragSource.area === "words" && area === "sequence") {
      const [moved] = newWords.splice(dragSource.idx, 1);
      newSequence.splice(insertIdx, 0, moved);
    } else if (dragSource.area === "sequence" && area === "words") {
      const [moved] = newSequence.splice(dragSource.idx, 1);
      newWords.splice(insertIdx, 0, moved);
    } else if (dragSource.area === "sequence" && area === "sequence") {
      if (dragSource.idx !== idx) {
        const [moved] = newSequence.splice(dragSource.idx, 1);
        let finalInsertIdx = insertIdx;
        if (dragSource.idx < insertIdx) finalInsertIdx = insertIdx - 1;
        newSequence.splice(finalInsertIdx, 0, moved);
      }
    } else if (dragSource.area === "words" && area === "words") {
      if (dragSource.idx !== idx) {
        const [moved] = newWords.splice(dragSource.idx, 1);
        let finalInsertIdx = insertIdx;
        if (dragSource.idx < insertIdx) finalInsertIdx = insertIdx - 1;
        newWords.splice(finalInsertIdx, 0, moved);
      }
    }

    setWords(newWords);
    setUserSequence(newSequence);
    setDragSource(null);
    setDropTargetIdx(null);
    setDropArea(null);
    setDropPosition(null);
  }
  function handleContainerDrop(e, area) {
    e.preventDefault();
    if (!dragSource) return;
    let newWords = [...words];
    let newSequence = [...userSequence];

    if (dragSource.area === "words" && area === "sequence") {
      const [moved] = newWords.splice(dragSource.idx, 1);
      newSequence.push(moved);
    } else if (dragSource.area === "sequence" && area === "words") {
      const [moved] = newSequence.splice(dragSource.idx, 1);
      newWords.push(moved);
    }

    setWords(newWords);
    setUserSequence(newSequence);
    setDragSource(null);
    setDropTargetIdx(null);
    setDropArea(null);
    setDropPosition(null);
  }

  // === Game actions ===
  function handleSubmit() {
    if (userSequence.join(" ") === fact) {
      setResult("Correct!");
      setCatImage("/images/jumbledRight.png"); // correct → happy cat
    } else {
      setResult("Try again!");
      setShowAnswer(true);
      setCatImage("/images/jumbledWrong.png"); // wrong → sad cat
    }
  }
  function handleNextFact() {
    fetchFact();
  }

  // Timer circle math
  const circumference = 2 * Math.PI * 16;
  const progressPct = (timeLeft / TOTAL_TIME) * 100;
  const dashOffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="jumbled-facts-container">
      {/* Hamburger */}
      <button className="hamburger" onClick={handlePause}>
        <span></span><span></span><span></span>
      </button>

      {/* Modal */}
      {isMenuOpen && (
        <div className="modal-overlay" onClick={handleResume}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Menu</h2>
            <div className="menu-buttons">
              <button className="menu-btn resume-btn" onClick={handleResume}>Resume</button>
              <button className="menu-btn restart-btn" onClick={() => { handleStartGame(); setIsMenuOpen(false); }}>Restart</button>
              <button className="menu-btn exit-btn" onClick={() => navigate("/")}>Exit</button>
            </div>
          </div>
        </div>
      )}

      {!gameStarted ? (
        /* ===== GUIDE SCREEN ===== */
        <>
          <div className="cat-wrapper">
            <img src="/images/jumbledGuide.png" alt="Cat" className="cat-image" />
          </div>
          <div className="jumbled-main-box">
            <h1 className="jumbled-title">JUMBLED CAT FACTS</h1>
            <div className="jumbled-guide-box">
              <p className="jumbled-subtitle">{guides[index]}</p>
              <div className="nav-buttons">
                {index > 0 && <button className="nav-btn" onClick={handlePrev}>Prev</button>}
                <button className="nav-btn" onClick={handleNextGuide}>Next</button>
                <button className="nav-btn start" onClick={handleStartGame}>Start Game</button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ===== GAME SCREEN ===== */
        <div className="jumbled-game-layout">
          <div className="jumbled-game-content">
            {/* Cat image left side */}
            <div className="cat-game-wrapper">
              <img src={catImage} alt="Cat" className="cat-game-image" />
            </div>

            {/* Main game area */}
            <div className="game-area">

              {/* Upper box */}
              <div
                className="jumbled-box upper-box"
                onDragOver={(e) => { e.preventDefault(); setDropArea("words"); }}
                onDrop={(e) => handleContainerDrop(e, "words")}
                onDragLeave={handleDragLeave}
              >
                <div className="upper-box-text">
                  Drag the words below into the answer area to form the correct sentence!
                </div>

                {/* TIMER inside upper box */}
                <div className="answer-timer">
                  <svg viewBox="0 0 36 36" className="answer-timer-ring">
                    <circle className="ring-track" cx="18" cy="18" r="16" />
                    <circle
                      className="ring-progress"
                      cx="18"
                      cy="18"
                      r="16"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <span className="timer-text">{timeLeft}</span>
                </div>

                <div className="words-area" ref={wordsAreaRef}>
                  {words.map((word, idx) => (
                    <div key={`word-${idx}-${word}`} className="word-wrapper">
                      {dropTargetIdx === idx && dropArea === "words" && dropPosition === "before" && <div className="drop-line words" />}
                      <span
                        className="word-tile jumbled"
                        draggable
                        onDragStart={() => handleDragStart("words", idx)}
                        onDragOver={(e) => handleDragOver(e, "words", idx)}
                        onDrop={(e) => handleDrop(e, "words", idx)}
                      >
                        {word}
                      </span>
                      {dropTargetIdx === idx && dropArea === "words" && dropPosition === "after" && <div className="drop-line words" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lower box */}
              <div
                className="jumbled-box lower-box"
                onDragOver={(e) => { e.preventDefault(); setDropArea("sequence"); }}
                onDrop={(e) => handleContainerDrop(e, "sequence")}
                onDragLeave={handleDragLeave}
              >
                {userSequence.map((word, idx) => (
                  <span
                    key={`seq-${idx}-${word}`}
                    className="word-tile sequence"
                    draggable
                    onDragStart={() => handleDragStart("sequence", idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!dragSource) return;
                      if (dragSource.area === "sequence" && dragSource.idx !== idx) {
                        const newSequence = [...userSequence];
                        const [moved] = newSequence.splice(dragSource.idx, 1);
                        newSequence.splice(idx, 0, moved);
                        setUserSequence(newSequence);
                        setDragSource({ area: "sequence", idx });
                      }
                    }}
                  >
                    {word}
                  </span>
                ))}
                <div className="jumbled-actions">
                  <button onClick={handleSubmit} className="jumbled-btn submit">Submit</button>
                  <button onClick={handleNextFact} className="jumbled-btn next">Next Fact</button>
                </div>
              </div>

              {result && (
                <div className={`result-text ${result.includes("Correct") ? "correct" : "incorrect"}`}>
                  {result}
                </div>
              )}
              {showAnswer && <AnswerReveal correctAnswer={fact} onClose={() => setShowAnswer(false)} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
