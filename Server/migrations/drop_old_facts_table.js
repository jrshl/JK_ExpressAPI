const mysql = require('mysql2/promise');

async function dropOldTable() {
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
    await pool.query('DROP TABLE IF EXISTS facts');
    console.log('Old facts table dropped successfully');
  } catch (err) {
    console.error('Error dropping facts table:', err);
  } finally {
    await pool.end();
  }
}

dropOldTable();
