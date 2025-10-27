const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = 3000;
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meowfacts',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.static(path.join(__dirname, '../Frontend/dist')));

// Admin endpoints for managing facts
app.get('/api/admin/facts', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT id, text FROM facts';
    let params = [];
    
    if (search) {
      query += ' WHERE text LIKE ?';
      params.push(`%${search}%`);
    }
    
    const [rows] = await pool.query(query, params);
    res.json({ facts: rows });
  } catch (err) {
    console.error("Error fetching facts:", err);
    res.status(500).json({ error: "Failed to fetch facts" });
  }
});

app.delete('/api/admin/facts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM facts WHERE id = ?', [id]);
    res.json({ success: true, message: "Fact deleted successfully" });
  } catch (err) {
    console.error("Error deleting fact:", err);
    res.status(500).json({ error: "Failed to delete fact" });
  }
});

app.put('/api/admin/facts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: "Fact text cannot be empty" });
    }
    
    await pool.query('UPDATE facts SET text = ? WHERE id = ?', [text, id]);
    res.json({ success: true, message: "Fact updated successfully" });
  } catch (err) {
    console.error("Error updating fact:", err);
    res.status(500).json({ error: "Failed to update fact" });
  }
});

// Public API endpoint
app.get('/api/facts', async (req, res) => {
  try {
    // get facts from DB
    const [rows] = await pool.query('SELECT text FROM facts LIMIT 30');
    if (rows.length > 0) {
      const facts = rows.map(row => row.text);
      return res.json({ fact: facts });
    }

    // If DB is empty, fetch from API and store
    const response = await axios.get('https://meowfacts.herokuapp.com/?count=30');
    const facts = Array.isArray(response.data.data) ? response.data.data : [response.data.data];

    // Store in DB
    for (const fact of facts) {
      await pool.query('INSERT INTO facts (text) VALUES (?)', [fact]);
    }

    res.json({ fact: facts.slice(0, 30) });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ facts: ["Cats are amazing creatures!"] });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});