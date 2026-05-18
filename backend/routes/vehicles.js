// routes/vehicles.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// ── Validates numeric and length constraints on vehicle fields ──
function validateVehicleFields(fields) {
  const currentYear = new Date().getFullYear();
  const errors = [];
  if (fields.year !== undefined) {
    const y = parseInt(fields.year);
    if (isNaN(y) || y < 1990 || y > currentYear + 1)
      errors.push(`year must be between 1990 and ${currentYear + 1}`);
  }
  if (fields.daily_rate !== undefined) {
    const r = parseFloat(fields.daily_rate);
    if (isNaN(r) || r < 1 || r > 99999)
      errors.push('daily_rate must be between 1 and 99,999');
  }
  if (fields.plate !== undefined) {
    const p = String(fields.plate).trim();
    if (p.length < 3 || p.length > 20)
      errors.push('plate must be 3 to 20 characters');
  }
  if (fields.make !== undefined) {
    const m = String(fields.make).trim();
    if (m.length < 1 || m.length > 50)
      errors.push('make must be 1 to 50 characters');
  }
  if (fields.model !== undefined) {
    const m = String(fields.model).trim();
    if (m.length < 1 || m.length > 50)
      errors.push('model must be 1 to 50 characters');
  }
  return errors;
}

// GET /api/vehicles — list all, optional ?status=available|rented|maintenance
router.get('/', (req, res) => {
  const { status } = req.query;
  const sql = status
    ? db.prepare('SELECT * FROM vehicles WHERE status = ? ORDER BY id')
    : db.prepare('SELECT * FROM vehicles ORDER BY id');
  res.json(status ? sql.all(status) : sql.all());
});

// GET /api/vehicles/:id
router.get('/:id', (req, res) => {
  const v = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(v);
});

// POST /api/vehicles — add a vehicle
router.post('/', (req, res) => {
  const { make, model, year, plate, type, color, daily_rate, status, notes } = req.body;
  if (!make || !model || !year || !plate || !daily_rate)
    return res.status(400).json({ error: 'make, model, year, plate, daily_rate are required' });
  const validationErrors = validateVehicleFields({ make, model, year, plate, daily_rate });
  if (validationErrors.length)
    return res.status(400).json({ error: validationErrors.join('; ') });

  const info = db.prepare(`
    INSERT INTO vehicles (make, model, year, plate, type, color, daily_rate, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(make, model, year, plate, type || 'Sedan', color || '', daily_rate, status || 'available', notes || '');

  res.status(201).json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(info.lastInsertRowid));
});

// PATCH /api/vehicles/:id — update fields
router.patch('/:id', (req, res) => {
  const v = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  const validationErrors = validateVehicleFields(req.body);
  if (validationErrors.length)
    return res.status(400).json({ error: validationErrors.join('; ') });

  const fields = ['make','model','year','plate','type','color','daily_rate','status','notes'];
  const updates = [];
  const values  = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); values.push(req.body[f]); }
  });
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id));
});

// DELETE /api/vehicles/:id
router.delete('/:id', (req, res) => {
  const v = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
