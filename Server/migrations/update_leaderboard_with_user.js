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
    // Add user_id and username columns to leaderboard table
    await pool.query(`
      ALTER TABLE leaderboard 
      ADD COLUMN IF NOT EXISTS user_id INT,
      ADD COLUMN IF NOT EXISTS username VARCHAR(100),
      ADD FOREIGN KEY IF NOT EXISTS (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);
    
    console.log('Migration complete: leaderboard table updated');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping migration.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    await pool.end();
  }
}

migrate();
