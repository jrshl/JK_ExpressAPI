const express = require('express');
const fetch = require('node-fetch'); // if Node <18, else remove this line
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static frontend files (index.html, css, images) from "public" folder
app.use(express.static(path.join(__dirname, '../Frontend')));

// API route to fetch cat facts
app.get('/api/facts', async (req, res) => {
  try {
    const response = await fetch('https://meowfacts.herokuapp.com/?count=12');
    const data = await response.json();
    res.json({ fact: data.data });
  } catch (err) {
    res.status(500).json({ fact: ["Cats are amazing creatures!"] });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
