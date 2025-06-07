const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));

// Serve the index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Serve challenge pages
app.get('/challenge1.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/challenge1.html'));
});

app.get('/challenge2.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/challenge2.html'));
});

app.get('/challenge3.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/challenge3.html'));
});

app.get('/challenge4.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/challenge4.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
