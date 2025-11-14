const express = require('express');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const router = express.Router();

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meowfacts',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ----- REGISTER -----
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashed]
    );

    res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ----- LOGIN -----
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const [cards] = await pool.query('SELECT card_name FROM cards WHERE user_id = ?', [user.id]);

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, user: { id: user.id, username: user.username, points: user.points, cards: cards.map(c => c.card_name) } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ----- LOGOUT -----
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ----- SESSION CHECK -----
router.get('/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      user: { id: req.session.userId, username: req.session.username }
    });
  } else {
    res.json({ loggedIn: false });
  }
});

module.exports = router;
