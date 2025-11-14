const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;
const mysql = require('mysql2/promise');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const authRoutes = require('./route/auth');
const factsRoutes = require('./route/facts');
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
const catRoutes = require('./route/cats')(pool);

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

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

// API Routes
app.use('/api/user', authRoutes);
app.use('/api/facts', factsRoutes);

// Leaderboard endpoint
app.get('/api/leaderboard', (req, res, next) => {
  console.log('GET /api/leaderboard - Session:', req.session?.userId ? `User ${req.session.userId}` : 'No session');
  console.log('Query params:', req.query);
  next();
}, getLeaderboard);

app.post('/api/leaderboard', (req, res, next) => {
  console.log('POST /api/leaderboard - Session:', req.session?.userId ? `User ${req.session.userId}` : 'No session');
  console.log('Request body:', req.body);
  next();
}, addScore);

// Public API endpoint for games
app.get('/api/random-facts', async (req, res) => {
  try {
    const { game, difficulty } = req.query;
    
    // Fetch from database
    const [dbResults] = await pool.query('SELECT fact_id, fact_text FROM admin_facts ORDER BY RAND()');
    let facts = dbResults;

    // Filter for SpeedTyping based on difficulty
    if (game === 'SpeedTyping' && difficulty) {
      const wordCountRanges = {
        easy: [1, 14],
        medium: [8, 27],
        hard: [15, 27]
      };
      const [minWords, maxWords] = wordCountRanges[difficulty] || [1, 27];
      facts = facts.filter(fact => {
        const wordCount = fact.fact_text.split(' ').length;
        return wordCount >= minWords && wordCount <= maxWords;
      });
      facts = facts.slice(0, 15);
    } else {
      // Default behavior: limit to 30
      facts = facts.slice(0, 30);
    }

    res.json({ facts: facts.map(f => ({ id: f.fact_id, text: f.fact_text })) });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ facts: [{ id: 0, text: "Cats are amazing creatures!" }] });
  }
});

// Spinner endpoint - returns only facts the user hasn't encountered yet
app.get('/api/spin-facts', async (req, res) => {
  try {
    const requestedCount = Math.max(1, Math.min(5, parseInt(req.query.count, 10) || 1));
    const userId = req.session?.userId;

    let encounteredIds = [];
    if (userId) {
      const [encounteredRows] = await pool.query(
        'SELECT fact_id FROM user_facts WHERE user_id = ?',
        [userId]
      );
      encounteredIds = encounteredRows.map(row => row.fact_id);
    }

    let query = 'SELECT fact_id, fact_text FROM admin_facts';
    let params = [];
    
    if (encounteredIds.length > 0) {
      // Create placeholders for IN clause
      const placeholders = encounteredIds.map(() => '?').join(',');
      query += ` WHERE fact_id NOT IN (${placeholders})`;
      params.push(...encounteredIds);
    }
    
    query += ' ORDER BY RAND() LIMIT ?';
    params.push(requestedCount);

    console.log('Spin Facts Query:', query);
    console.log('Params:', params);
    console.log('Requested Count:', requestedCount);

    const [dbResults] = await pool.query(query, params);

    console.log('Results:', dbResults.length, 'facts returned');

    res.json({ facts: dbResults.map(f => ({ id: f.fact_id, text: f.fact_text })) });
  } catch (err) {
    console.error("Error in /api/spin-facts:", err);
    res.status(500).json({ facts: [{ id: 0, text: "Cats are amazing creatures!" }] });
  }
});

app.use(express.static(path.join(__dirname, '../Frontend/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});