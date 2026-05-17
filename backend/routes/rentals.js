// routes/rentals.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

const withDetails = `
  SELECT r.*,
    v.make || ' ' || v.model AS vehicle_name,
    v.plate,
    v.daily_rate,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.phone AS customer_phone,
    COALESCE((SELECT SUM(amount) FROM payments WHERE rental_id = r.id), 0) AS amount_paid,
    CASE
      WHEN r.status = 'active' AND date(r.end_date) < date('now') THEN 1
      ELSE 0
    END AS is_overdue,
    CASE
      WHEN r.status = 'active' AND date(r.end_date) < date('now')
      THEN CAST(julianday('now') - julianday(r.end_date) AS INTEGER)
      ELSE 0
    END AS days_overdue
  FROM rentals r
  JOIN vehicles  v ON v.id = r.vehicle_id
  JOIN customers c ON c.id = r.customer_id
`;

// GET /api/rentals — optional ?status=active|completed|cancelled
router.get('/', (req, res) => {
  const { status } = req.query;
  const sql = status
    ? db.prepare(withDetails + ' WHERE r.status = ? ORDER BY r.id DESC')
    : db.prepare(withDetails + ' ORDER BY r.id DESC');
  res.json(status ? sql.all(status) : sql.all());
});

// GET /api/rentals/:id
router.get('/:id', (req, res) => {
  const r = db.prepare(withDetails + ' WHERE r.id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Rental not found' });
  const payments = db.prepare('SELECT * FROM payments WHERE rental_id = ? ORDER BY paid_at').all(req.params.id);
  res.json({ ...r, payments });
});

// POST /api/rentals — create rental
router.post('/', (req, res) => {
  const { vehicle_id, customer_id, start_date, end_date, notes } = req.body;
  if (!vehicle_id || !customer_id || !start_date || !end_date)
    return res.status(400).json({ error: 'vehicle_id, customer_id, start_date, end_date are required' });

  // Check vehicle is available
  const v = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  if (v.status !== 'available')
    return res.status(409).json({ error: `Vehicle is currently ${v.status}` });

  // Calculate total
  const days = Math.max(1, Math.ceil((new Date(end_date) - new Date(start_date)) / 86400000));
  const total_amount = days * v.daily_rate;

  const txn = db.transaction(() => {
    const info = db.prepare(`
      INSERT INTO rentals (vehicle_id, customer_id, start_date, end_date, total_amount, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(vehicle_id, customer_id, start_date, end_date, total_amount, notes || '');

    db.prepare(`UPDATE vehicles SET status = 'rented' WHERE id = ?`).run(vehicle_id);
    return info.lastInsertRowid;
  });

  const id = txn();
  res.status(201).json(db.prepare(withDetails + ' WHERE r.id = ?').get(id));
});

// PATCH /api/rentals/:id/complete — mark rental as done
router.patch('/:id/complete', (req, res) => {
  const r = db.prepare('SELECT * FROM rentals WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Rental not found' });
  if (r.status !== 'active') return res.status(409).json({ error: 'Rental is not active' });

  db.transaction(() => {
    db.prepare(`UPDATE rentals SET status = 'completed' WHERE id = ?`).run(r.id);
    db.prepare(`UPDATE vehicles SET status = 'available' WHERE id = ?`).run(r.vehicle_id);
  })();

  res.json({ success: true, message: 'Rental completed' });
});

// PATCH /api/rentals/:id/cancel
router.patch('/:id/cancel', (req, res) => {
  const r = db.prepare('SELECT * FROM rentals WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Rental not found' });

  db.transaction(() => {
    db.prepare(`UPDATE rentals SET status = 'cancelled' WHERE id = ?`).run(r.id);
    db.prepare(`UPDATE vehicles SET status = 'available' WHERE id = ?`).run(r.vehicle_id);
  })();

  res.json({ success: true, message: 'Rental cancelled' });
});

module.exports = router;
