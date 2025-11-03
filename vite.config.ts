import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to handle API routes
function mockApiServer() {
  return {
    name: 'mock-api-server',
    configureServer(server) {
      // Handle the API routes before Vite's default middlewares
      server.middlewares.use((req, res, next) => {
        // Check if the request is for our API endpoints
        if (req.url?.startsWith('/api/nik/validate') && req.method === 'GET') {
          const url = new URL(`http://localhost${req.url}`);
          const nikParam = url.searchParams.get('nik');

          if (!nikParam) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'NIK parameter is required' }));
            return;
          }

          // Validate NIK format first
          if (!/^\d+$/.test(nikParam) || nikParam.length !== 16) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'error',
              pesan: 'Format NIK tidak valid. NIK harus 16 digit angka.'
            }));
            return;
          }

          // Read the local NIK parser file
          import('fs').then(fs => {
            const parserCode = fs.readFileSync('./src/lib/nik_parse.js', 'utf8');
            const wrappedCode = `
              ${parserCode}
              return nikParse;
            `;

            // Create a function that can parse the NIK
            // Using Function constructor for dynamic code execution
            const nikParseFunction = new Function(wrappedCode)() as (nik: string, callback: (result: unknown) => void) => void;

            // Execute the parsing function
            nikParseFunction(nikParam, (result) => {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            });
          }).catch((fetchError: unknown) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'error',
              pesan: 'Gagal memproses NIK: ' + (fetchError instanceof Error ? fetchError.message : 'Unknown error')
            }));
          });
          return; // Important: return to prevent next() from being called
        }

        if (req.url?.startsWith('/api/validate/nik') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const nik = data.nik;

              if (!nik) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'NIK field is required in request body' }));
                return;
              }

              // Validate NIK format
              if (!/^\d+$/.test(nik) || nik.length !== 16) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  status: 'error',
                  pesan: 'Format NIK tidak valid. NIK harus 16 digit angka.'
                }));
                return;
              }

              // Read the local NIK parser file
              import('fs').then(fs => {
                const parserCode = fs.readFileSync('./src/lib/nik_parse.js', 'utf8');
                const wrappedCode = `
                  ${parserCode}
                  return nikParse;
                `;

                // Create a function that can parse the NIK
                const nikParseFunction = new Function(wrappedCode)() as (nik: string, callback: (result: unknown) => void) => void;

                // Execute the parsing function
                nikParseFunction(nik, (result) => {
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                });
              }).catch((fetchError: unknown) => {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  status: 'error',
                  pesan: 'Failed to parse NIK: ' + (fetchError instanceof Error ? fetchError.message : 'Unknown error')
                }));
              });
            } catch (parseError) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                status: 'error',
                pesan: 'Invalid JSON in request body: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
              }));
            }
          });
          return; // Important: return to prevent next() from being called
        }

        // If not an API request, proceed with normal handling
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mockApiServer()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
