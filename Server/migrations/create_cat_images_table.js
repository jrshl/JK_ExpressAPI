const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'meowfacts'
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cat_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category ENUM('Players', 'Collectors', 'Spinner') NOT NULL,
        name VARCHAR(100) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL
      );
    `);

    console.log("cat_images table created successfully!");
  } catch (err) {
    console.error("Error creating cat_images table:", err);
  } finally {
    await connection.end();
  }
}

migrate();
