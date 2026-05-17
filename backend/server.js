// server.js — AutoRent Express API Server
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authMiddleware = require('./middleware/auth');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

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
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚗 AutoRent running at http://localhost:${PORT}`);
  console.log(`📦 API base: http://localhost:${PORT}/api\n`);
});
