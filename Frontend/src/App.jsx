
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import SpeedTyping from "./pages/SpeedTyping";
import TriviaMaster from "./pages/TriviaMaster";
import JumbledFacts from "./pages/JumbledFacts"
import "./App.css";

const GAME_OPTIONS = [
  { value: "", label: "-- Choose a Game --" },
  { value: "/speed-typing", label: "🐱 Cat Speed Typing Adventure" },
  { value: "/trivia", label: "❓ Trivia Challenge" },
  { value: "/jumbled-facts", label: "🧩 Jumbled Facts" },
];

function randomCatImage() {
  const width = 280 + Math.floor(Math.random() * 50);
  const height = 180 + Math.floor(Math.random() * 30);
  return `https://placekitten.com/${width}/${height}`;
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function HomePage() {
  const [chunks, setChunks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState("");
  const autoSlideRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadFacts() {
      try {
        const res = await fetch("/api/facts");
        const data = await res.json();
        setChunks(chunkArray(data.fact, 3));
      } catch {
        setChunks([["😿 Couldn’t load facts."]]);
      }
    }
    loadFacts();
  }, []);

  useEffect(() => {
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (chunks.length ? (prev + 1) % chunks.length : 0));
    }, 5000);
    return () => clearInterval(autoSlideRef.current);
  }, [chunks]);

  function showSlide(index) {
    if (!chunks.length) return;
    if (index < 0) setCurrentIndex(chunks.length - 1);
    else if (index >= chunks.length) setCurrentIndex(0);
    else setCurrentIndex(index);
  }

  function goToGame() {
    if (selectedGame) {
      if (selectedGame.endsWith('.html')) {
        // For HTML pages, redirect to the static file
        window.location.href = selectedGame;
      } else {
        // For React routes, use navigate
        navigate(selectedGame);
      }
    } else {
      alert("Please select a game first!");
    }
  }

  function prevSlide() {
    showSlide(currentIndex - 1);
    resetAutoSlide();
  }
  function nextSlide() {
    showSlide(currentIndex + 1);
    resetAutoSlide();
  }
  function resetAutoSlide() {
    clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setCurrentIndex((prev) => (chunks.length ? (prev + 1) % chunks.length : 0));
    }, 5000);
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>🎮 Select a Game</h2>
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
        >
          {GAME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button onClick={goToGame}>Play</button>
      </div>

      <div className="main-content">
        <h1>Welcome to the Game Hub</h1>
        <p>Cat facts with cute frames! 🐾</p>

        <div className="slider-container">
          <div
            className="slides"
            style={{
              display: "flex",
              transition: "transform 0.5s ease-in-out",
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {chunks.map((group, i) => (
              <div className="slide" key={i}>
                {group.map((fact, j) => (
                  <div className="fact-card" key={j}>
                    {typeof fact === "string" && fact.startsWith("😿") ? (
                      <p>{fact}</p>
                    ) : (
                      <>
                        <img src={randomCatImage()} alt="Cute Cat" />
                        <p>{fact}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="controls">
            <button className="btn" onClick={prevSlide}>
              ⟨
            </button>
            <button className="btn" onClick={nextSlide}>
              ⟩
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/speed-typing" element={<SpeedTyping />} />
        <Route path="/trivia" element={<TriviaMaster />} />
        <Route path="/jumbled-facts" element={<JumbledFacts />} />
      </Routes>
    </BrowserRouter>
  );
}
