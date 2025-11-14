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

async function getLeaderboard(req, res) {
  try {
    const { game, difficulty } = req.query;
    let query = `
      SELECT l.username, l.score, l.created_at
      FROM leaderboard l
      WHERE 1=1
    `;
    const params = [];

    if (game) {
      query += ' AND l.game = ?';
      params.push(game);
    }

    if (difficulty) {
      query += ' AND l.difficulty = ?';
      params.push(difficulty);
    }

    // For SpeedTyping, lower score (time) is better, so ASC; for others, higher score is better, DESC
    const orderDirection = game === 'SpeedTyping' ? 'ASC' : 'DESC';
    query += ` ORDER BY l.score ${orderDirection} LIMIT 10`;

    const [rows] = await pool.query(query, params);
    res.json({ leaders: rows.map(row => ({ name: row.username, score: row.score })) });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}

// Function to add or update score (if needed for posting scores) - subject to change
async function addScore(req, res) {
  try {
    const { score, game, difficulty } = req.body;
    const userId = req.session?.userId;
    
    // Check if user is logged in
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to submit scores' });
    }
    
    if (typeof score !== 'number' || !game) {
      return res.status(400).json({ error: 'Invalid score or game' });
    }

    // Get username from users table
    const [userRows] = await pool.query('SELECT username FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const username = userRows[0].username;

    if (game === 'TriviaMaster' || game === 'JumbledFacts') {
      // Accumulative: update existing score or insert new (no difficulty for these games)
      const [existing] = await pool.query(
        'SELECT id, score FROM leaderboard WHERE user_id = ? AND game = ?', 
        [userId, game]
      );
      
      if (existing.length > 0) {
        const newScore = existing[0].score + score;
        await pool.query('UPDATE leaderboard SET score = ? WHERE id = ?', [newScore, existing[0].id]);
      } else {
        await pool.query(
          'INSERT INTO leaderboard (user_id, username, score, game) VALUES (?, ?, ?, ?)', 
          [userId, username, score, game]
        );
      }
    } else if (game === 'SpeedTyping') {
      // For SpeedTyping, keep the best (lowest) score per difficulty
      if (!difficulty) {
        return res.status(400).json({ error: 'Difficulty is required for SpeedTyping' });
      }
      
      const [existing] = await pool.query(
        'SELECT id, score FROM leaderboard WHERE user_id = ? AND game = ? AND difficulty = ?', 
        [userId, game, difficulty]
      );
      
      if (existing.length > 0) {
        // Update only if new score is better (lower)
        if (score < existing[0].score) {
          await pool.query('UPDATE leaderboard SET score = ? WHERE id = ?', [score, existing[0].id]);
          return res.json({ success: true, newBest: true });
        }
        return res.json({ success: true, newBest: false });
      } else {
        await pool.query(
          'INSERT INTO leaderboard (user_id, username, score, game, difficulty) VALUES (?, ?, ?, ?, ?)', 
          [userId, username, score, game, difficulty]
        );
        return res.json({ success: true, newBest: true });
      }
    } else {
      // For other games, insert new score each time
      await pool.query(
        'INSERT INTO leaderboard (user_id, username, score, game, difficulty) VALUES (?, ?, ?, ?, ?)', 
        [userId, username, score, game, difficulty || null]
      );
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