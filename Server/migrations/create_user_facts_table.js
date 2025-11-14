const mysql = require('mysql2/promise');

async function up() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'meowfacts'
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_facts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        fact_id INT NOT NULL,
        encountered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_fact (user_id, fact_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ user_facts table created successfully');
  } catch (err) {
    console.error('Error creating user_facts table:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

async function down() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'meowfacts'
  });

  try {
    await connection.query('DROP TABLE IF EXISTS user_facts');
    console.log('✓ user_facts table dropped successfully');
  } catch (err) {
    console.error('Error dropping user_facts table:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  up().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { up, down };
