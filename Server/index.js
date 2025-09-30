const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); // if Node <18, else remove this line
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static frontend files (index.html, css, images) from "public" folder
app.use(express.static(path.join(__dirname, '../Frontend/dist')));

// API route to fetch cat facts
/*app.get('/api/facts', async (req, res) => {
  try {
    const response = await fetch('https://meowfacts.herokuapp.com/?count=30');
    const data = await response.json();

    const facts = Array.isArray(data.data) ? data.data : [data.data];

    res.json({ fact: data.data });
  } catch (err) {
    res.status(500).json({ fact: ["Cats are amazing creatures!"] });
  }
});*/

app.get('/api/facts', async (req, res) => {
  try {
    const response = await fetch('https://meowfacts.herokuapp.com/?count=30');
    const data = await response.json();

    console.log("API response:", data); // 🐱 Debug

    const facts = Array.isArray(data.data) ? data.data : [data.data];
    while (facts.length < 30) facts.push(...facts); // repeat until enough
res.json({ fact: facts.slice(0, 30) });  // <- use plural here
  } catch (err) {
    console.error("Fetch error:", err);
    // Provide multiple dummy facts for testing
    res.status(500).json({ facts: [
      "Cats are amazing creatures!"
    ] });
  }
});



// Catch-all for React Router
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
