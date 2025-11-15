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
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login_date DATE DEFAULT NULL;
    `);

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
