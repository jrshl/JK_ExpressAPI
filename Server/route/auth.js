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

    req.session.userId = user.id;
    req.session.username = user.username;

    // Check if this is the first login of the day
    const today = new Date().toISOString().split('T')[0];
    const lastLoginDate = user.last_login_date ? new Date(user.last_login_date).toISOString().split('T')[0] : null;
    const isFirstLoginToday = !lastLoginDate || lastLoginDate !== today;

    console.log('Login Debug:', { 
      userId: user.id, 
      lastLoginDate, 
      today, 
      isFirstLoginToday 
    });

    let dailyFact = null;
    if (isFirstLoginToday) {
      // Count how many daily facts the user has received (days since account creation)
      const [loginCountResult] = await pool.query(
        'SELECT DATEDIFF(CURDATE(), DATE(created_at)) as days_since_creation FROM users WHERE id = ?',
        [user.id]
      );
      const daysSinceCreation = loginCountResult[0].days_since_creation;

      if (daysSinceCreation < 7) {
        // First week: Select random fact using user.id as seed + day offset for consistency
        const seed = user.id * 1000 + daysSinceCreation;
        const [factRows] = await pool.query(`
          SELECT fact_id, fact_text 
          FROM admin_facts 
          ORDER BY RAND(?) 
          LIMIT 1
        `, [seed]);

        if (factRows.length > 0) {
          dailyFact = { id: factRows[0].fact_id, text: factRows[0].fact_text };
          
          // Store as encountered fact
          await pool.query(
            'INSERT IGNORE INTO user_facts (user_id, fact_id) VALUES (?, ?)',
            [user.id, dailyFact.id]
          );
        }
      } else {
        // After first week: Show random fact from user's encountered facts
        const [encounteredFactRows] = await pool.query(`
          SELECT af.fact_id, af.fact_text
          FROM user_facts uf
          JOIN admin_facts af ON uf.fact_id = af.fact_id
          WHERE uf.user_id = ?
          ORDER BY RAND()
          LIMIT 1
        `, [user.id]);

        if (encounteredFactRows.length > 0) {
          dailyFact = { id: encounteredFactRows[0].fact_id, text: encounteredFactRows[0].fact_text };
        }
      }
      
      // Update last login date ONLY if we showed a daily fact
      const updateResult = await pool.query('UPDATE users SET last_login_date = ? WHERE id = ?', [today, user.id]);
      console.log('Update last_login_date result:', updateResult[0]);
    }

    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username },
      dailyFact: dailyFact
    });
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
