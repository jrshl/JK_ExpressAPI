const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const authRoutes = require('./route/auth');
const MySQLStore = require('express-mysql-session')(session);


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meowfacts',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


const sessionStore = new MySQLStore({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meowfacts'
});

const { getLeaderboard, addScore } = require('./leaderboard');
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // or your frontend’s URL
  credentials: true
}));

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.static(path.join(__dirname, '../Frontend/dist')));

app.use(session({
  key: 'connect.sid',
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: false, // set true if HTTPS
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use('/api/user', authRoutes);

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

// Create new fact
app.post('/api/admin/facts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: "Fact text cannot be empty" });
    }
    const [result] = await pool.query('INSERT INTO facts (text) VALUES (?)', [text.trim()]);
    // result.insertId is the new auto-increment id
    const [rows] = await pool.query('SELECT id, text FROM facts WHERE id = ?', [result.insertId]);
    const newFact = rows[0];
    // respond with created fact
    res.status(201).json({ success: true, fact: newFact });
  } catch (err) {
    console.error("Error creating fact:", err);
    res.status(500).json({ error: "Failed to create fact" });
  }
});

// Leaderboard endpoint
app.get('/api/leaderboard', getLeaderboard);
app.post('/api/leaderboard', addScore);

// Public API endpoint
app.get('/api/facts', async (req, res) => {
  try {
    const { game, difficulty } = req.query;
    // get facts from DB
    const [rows] = await pool.query('SELECT text FROM facts');
    let facts = rows.map(row => row.text);

    if (facts.length === 0) {
      // If DB is empty, fetch from API and store
      const response = await axios.get('https://meowfacts.herokuapp.com/?count=30');
      facts = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      // Store in DB
      for (const fact of facts) {
        await pool.query('INSERT INTO facts (text) VALUES (?)', [fact]);
      }
    }

    // Filter for SpeedTyping based on difficulty
    if (game === 'SpeedTyping' && difficulty) {
      const wordCountRanges = {
        easy: [1, 14],
        medium: [8, 27],
        hard: [15, 27]
      };
      const [minWords, maxWords] = wordCountRanges[difficulty] || [1, 27];
      facts = facts.filter(fact => {
        const wordCount = fact.split(' ').length;
        return wordCount >= minWords && wordCount <= maxWords;
      });
      // Take up to 15 facts
      facts = facts.slice(0, 15);
    } else {
      // Default behavior: limit to 30
      facts = facts.slice(0, 30);
    }

    res.json({ fact: facts });
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

