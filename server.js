import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { parse } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Read NIK parser and wrap it to return the function
const parserCode = readFileSync(path.resolve(__dirname, './src/lib/nik_parse.js'), 'utf8');
let nikParseFunction;

try {
  // Create a function that returns the nikParse function
  const wrappedCode = `
    ${parserCode}
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = nikParse;
    } else if (typeof window !== 'undefined') {
      window.nikParse = nikParse;
    }
    return nikParse;
  `;
  nikParseFunction = new Function(wrappedCode)();
} catch (error) {
  console.error('Error creating NIK parser:', error);
  process.exit(1);
}

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Handle GET /api/nik/validate
  if (pathname === '/api/nik/validate' && req.method === 'GET') {
    const nik = query.nik;
    if (!nik) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', pesan: 'NIK parameter is required' }));
      return;
    }

    if (!/^\d{16}$/.test(nik)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', pesan: 'Format NIK tidak valid. NIK harus 16 digit angka.' }));
      return;
    }

    // Execute the parsing function
    nikParseFunction(nik, (result) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    });
    return;
  }

  // Handle POST /api/validate/nik
  if (pathname === '/api/validate/nik' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { nik } = JSON.parse(body);
        if (!nik) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', pesan: 'NIK field is required in request body' }));
          return;
        }

        if (!/^\d{16}$/.test(nik)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', pesan: 'Format NIK tidak valid. NIK harus 16 digit angka.' }));
          return;
        }

        // Execute the parsing function
        nikParseFunction(nik, (result) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        });
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', pesan: 'Invalid JSON in request body' }));
      }
    });
    return;
  }

  // Serve static files from /dist
  let filePath = path.join(__dirname, 'dist', pathname === '/' ? 'index.html' : pathname);
  
  // Handle client-side routing - serve index.html for non-API routes that don't match files
  if (!filePath.includes('/api/')) {
    try {
      const data = readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.js' ? 'application/javascript' :
                          ext === '.css' ? 'text/css' :
                          ext === '.html' ? 'text/html' :
                          ext === '.json' ? 'application/json' :
                          ext === '.png' ? 'image/png' :
                          ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                          ext === '.gif' ? 'image/gif' :
                          ext === '.svg' ? 'image/svg+xml' :
                          'text/plain';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (err) {
      // If file doesn't exist, serve index.html for client-side routing
      try {
        const indexData = readFileSync(path.join(__dirname, 'dist', 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexData);
      } catch (indexErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }
  } else {
    // This shouldn't happen since API routes are handled above, but just in case
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});