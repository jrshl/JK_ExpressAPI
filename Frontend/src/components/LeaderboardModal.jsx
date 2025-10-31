import React, { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import "./LeaderboardModal.css";

export default function LeaderboardModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/leaderboard");
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
  }, []);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: 520, width: "90%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Leaderboard</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          {loading && <div>Loading…</div>}
          {error && <div style={{ color: "crimson" }}>{error}</div>}
          {!loading && !error && (
            <ol className="leaderboard-list" style={{ paddingLeft: 18, textAlign: "left", marginTop: 12 }}>
              {list.length === 0 && <li>No entries yet</li>}
              {list.map((item, i) => (
                <li key={item.id || i} style={{ marginBottom: 8 }}>
                  <strong>{item.name || "Anonymous"}</strong> — {item.score ?? item.points ?? 0}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}