require('./src/env');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { seedIfEmpty, dbPath } = require('./src/db');
const { publicApi, adminApi } = require('./src/routes');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'style-src': ["'self'", 'https://fonts.googleapis.com'],
      'style-src-attr': ["'unsafe-inline'"], // small inline style="" attributes in the pages
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'upgrade-insecure-requests': null       // lets http://localhost work in every browser
    }
  }
}));
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

// API
app.use('/api/admin', adminApi);
app.use('/api', publicApi);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Static frontend
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '1h' }));

// Errors (bad JSON, database problems, ...)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side.' });
});

if (seedIfEmpty()) console.log('Seeded the database with sample articles.');

app.listen(PORT, () => {
  console.log(`Nova Journal running at http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
  console.log(`Admin:    http://localhost:${PORT}/admin.html`);
});
