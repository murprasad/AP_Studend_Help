const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(FILE, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading app');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`AP SmartPrep running at http://localhost:${PORT}`);
});
