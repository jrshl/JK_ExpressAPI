import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminFacts.css';

export default function AdminFacts() {
  const navigate = useNavigate();
  const [facts, setFacts] = useState([]);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch facts on component mount and when search changes
  useEffect(() => {
    const fetchFacts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/facts${search ? `?search=${search}` : ''}`);
        setFacts(response.data.facts);
        setError('');
      } catch (err) {
        console.error('Error fetching facts:', err);
        setError('Failed to load facts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchFacts();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Delete a fact
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fact?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/facts/${id}`);
      setFacts(facts.filter(f => f.id !== id));
      alert('Fact deleted successfully!');
    } catch (err) {
      console.error('Error deleting fact:', err);
      alert('Failed to delete fact. Please try again.');
    }
  };

  // Start editing a fact
  const startEdit = (fact) => {
    setEditId(fact.id);
    setEditText(fact.text);
  };

  // Save edited fact
  const handleEdit = async (id) => {
    if (!editText.trim()) {
      alert('Fact text cannot be empty');
      return;
    }

    try {
      await axios.put(`/api/admin/facts/${id}`, { text: editText });
      setFacts(facts.map(f => f.id === id ? { ...f, text: editText } : f));
      setEditId(null);
      setEditText('');
      alert('Fact updated successfully!');
    } catch (err) {
      console.error('Error updating fact:', err);
      alert('Failed to update fact. Please try again.');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditId(null);
    setEditText('');
  };

  return (
    <div className="admin-container">
      <button className="back-button" onClick={() => navigate('/')}>
        Back to Home
      </button>
      
      <div className="admin-header">
        <h1>Admin: Manage Cat Facts</h1>
        <p>View, edit, search, and delete facts from your database</p>
      </div>

      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Search facts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="fact-count">Total: {facts.length} facts</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading facts...</div>
      ) : (
        <div className="facts-list">
          {facts.length === 0 ? (
            <div className="no-facts">
              No facts found. {search && 'Try a different search term.'}
            </div>
          ) : (
            facts.map(fact => (
              <div key={fact.id} className="fact-item">
                <div className="fact-id">ID: {fact.id}</div>
                {editId === fact.id ? (
                  <div className="edit-mode">
                    <textarea
                      className="edit-textarea"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={4}
                    />
                    <div className="edit-actions">
                      <button className="btn-save" onClick={() => handleEdit(fact.id)}>
                        Save
                      </button>
                      <button className="btn-cancel" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="view-mode">
                    <p className="fact-text">{fact.text}</p>
                    <div className="fact-actions">
                      <button className="btn-edit" onClick={() => startEdit(fact)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(fact.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
