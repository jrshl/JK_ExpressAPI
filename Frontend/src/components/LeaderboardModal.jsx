import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import "./LeaderboardModal.css";

export default function LeaderboardModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("SpeedTyping");
  const [difficultyIndex, setDifficultyIndex] = useState(0);

  const games = [
    { key: "SpeedTyping", label: "Speed Typing" },
    { key: "TriviaMaster", label: "Trivia Master" },
    { key: "JumbledFacts", label: "Jumbled Facts" }
  ];

  const difficulties = [
    { key: "easy", label: "Easy" },
    { key: "medium", label: "Medium" },
    { key: "hard", label: "Hard" }
  ];

  const activeDifficulty = difficulties[difficultyIndex].key;

  const nextDifficulty = () => {
    setDifficultyIndex((prev) => (prev + 1) % difficulties.length);
  };

  const prevDifficulty = () => {
    setDifficultyIndex((prev) => (prev - 1 + difficulties.length) % difficulties.length);
  };

  useEffect(() => {
    let mounted = true;
    const fetchBoard = async () => {
      try {
        setLoading(true);
        let url = `/api/leaderboard?game=${activeTab}`;
        if (activeTab === "SpeedTyping") {
          url += `&difficulty=${activeDifficulty}`;
        }
        const res = await axios.get(url);
        if (!mounted) return;
        setList(res.data?.leaders || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError("Failed to load leaderboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBoard();
    return () => { mounted = false; };
  }, [activeTab, activeDifficulty]);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal modal-leaderboard">
        <div className="modal-header">
          <h2>Leaderboard</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-content">
          <div className="game-tabs">
            {games.map((game) => (
              <button
                key={game.key}
                onClick={() => setActiveTab(game.key)}
                className={`tab-btn ${activeTab === game.key ? "active" : ""}`}
              >
                {game.label}
              </button>
            ))}
          </div>

          {activeTab === "SpeedTyping" && (
            <div className="difficulty-selector">
              <div className="arrow-container">
                <button onClick={prevDifficulty} className="arrow-btn" aria-label="Previous difficulty">
                  <ChevronLeft size={20} />
                </button>
              </div>
              <div className="difficulty-label">{difficulties[difficultyIndex].label}</div>
              <div className="arrow-container">
                <button onClick={nextDifficulty} className="arrow-btn" aria-label="Next difficulty">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {loading && <div className="loading">Loading…</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && (
            <ol className="leaderboard-list">
              {list.length === 0 && <li>No entries yet</li>}
              {list.map((item, i) => (
                <li key={item.id || i}>
                  <strong>{item.name || "Anonymous"}</strong> — {item.score ?? item.points ?? 0}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}