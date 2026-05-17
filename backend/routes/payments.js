// routes/payments.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET /api/payments
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*,
      c.first_name || ' ' || c.last_name AS customer_name,
      v.make || ' ' || v.model AS vehicle_name
    FROM payments p
    JOIN rentals   r ON r.id = p.rental_id
    JOIN customers c ON c.id = r.customer_id
    JOIN vehicles  v ON v.id = r.vehicle_id
    ORDER BY p.paid_at DESC
  `).all();
  res.json(rows);
});

// POST /api/payments — record a payment
router.post('/', (req, res) => {
  const { rental_id, amount, method, notes } = req.body;
  if (!rental_id || !amount)
    return res.status(400).json({ error: 'rental_id and amount are required' });

  const r = db.prepare('SELECT * FROM rentals WHERE id = ?').get(rental_id);
  if (!r) return res.status(404).json({ error: 'Rental not found' });

  const info = db.prepare(`
    INSERT INTO payments (rental_id, amount, method, notes)
    VALUES (?, ?, ?, ?)
  `).run(rental_id, amount, method || 'Cash', notes || '');

  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/payments/:id
router.delete('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Payment not found' });
  db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
