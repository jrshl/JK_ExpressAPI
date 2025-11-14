const mysql = require('mysql2/promise');

async function migrate() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'meowfacts',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    // Drop existing leaderboard table
    await pool.query('DROP TABLE IF EXISTS leaderboard');
    console.log('Dropped old leaderboard table');

    // Create fresh leaderboard
    await pool.query(`
      CREATE TABLE leaderboard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(100) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        game VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_game_difficulty (game, difficulty),
        INDEX idx_user_game (user_id, game, difficulty)
      );
    `);
    
    console.log(' Created fresh leaderboard ');
  } catch (err) {
    console.error(' Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
