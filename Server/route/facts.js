const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');

const router = express.Router();

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meowfacts',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auth middleware - ensure user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  next();
};

// ONE-TIME-USE: Populate admin_facts from the API
router.post('/populate-from-api', async (req, res) => {
  try {
    // Check if the table is already populated
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM admin_facts');
    if (existing[0].count > 0) {
      return res.status(400).json({ message: 'admin_facts table is already populated.' });
    }

    // Fetch facts from the API
    const response = await axios.get('https://meowfacts.herokuapp.com/?count=234');
    const factsFromApi = response.data.data;

    if (!factsFromApi || factsFromApi.length === 0) {
      return res.status(500).json({ message: 'API returned no facts.' });
    }

    // only fetch unique facts
    const uniqueFacts = [...new Set(factsFromApi)];
    const query = 'INSERT INTO admin_facts (fact_id, fact_text) VALUES ?';
    const values = uniqueFacts.map((text, index) => [index + 1, text]); // Creates [[1, "fact one"], [2, "fact two"], ...]
    await pool.query(query, [values]);

    res.status(201).json({ message: `Successfully populated admin_facts with ${uniqueFacts.length} unique facts.` });

  } catch (err) {
    console.error('Population failed:', err);
    res.status(500).json({ error: 'Failed to populate database.' });
  }
});


// ----- POST /api/facts/encounter -----
// Store a fact ID for the logged-in user
router.post('/encounter', requireAuth, async (req, res) => {
  try {
    const { factId } = req.body;
    if (!factId) {
      return res.status(400).json({ error: 'factId is required' });
    }

    const userId = req.session.userId;

    // Insert only if not already encountered (IGNORE on duplicate)
    await pool.query(
      'INSERT IGNORE INTO user_facts (user_id, fact_id) VALUES (?, ?)',
      [userId, factId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error storing fact:', err);
    res.status(500).json({ error: 'Failed to store fact' });
  }
});

// ----- GET /api/facts/user -----
// Fetch encountered facts for the logged-in user from database
router.get('/user', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const query = `
      SELECT af.fact_id, af.fact_text
      FROM user_facts uf
      JOIN admin_facts af ON uf.fact_id = af.fact_id
      WHERE uf.user_id = ?
    `;
    const [userFacts] = await pool.query(query, [userId]);
    const factsObject = userFacts.reduce((acc, f) => ({ ...acc, [f.fact_id]: f.fact_text }), {});
    res.json({ facts: factsObject });
  } catch (err) {
    console.error('Error fetching user facts:', err);
    res.status(500).json({ error: 'Failed to fetch facts from database' });
  }
});

// ----- GET /api/facts/daily -----
// Get a single, stable daily fact based on the day of the year
router.get('/daily', async (req, res) => {
    try {
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM admin_facts');
        const totalFacts = totalRows[0].count;

        if (totalFacts === 0) {
            return res.status(404).json({ error: 'No facts in database. Please populate first.' });
        }

        const factId = (dayOfYear % totalFacts) + 1;

        const [fact] = await pool.query('SELECT fact_id, fact_text FROM admin_facts WHERE fact_id = ?', [factId]);

        if (fact.length === 0) {
            return res.status(404).json({ error: 'Daily fact not found.' });
        }

        res.json({ id: fact[0].fact_id, text: fact[0].fact_text });
    } catch (err) {
        console.error('Error fetching daily fact:', err);
        res.status(500).json({ error: 'Failed to fetch daily fact.' });
    }
});

// ----- GET /api/facts/admin -----
// Fetch all facts from database for the admin page
router.get('/admin', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT fact_id as id, fact_text as text FROM admin_facts ORDER BY fact_id';
    let queryParams = [];

    if (search && search.trim()) {
      query = 'SELECT fact_id as id, fact_text as text FROM admin_facts WHERE fact_text LIKE ? ORDER BY fact_id';
      queryParams.push(`%${search}%`);
    }

    const [facts] = await pool.query(query, queryParams);
    res.json({ facts });
  } catch (err) {
    console.error('Error fetching admin facts:', err);
    res.status(500).json({ error: 'Failed to fetch admin facts from database.' });
  }
});

// ----- PUT /api/facts/admin/:id -----
// Edit fact
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    await pool.query(
      'UPDATE admin_facts SET fact_text = ?, updated_at = CURRENT_TIMESTAMP WHERE fact_id = ?',
      [text, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating fact:', err);
    res.status(500).json({ error: 'Failed to update fact' });
  }
});

// ----- POST /api/facts/admin -----
// Add new fact
router.post('/admin', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    const [maxRow] = await pool.query('SELECT MAX(fact_id) AS maxId FROM admin_facts');
    const newId = (maxRow[0].maxId || 0) + 1;

    await pool.query(
      'INSERT INTO admin_facts (fact_id, fact_text) VALUES (?, ?)',
      [newId, text]
    );

    res.json({ success: true, id: newId });
  } catch (err) {
    console.error('Error adding fact:', err);
    res.status(500).json({ error: 'Failed to add fact' });
  }
});

// ----- DELETE /api/facts/admin/:id -----
// Delete fact
router.delete('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Also remove from user_facts
    await pool.query('DELETE FROM user_facts WHERE fact_id = ?', [id]);
    await pool.query('DELETE FROM admin_facts WHERE fact_id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting fact:', err);
    res.status(500).json({ error: 'Failed to delete fact' });
  }
});

// ----- GET /api/facts/count -----
// Get the total number of facts in the database
router.get('/count', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) as count FROM admin_facts');
    res.json({ count: result[0].count });
  } catch (err) {
    console.error('Error fetching facts count:', err);
    res.status(500).json({ error: 'Failed to fetch facts count' });
  }
});

module.exports = router;