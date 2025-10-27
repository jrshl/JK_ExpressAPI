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
      CREATE TABLE IF NOT EXISTS facts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        text TEXT NOT NULL
      );
    `);
    console.log('Migration complete: facts table created.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();