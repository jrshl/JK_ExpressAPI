import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import SuccessModal from "../components/SuccessModal";
import "./AdminFacts.css";

export default function AdminFacts() {
  const navigate = useNavigate();
  const [facts, setFacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const factsPerPage = 10;

  // State for the one-time population
  const [isPopulated, setIsPopulated] = useState(false);
  const [populating, setPopulating] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "edit" | "delete" | "create"
  const [selectedFact, setSelectedFact] = useState(null);
  const [inputText, setInputText] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch facts from backend
  const fetchFacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/facts/admin${search ? `?search=${search}` : ""}`, { withCredentials: true });
      const fetchedFacts = response.data.facts || [];
      // Sort by ID descending (LIFO - newest first)
      const sortedFacts = fetchedFacts.sort((a, b) => b.id - a.id);
      setFacts(sortedFacts);
      if (fetchedFacts.length > 0) {
        setIsPopulated(true);
      }
      setError("");
      setCurrentPage(1); // Reset to first page on new search
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
        setPopulating(false);
        setSuccessMessage(res.data.message || "Database populated successfully!");
        setShowSuccess(true);
        fetchFacts();
      } catch (error) {
        setPopulating(false);
        alert(error.response?.data?.message || "Population failed. The database might already be populated. Check server logs.");
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
  
  // Confirmation for save
  const handleSaveConfirm = () => {
    if (!inputText.trim()) return alert("Fact text cannot be empty.");
    
    // Show confirmation modal
    setShowModal(false);
    setModalType(modalType === "edit" ? "confirm-edit" : "confirm-create");
    setShowModal(true);
  };

  // Create or update fact
  const handleSave = async () => {
    if (!inputText.trim()) return alert("Fact text cannot be empty.");

    try {
      if (modalType === "confirm-edit" && selectedFact) {
        // Update existing fact
        await axios.put(`/api/facts/admin/${selectedFact.id}`, { text: inputText }, { withCredentials: true });
        setSuccessMessage("Fact updated successfully!");
      } else if (modalType === "confirm-create") {
        // Create new fact
        await axios.post(`/api/facts/admin`, { text: inputText }, { withCredentials: true });
        setSuccessMessage("Fact created successfully!");
      }
      closeModal();
      setShowSuccess(true);
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
      closeModal();
      setSuccessMessage("Fact deleted successfully!");
      setShowSuccess(true);
      fetchFacts(); // refresh list
    } catch (err) {
      console.error("Error deleting fact:", err);
      alert("Failed to delete fact. Please try again.");
    }
  };

  // Pagination
  const indexOfLastFact = currentPage * factsPerPage;
  const indexOfFirstFact = indexOfLastFact - factsPerPage;
  const currentFacts = facts.slice(indexOfFirstFact, indexOfLastFact);
  const totalPages = Math.ceil(facts.length / factsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-facts-container">
      <button className="admin-facts-back-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>

      <div className="admin-facts-header">
        <h1>Admin: Manage Cat Facts</h1>
      </div>

      <div className="admin-facts-controls">
        <div className="admin-facts-search-wrapper">
          <Search className="admin-facts-search-icon" size={18} />
          <input
            type="text"
            className="admin-facts-search-input"
            placeholder="Search facts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="admin-facts-count">Total: {facts.length} facts</span>
        <button className="admin-facts-btn-create" onClick={() => openModal("create")}>
          <Plus size={20} /> Add Fact
        </button>
        
        {!isPopulated && (
          <button 
            className="admin-facts-btn-populate" 
            onClick={handlePopulate} 
            disabled={populating}
            title="Run this once to fill the database."
          >
            {populating ? 'Populating...' : 'Populate DB'}
          </button>
        )}
      </div>

      {error && <div className="admin-facts-error">{error}</div>}

      {loading ? (
        <div className="admin-facts-loading">Loading facts...</div>
      ) : (
        <>
          {facts.length === 0 ? (
            <div className="admin-facts-empty">
              No facts found. {search ? "Try a different search term." : "You may need to populate the database."}
            </div>
          ) : (
            <>
              <div className="admin-facts-table-wrapper">
                <table className="admin-facts-table">
                  <thead>
                    <tr>
                      <th className="admin-facts-th-num">#</th>
                      <th className="admin-facts-th-id">Fact ID</th>
                      <th className="admin-facts-th-text">Fact Text</th>
                      <th className="admin-facts-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFacts.map((fact, index) => (
                      <tr key={fact.id} className="admin-facts-row">
                        <td className="admin-facts-td-num">{indexOfFirstFact + index + 1}</td>
                        <td className="admin-facts-td-id">{fact.id}</td>
                        <td className="admin-facts-td-text">
                          <div className="admin-facts-text-ellipsis">{fact.text}</div>
                        </td>
                        <td className="admin-facts-td-actions">
                          <button
                            className="admin-facts-icon-btn admin-facts-edit-btn"
                            onClick={() => openModal("edit", fact)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="admin-facts-icon-btn admin-facts-delete-btn"
                            onClick={() => openModal("delete", fact)}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="admin-facts-pagination">
                  <button 
                    className="admin-facts-page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <div className="admin-facts-page-numbers">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        className={`admin-facts-page-num ${currentPage === i + 1 ? 'admin-facts-active-page' : ''}`}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    className="admin-facts-page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-facts-modal-overlay">
          <div className="admin-facts-modal-content">
            {modalType === "delete" ? (
              <>
                <h2>Delete Fact</h2>
                <p>Are you sure you want to delete this fact?</p>
                <p className="admin-facts-modal-fact-preview">"{selectedFact?.text}"</p>
                <div className="admin-facts-modal-buttons">
                  <button className="admin-facts-btn-delete" onClick={handleDelete}>
                    Yes, Delete
                  </button>
                  <button className="admin-facts-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : modalType === "confirm-edit" ? (
              <>
                <h2>Confirm Edit</h2>
                <p>Are you sure you want to save changes to this fact?</p>
                <div className="admin-facts-modal-buttons">
                  <button className="admin-facts-btn-save" onClick={handleSave}>
                    Yes, Save Changes
                  </button>
                  <button className="admin-facts-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            ) : modalType === "confirm-create" ? (
              <>
                <h2>Confirm Create</h2>
                <p>Are you sure you want to add this new fact?</p>
                <p className="admin-facts-modal-fact-preview">"{inputText}"</p>
                <div className="admin-facts-modal-buttons">
                  <button className="admin-facts-btn-save" onClick={handleSave}>
                    Yes, Create Fact
                  </button>
                  <button className="admin-facts-btn-cancel" onClick={closeModal}>
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
                  className="admin-facts-textarea"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={5}
                  placeholder="Enter fact text..."
                />
                <div className="admin-facts-modal-buttons">
                  <button className="admin-facts-btn-save" onClick={handleSaveConfirm}>
                    Save
                  </button>
                  <button className="admin-facts-btn-cancel" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal 
          message={successMessage} 
          onClose={() => setShowSuccess(false)} 
        />
      )}
    </div>
  );
}
