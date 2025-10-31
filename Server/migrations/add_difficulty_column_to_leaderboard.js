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
      ALTER TABLE leaderboard
      ADD COLUMN difficulty VARCHAR(20) DEFAULT 'easy'
    `);
    console.log('Added difficulty column to leaderboard table.');
  } catch (err) {
    console.error('Error altering leaderboard table:', err);
  } finally {
    await pool.end();
  }
}

migrate();