// server.js — AutoRent Express API Server
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');

const authMiddleware = require('./middleware/auth');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net",
                    "https://unpkg.com", "https://cdnjs.cloudflare.com",
                    "https://cdn.sheetjs.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com",
                    "https://unpkg.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      connectSrc:  ["'self'"],
    },
  },
}));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));      // unprotected
app.use('/api',           authMiddleware);                // guard all routes below
app.use('/api/vehicles',  require('./routes/vehicles'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/rentals',   require('./routes/rentals'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tracking',  require('./routes/tracking'));
app.use('/api/invoice',   require('./routes/invoice'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

// ─── CATCH-ALL → frontend ────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Always log the full error internally for debugging
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.error(err.stack);
  // In production, never expose internal error details to the client
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'An internal server error occurred.',
    ...(isDev && { stack: err.stack }),
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚗 AutoRent running at http://localhost:${PORT}`);
  console.log(`📦 API base: http://localhost:${PORT}/api\n`);
});
