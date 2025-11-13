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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Leaderboard table created or already exists.');
  } catch (err) {
    console.error('Error creating leaderboard table:', err);
  } finally {
    await pool.end();
  }
}

migrate();