const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)); 
const path = require('path');

const app = express();
const PORT = 3000;


app.use(express.static(path.join(__dirname, '../Frontend/dist')));

app.get('/api/facts', async (req, res) => {
  try {
    const response = await fetch('https://meowfacts.herokuapp.com/?count=30');
    const data = await response.json();

    console.log("API response:", data); 

    const facts = Array.isArray(data.data) ? data.data : [data.data];
    while (facts.length < 30) facts.push(...facts); 
res.json({ fact: facts.slice(0, 30) });  
  } catch (err) {
    console.error("Fetch error:", err);
    
    res.status(500).json({ facts: [
      "Cats are amazing creatures!"
    ] });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
