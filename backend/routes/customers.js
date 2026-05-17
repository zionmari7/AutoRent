// routes/customers.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET /api/customers
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
      COUNT(r.id)       AS total_rentals,
      COALESCE(SUM(p.amount), 0) AS total_spent
    FROM customers c
    LEFT JOIN rentals  r ON r.customer_id = c.id
    LEFT JOIN payments p ON p.rental_id   = r.id
    GROUP BY c.id
    ORDER BY c.id
  `).all();
  res.json(rows);
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  const c = db.prepare(`
    SELECT c.*,
      COUNT(r.id) AS total_rentals,
      COALESCE(SUM(p.amount), 0) AS total_spent
    FROM customers c
    LEFT JOIN rentals  r ON r.customer_id = c.id
    LEFT JOIN payments p ON p.rental_id   = r.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });

  // Also fetch their rental history
  const rentals = db.prepare(`
    SELECT r.*, v.make || ' ' || v.model AS vehicle_name, v.plate
    FROM rentals r
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.customer_id = ?
    ORDER BY r.start_date DESC
  `).all(req.params.id);

  res.json({ ...c, rentals });
});

// POST /api/customers
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, license_no, address } = req.body;
  if (!first_name || !last_name)
    return res.status(400).json({ error: 'first_name and last_name are required' });

  const info = db.prepare(`
    INSERT INTO customers (first_name, last_name, email, phone, license_no, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(first_name, last_name, email || '', phone || '', license_no || '', address || '');

  res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid));
});

// PATCH /api/customers/:id
router.patch('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });

  const fields = ['first_name','last_name','email','phone','license_no','address'];
  const updates = [], values = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id));
});

// DELETE /api/customers/:id
router.delete('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
