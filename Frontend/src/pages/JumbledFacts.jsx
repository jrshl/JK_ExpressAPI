import React, { useEffect, useState } from "react";
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
  const navigate = useNavigate();

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
    } catch {
      const fallback = "Cats are mysterious creatures.";
      setFact(fallback);
      setWords(shuffle(fallback.split(" ")));
      setUserSequence([]);
      setResult("");
      setShowAnswer(false);
    }
  }

  useEffect(() => {
    if (gameStarted) fetchFact();
  }, [gameStarted]);

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
      setResult("✅ Correct!");
    } else {
      setResult("❌ Try again!");
      setShowAnswer(true);
    }
  }
  function handleReset() {
    setWords(shuffle(fact.split(" ")));
    setUserSequence([]);
    setResult("");
    setShowAnswer(false);
  }
  function handleNextFact() {
    fetchFact();
  }

  return (
    <div className="jumbled-facts-container">
      {/* Hamburger */}
      <button className="hamburger" onClick={() => setIsMenuOpen(true)}>
        <span></span><span></span><span></span>
      </button>

      {/* Modal */}
      {isMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Menu</h2>
            <div className="menu-buttons">
              <button className="menu-btn resume-btn" onClick={() => setIsMenuOpen(false)}>Resume</button>
              <button className="menu-btn restart-btn" onClick={() => { setIsMenuOpen(false); handleStartGame(); }}>Restart</button>
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
          <h1 className="jumbled-title">Arrange the Cat Fact!</h1>

          {/* Upper box (top right) */}
          <div
            className="jumbled-box upper-box"
            onDragOver={(e) => { e.preventDefault(); setDropArea("words"); }}
            onDrop={(e) => handleContainerDrop(e, "words")}
            onDragLeave={handleDragLeave}
          >
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

          {/* Lower box (bottom left) */}
          <div
            className="jumbled-box lower-box"
            onDragOver={(e) => { e.preventDefault(); setDropArea("sequence"); }}
            onDrop={(e) => handleContainerDrop(e, "sequence")}
            onDragLeave={handleDragLeave}
          >
            {userSequence.length === 0 && (
              <div className="user-sequence-placeholder">Drop words here to build your sentence</div>
            )}
            {userSequence.map((word, idx) => (
              <div key={`seq-${idx}-${word}`} className="word-wrapper">
                {dropTargetIdx === idx && dropArea === "sequence" && dropPosition === "before" && <div className="drop-line sequence" />}
                <span
                  className="word-tile sequence"
                  draggable
                  onDragStart={() => handleDragStart("sequence", idx)}
                  onDragOver={(e) => handleDragOver(e, "sequence", idx)}
                  onDrop={(e) => handleDrop(e, "sequence", idx)}
                >
                  {word}
                </span>
                {dropTargetIdx === idx && dropArea === "sequence" && dropPosition === "after" && <div className="drop-line sequence" />}
              </div>
            ))}

            {/* Action buttons inside lower box */}
            <div className="jumbled-actions">
              <button onClick={handleSubmit} className="jumbled-btn submit">Submit</button>
              <button onClick={handleNextFact} className="jumbled-btn next">Next Fact</button>
            </div>
          </div>

          {/* Reset stays outside lower box */}
          <button onClick={handleReset} className="jumbled-btn reset">Reset</button>

          {result && (
            <div className={`result-text ${result.includes("Correct") ? "correct" : "incorrect"}`}>
              {result}
            </div>
          )}
          {showAnswer && <AnswerReveal correctAnswer={fact} onClose={() => setShowAnswer(false)} />}
        </div>
      )}
    </div>
  );
}
