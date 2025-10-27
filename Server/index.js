const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

const PORT = 3000;
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'meowfacts',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(express.static(path.join(__dirname, '../Frontend/dist')));

app.get('/api/facts', async (req, res) => {
  try {
    // get facts from DB
    const [rows] = await pool.query('SELECT text FROM facts LIMIT 30');
    if (rows.length > 0) {
      const facts = rows.map(row => row.text);
      return res.json({ fact: facts });
    }

    // If DB is empty, fetch from API and store
    const response = await axios.get('https://meowfacts.herokuapp.com/?count=30');
    const facts = Array.isArray(response.data.data) ? response.data.data : [response.data.data];

    // Store in DB
    for (const fact of facts) {
      await pool.query('INSERT INTO facts (text) VALUES (?)', [fact]);
    }

    res.json({ fact: facts.slice(0, 30) });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ facts: ["Cats are amazing creatures!"] });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});