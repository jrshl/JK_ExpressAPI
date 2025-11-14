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
      CREATE TABLE IF NOT EXISTS admin_facts (
        fact_id INT PRIMARY KEY,
        fact_text TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ admin_facts table created successfully');
  } catch (err) {
    console.error('Error creating admin_facts table:', err);
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
    await connection.query('DROP TABLE IF EXISTS admin_facts');
    console.log('✓ admin_facts table dropped successfully');
  } catch (err) {
    console.error('Error dropping admin_facts table:', err);
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
