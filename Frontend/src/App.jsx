import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import SpeedTyping from "./pages/SpeedTyping";
import TriviaMaster from "./pages/TriviaMaster";
import JumbledFacts from "./pages/JumbledFacts";
import "./App.css";

function HomePage() {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [facts, setFacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [count, setCount] = useState(1);
  const navigate = useNavigate();

  const slices = 6; // number of slots
  const sliceAngle = 360 / slices;

  async function spinWheel() {
    if (spinning) return;
    setSpinning(true);

    try {
      // fetch cat facts
      const res = await fetch(`https://meowfacts.herokuapp.com/?count=${count}`);
      const data = await res.json();
      const factList = Array.isArray(data.data) ? data.data : [data.data];
      setFacts(factList);

      // Random stop slice
      const selectedSlice = Math.floor(Math.random() * slices);
      const stopAngle = selectedSlice * sliceAngle + sliceAngle / 2;

      // Extra spins
      const extraSpins = 720 + Math.floor(Math.random() * 360);

      // Final rotation
      const finalRotation =
        rotation + extraSpins + (360 - (rotation % 360)) + stopAngle;

      setRotation(finalRotation);

      setTimeout(() => {
        setSpinning(false);
        setShowModal(true);
        console.log("Stopped at slice:", selectedSlice + 1);
      }, 3000);
    } catch {
      setFacts(["😿 Error loading facts."]);
      setSpinning(false);
      setShowModal(true);
    }
  }

  return (
    <div className="homepage">
      <h1 className="title">MEÖW FACTS</h1>

      <div className="layout">
        {/* LEFT CAT */}
        <div className="left-side">

        <div className="cat-gallery" onClick={() => navigate("/")}>
            Cat Gallery
          </div>
          <div className="fact-collection" onClick={() => navigate("/")}>
            Fact Library
          </div>

          {/*<img src="/images/homeCat.png" alt="cat-left" className="cat-left" />*/}
        </div>
        {/* WHEEL */}
<div className="center-section">
  <div className="wheel-wrapper">

    {/* Wheel */}
    <div
      className="wheel"
      style={{
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transition: spinning
          ? "transform 3s cubic-bezier(0.33, 1, 0.68, 1)"
          : "none",
      }}
    />

    {/* WHITE BACKGROUND AREA FOR SPIN + CONTROLLER */}
    <div className="spin-area">
      {/* SPIN BUTTON */}
      <button
        className="btn-spin"
        onClick={spinWheel}
        disabled={spinning}
      >
        {spinning ? "..." : "SPIN"}
      </button>

      {/* COUNT CONTROLLER */}
      <div className="controller">
        <button
          className="btn-control"
          onClick={() => setCount(Math.max(1, count - 1))}
        >
          -
        </button>
        <div className="count-display">x{count}</div>
        <button className="btn-control" onClick={() => setCount(count + 1)}>
          +
        </button>
      </div>
    </div>

    {/* ARROW */}
    {!showModal && <div className="arrow"></div>}
        </div>
        </div>

        {/* RIGHT SIDE GAMES */}
        <div className="right-side">
          <div className="game-modal" onClick={() => navigate("/speed-typing")}>
            Game 1
          </div>
          <div className="game-modal" onClick={() => navigate("/trivia")}>
            Game 2
          </div>
          <div
            className="game-modal"
            onClick={() => navigate("/jumbled-facts")}
          >
            Game 3
          </div>
        </div>
      </div>

      {/* FACT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>🐱 Cat Facts</h3>
            {facts.length > 1 ? (
              <div className="fact-slider">
                {facts.map((fact, i) => (
                  <div key={i} className="fact-card">
                    {fact}
                  </div>
                ))}
              </div>
            ) : (
              <p>{facts[0]}</p>
            )}
            <button className="close-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
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
