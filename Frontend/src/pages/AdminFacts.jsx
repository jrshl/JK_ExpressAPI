import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import "./AdminFacts.css";

export default function AdminFacts() {
  const navigate = useNavigate();
  const [facts, setFacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for the one-time population
  const [isPopulated, setIsPopulated] = useState(false);
  const [populating, setPopulating] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "edit" | "delete" | "create"
  const [selectedFact, setSelectedFact] = useState(null);
  const [inputText, setInputText] = useState("");

  // Fetch facts from backend
  const fetchFacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/facts/admin${search ? `?search=${search}` : ""}`, { withCredentials: true });
      const fetchedFacts = response.data.facts || [];
      setFacts(fetchedFacts);
      if (fetchedFacts.length > 0) {
        setIsPopulated(true);
      }
      setError("");
    } catch (err) {
      console.error("Error fetching facts:", err);
      setError("Failed to load facts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(fetchFacts, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // --- ONE-TIME POPULATE FUNCTION ---
  const handlePopulate = async () => {
    if (window.confirm("Populate the database with unique facts from the API. Continue?")) {
      setPopulating(true);
      try {
        const res = await axios.post('/api/facts/populate-from-api');
        alert(res.data.message || "Population successful!");
        fetchFacts();
      } catch (error) {
        alert(error.response?.data?.message || "Population failed. The database might already be populated. Check server logs.");
      } finally {
        setPopulating(false);
      }
    }
  };

  // Modal open/close
  const openModal = (type, fact = null) => {
    setModalType(type);
    setSelectedFact(fact);
    setInputText(fact ? fact.text : "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    setSelectedFact(null);
    setInputText("");
  };

  // Create or update fact
  const handleSave = async () => {
    if (!inputText.trim()) return alert("Fact text cannot be empty.");

    try {
      if (modalType === "edit" && selectedFact) {
        // Update existing fact
        await axios.put(`/api/facts/admin/${selectedFact.id}`, { text: inputText }, { withCredentials: true });
        alert("Fact updated successfully!");
      } else if (modalType === "create") {
        // Create new fact
        await axios.post(`/api/facts/admin`, { text: inputText }, { withCredentials: true });
        alert("Fact created successfully!");
      }
      closeModal();
      fetchFacts(); // refresh list
    } catch (err) {
      console.error("Error saving fact:", err);
      alert("Failed to save fact. Please try again.");
    }
  };

  // Delete fact
  const handleDelete = async () => {
    if (!selectedFact) return;
    try {
      await axios.delete(`/api/facts/admin/${selectedFact.id}`, { withCredentials: true });
      alert("Fact deleted successfully!");
      closeModal();
      fetchFacts(); // refresh list
    } catch (err) {
      console.error("Error deleting fact:", err);
      alert("Failed to delete fact. Please try again.");
    }
  };

  return (
    <div className="admin-container">
      <button className="back-button" onClick={() => navigate("/")}>
        Back to Home
      </button>

      <div className="admin-header">
        <h1>Admin: Manage Cat Facts</h1>
        <p>View, create, edit, and delete facts stored in your database</p>
      </div>

      <div className="search-section">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search facts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="fact-count">Total: {facts.length} facts</span>
        <button className="btn-create" onClick={() => openModal("create")}>
          <Plus size={20} />
        </button>
        
        {/* --- POPULATE BUTTON --- */}
        <button 
          className="btn-populate" 
          onClick={handlePopulate} 
          disabled={isPopulated || populating}
          title={isPopulated ? "Database is already populated." : "Run this once to fill the database."}
        >
          {populating ? 'Populating...' : 'Populate DB (One-Time)'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading facts...</div>
      ) : (
        <div className="facts-list">
          {facts.length === 0 ? (
            <div className="no-facts">
              No facts found. {search ? "Try a different search term." : "You may need to populate the database."}
            </div>
          ) : (
            facts.map((fact) => (
              <div key={fact.id} className="fact-item">
                <div className="fact-id">ID: {fact.id}</div>
                <div className="view-mode">
                  <p className="fact-text">{fact.text}</p>
                  <div className="fact-actions">
                    <button
                      className="icon-btn edit"
                      onClick={() => openModal("edit", fact)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => openModal("delete", fact)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {modalType === "delete" ? (
              <>
                <h2>Delete Fact</h2>
                <p>Are you sure you want to delete this fact?</p>
                <div className="modal-buttons">
                  <button className="btn-delete" onClick={handleDelete}>
                    Yes, Delete
                  </button>
                  <button className="btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>
                  {modalType === "edit" ? "Edit Fact" : "Create New Fact"}
                </h2>
                <textarea
                  className="edit-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                />
                <div className="modal-buttons">
                  <button className="btn-save" onClick={handleSave}>
                    Save
                  </button>
                  <button className="btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
