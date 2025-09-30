import React, { useEffect, useState } from "react";
import AnswerReveal from '../components/AnswerReveal';

function shuffle(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function JumbledFacts() {
  const [fact, setFact] = useState("");
  const [words, setWords] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [result, setResult] = useState("");
  const [dragSource, setDragSource] = useState(null);
  const [dropTargetIdx, setDropTargetIdx] = useState(null);
  const [dropArea, setDropArea] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

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
      setFact("Cats are mysterious creatures.");
      setWords(shuffle("Cats are mysterious creatures.".split(" ")));
      setUserSequence([]);
      setResult("");
      setShowAnswer(false);
    }
  }

  useEffect(() => {
    fetchFact();
    // eslint-disable-next-line
  }, []);

  function handleDragStart(area, idx) {
    setDragSource({ area, idx });
  }

  function handleDragOver(e, area, idx) {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate which half of the tile we're hovering over
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX;
    const tileCenter = rect.left + rect.width / 2;
    const position = mouseX < tileCenter ? 'before' : 'after';
    
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

    // Calculate actual insertion index based on position
    let insertIdx = idx;
    if (dropPosition === 'after') {
      insertIdx = idx + 1;
    }

    // Drag from jumbled to answer area
    if (dragSource.area === "words" && area === "sequence") {
      const [moved] = newWords.splice(dragSource.idx, 1);
      newSequence.splice(insertIdx, 0, moved);
    }
    // Drag from answer area back to jumbled
    else if (dragSource.area === "sequence" && area === "words") {
      const [moved] = newSequence.splice(dragSource.idx, 1);
      newWords.splice(insertIdx, 0, moved);
    }
    // Reorder within answer area
    else if (dragSource.area === "sequence" && area === "sequence") {
      if (dragSource.idx !== idx) {
        const [moved] = newSequence.splice(dragSource.idx, 1);
        // Adjust insertion index if we removed an item before the target
        let finalInsertIdx = insertIdx;
        if (dragSource.idx < insertIdx) {
          finalInsertIdx = insertIdx - 1;
        }
        newSequence.splice(finalInsertIdx, 0, moved);
      }
    }
    // Reorder within jumbled area
    else if (dragSource.area === "words" && area === "words") {
      if (dragSource.idx !== idx) {
        const [moved] = newWords.splice(dragSource.idx, 1);
        // Adjust insertion index if we removed an item before the target
        let finalInsertIdx = insertIdx;
        if (dragSource.idx < insertIdx) {
          finalInsertIdx = insertIdx - 1;
        }
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

  // Handle dropping on empty container areas
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
    <div className="jumbled-facts-container"
      style={{
        padding: "2rem",
        minHeight: "80vh",
        background: "rgba(248,240,227,0.85)"
      }}
    >
      <h1 style={{ textAlign: "center", color: "#5d4037" }}>🐾 Jumbled Cat Fact</h1>
      <p style={{ textAlign: "center", color: "#4a2c2a" }}>
        Drag the words below into the answer area to form the correct sentence!
      </p>
      <div
        className="jumbled-words-area"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center",
          margin: "2rem 0",
          minHeight: "60px",
          background: "rgba(248,240,227,0.7)",
          borderRadius: "8px",
          padding: "1rem"
        }}
        onDragOver={e => {
          e.preventDefault();
          setDropArea("words");
        }}
        onDrop={e => handleContainerDrop(e, "words")}
        onDragLeave={handleDragLeave}
      >
        {words.map((word, idx) => (
          <div key={`word-${idx}-${word}`} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {/* Drop indicator line - BEFORE */}
            {dropTargetIdx === idx && dropArea === "words" && dropPosition === "before" && dragSource?.area && (
              <div style={{
                width: "3px",
                height: "40px",
                background: "#2196f3",
                marginRight: "5px",
                borderRadius: "2px"
              }} />
            )}
            <span
              draggable
              onDragStart={() => handleDragStart("words", idx)}
              onDragOver={e => handleDragOver(e, "words", idx)}
              onDrop={e => handleDrop(e, "words", idx)}
              style={{
                padding: "8px 16px",
                background: "#ffe0b2",
                borderRadius: "6px",
                cursor: "grab",
                fontFamily: "inherit",
                fontSize: "1rem",
                boxShadow: "0 2px 6px #d9c7b4",
                transition: "all 0.2s ease"
              }}
            >
              {word}
            </span>
            {/* Drop indicator line - AFTER */}
            {dropTargetIdx === idx && dropArea === "words" && dropPosition === "after" && dragSource?.area && (
              <div style={{
                width: "3px",
                height: "40px",
                background: "#2196f3",
                marginLeft: "5px",
                borderRadius: "2px"
              }} />
            )}
          </div>
        ))}
      </div>
      <div
        className="user-sequence-area"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          justifyContent: "center",
          minHeight: "60px",
          background: "rgba(248,240,227,0.9)",
          borderRadius: "8px",
          padding: "1rem",
          marginBottom: "1rem",
          border: (dropArea === "sequence" && userSequence.length === 0) ? "3px dashed #4caf50" : "2px solid transparent"
        }}
        onDragOver={e => {
          e.preventDefault();
          setDropArea("sequence");
        }}
        onDrop={e => handleContainerDrop(e, "sequence")}
        onDragLeave={handleDragLeave}
      >
        {userSequence.length === 0 && (
          <div style={{
            color: "#999",
            fontStyle: "italic",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "40px"
          }}>
            Drop words here to build your sentence
          </div>
        )}
        {userSequence.map((word, idx) => (
          <div key={`seq-${idx}-${word}`} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {/* Drop indicator line - BEFORE */}
            {dropTargetIdx === idx && dropArea === "sequence" && dropPosition === "before" && dragSource?.area && (
              <div style={{
                width: "3px",
                height: "40px",
                background: "#4caf50",
                marginRight: "5px",
                borderRadius: "2px"
              }} />
            )}
            <span
              draggable
              onDragStart={() => handleDragStart("sequence", idx)}
              onDragOver={e => handleDragOver(e, "sequence", idx)}
              onDrop={e => handleDrop(e, "sequence", idx)}
              style={{
                padding: "8px 16px",
                background: "#c8e6c9",
                borderRadius: "6px",
                cursor: "grab",
                fontFamily: "inherit",
                fontSize: "1rem",
                boxShadow: "0 2px 6px #d9c7b4",
                transition: "all 0.2s ease"
              }}
            >
              {word}
            </span>
            {/* Drop indicator line - AFTER */}
            {dropTargetIdx === idx && dropArea === "sequence" && dropPosition === "after" && dragSource?.area && (
              <div style={{
                width: "3px",
                height: "40px",
                background: "#4caf50",
                marginLeft: "5px",
                borderRadius: "2px"
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: "10px 24px",
            background: "#ffb74d",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Submit
        </button>
        <button
          onClick={handleReset}
          style={{
            padding: "10px 24px",
            background: "#bdbdbd",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Reset
        </button>
        <button
          onClick={handleNextFact}
          style={{
            padding: "10px 24px",
            background: "#90caf9",
            border: "none",
            borderRadius: "6px",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Next Fact
        </button>
      </div>
      {result && (
        <div style={{ textAlign: "center", fontSize: "1.2rem", color: result.includes("Correct") ? "#388e3c" : "#d32f2f" }}>
          {result}
        </div>
      )}

      {showAnswer && (
        <AnswerReveal 
          correctAnswer={fact} 
          onClose={() => setShowAnswer(false)} 
        />
      )}
    </div>
  );
}