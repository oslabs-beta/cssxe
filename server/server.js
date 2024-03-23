import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import cdpProcess from '../client/cdp/cdp0process.js';

const app = express();
const PORT = 8888;


// need to do this when doing ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON request bodies
app.use(express.json());

console.log('Current environment:', process.env.NODE_ENV);

app.use(express());

if (process.env.NODE_ENV === 'production') {
  // Serve static files (CSSxe UI)
  app.use(express.static(path.join(__dirname, '../dist')));
}


app.post('/cdp', async (req, res) => {
  console.log('POST /cdp');
  // console.log(req.body);
  const data = req.body;

  try {
    console.log('server: /cdp: cdpProcess about to start');
    const result = await cdpProcess(data);
    console.log('server: /cdp: result should be returning now');
    // console.log('server: cdp: result:', result);
    return res.json( result );
  } catch (error) {
    console.error('Error processing data:', error);
    return res.status(500).json({ error: 'Failed to process data' });
  }
});

app.use((req, res) => res.sendStatus(404));

app.use((err, req, res, next) => {
  console.error(err);
  res.sendStatus(500);
});

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
