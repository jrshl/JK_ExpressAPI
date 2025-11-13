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

// Function to get leaderboard
async function getLeaderboard(req, res) {
  try {
    const { game, difficulty } = req.query;
    let query = `
      SELECT name, score
      FROM leaderboard
      WHERE 1=1
    `;
    const params = [];

    if (game) {
      query += ' AND game = ?';
      params.push(game);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    // For SpeedTyping, lower score (time) is better, so ASC; for others, higher score is better, DESC
    const orderDirection = game === 'SpeedTyping' ? 'ASC' : 'DESC';
    query += ` ORDER BY score ${orderDirection} LIMIT 10`;

    const [rows] = await pool.query(query, params);
    res.json({ leaders: rows });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}

// Function to add or update score (if needed for posting scores)
async function addScore(req, res) {
  try {
    const { name, score, game, difficulty } = req.body;
    if (!name || typeof score !== 'number' || !game) {
      return res.status(400).json({ error: 'Invalid name, score, or game' });
    }

    if (game === 'TriviaMaster' || game === 'JumbledFacts') {
      // Accumulative: update existing score or insert new
      const [existing] = await pool.query('SELECT id, score FROM leaderboard WHERE name = ? AND game = ?', [name, game]);
      if (existing.length > 0) {
        const newScore = existing[0].score + score;
        await pool.query('UPDATE leaderboard SET score = ? WHERE id = ?', [newScore, existing[0].id]);
      } else {
        await pool.query('INSERT INTO leaderboard (name, score, game, difficulty) VALUES (?, ?, ?, ?)', [name, score, game, difficulty || 'easy']);
      }
    } else {
      // For other games, insert new score each time
      await pool.query('INSERT INTO leaderboard (name, score, game, difficulty) VALUES (?, ?, ?, ?)', [name, score, game, difficulty || 'easy']);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error adding score:', err);
    res.status(500).json({ error: 'Failed to add score' });
  }
}

module.exports = {
  getLeaderboard,
  addScore
};