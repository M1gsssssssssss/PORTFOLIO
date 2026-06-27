import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

// Vite Plugin to save local data
function localJsonEditorPlugin() {
  return {
    name: 'local-json-editor',
    enforce: 'pre',
    configureServer(server) {
      // Add middleware to intercept POST /api/save-data
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-data' && req.method === 'POST') {
          (async () => {
            try {
              let body = '';
              for await (const chunk of req) {
                body += chunk.toString();
              }
              const data = JSON.parse(body);
              const jsonPath = path.resolve(process.cwd(), 'data.json');
              fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Data saved successfully!' }));
            } catch (err) {
              console.error('Error saving data:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          })();
        } else if (req.url === '/api/upload-photo' && req.method === 'POST') {
          // Read raw multipart body
          (async () => {
            try {
              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const rawBody = Buffer.concat(chunks);

              // Extract boundary from Content-Type header
              const contentType = req.headers['content-type'] || '';
              const boundaryMatch = contentType.match(/boundary=(.+)$/);
              if (!boundaryMatch) throw new Error('No boundary found');
              const boundary = '--' + boundaryMatch[1];

              // Split on boundary, find file part
              const bodyStr = rawBody.toString('binary');
              const parts = bodyStr.split(boundary);
              let fileBuffer = null;
              let ext = 'jpg';

              for (const part of parts) {
                if (part.includes('Content-Disposition') && part.includes('filename=')) {
                  // Extract file extension
                  const filenameMatch = part.match(/filename="(.+?)"/i);
                  if (filenameMatch) {
                    const filename = filenameMatch[1];
                    ext = filename.split('.').pop().toLowerCase() || 'jpg';
                  }
                  // Find double CRLF which separates headers from data
                  const headerEnd = part.indexOf('\r\n\r\n');
                  if (headerEnd !== -1) {
                    const fileStart = headerEnd + 4;
                    const fileEnd = part.lastIndexOf('\r\n');
                    const filePart = part.substring(fileStart, fileEnd > fileStart ? fileEnd : undefined);
                    fileBuffer = Buffer.from(filePart, 'binary');
                  }
                }
              }

              if (!fileBuffer) throw new Error('No file found in upload');

              // Ensure public directory exists
              const publicDir = path.resolve(process.cwd(), 'public');
              if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

              // Always save as profile.<ext>
              const savePath = path.resolve(publicDir, `profile.${ext}`);
              fs.writeFileSync(savePath, fileBuffer);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: `/profile.${ext}` }));
            } catch (err) {
              console.error('Upload error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          })();
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [localJsonEditorPlugin()]
});
