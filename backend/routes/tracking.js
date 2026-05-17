// routes/tracking.js — Live vehicle location tracking
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET /api/tracking — all vehicles with their latest location
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT
      v.id, v.make, v.model, v.year, v.plate, v.type, v.color, v.status,
      COALESCE(vl.lat,       13.4122) AS lat,
      COALESCE(vl.lng,       121.1798) AS lng,
      COALESCE(vl.speed_kph, 0)       AS speed_kph,
      COALESCE(vl.heading,   0)       AS heading,
      COALESCE(vl.address,   '')      AS address,
      vl.updated_at,
      c.first_name || ' ' || c.last_name AS renter_name,
      c.phone AS renter_phone
    FROM vehicles v
    LEFT JOIN vehicle_locations vl ON vl.vehicle_id = v.id
    LEFT JOIN rentals r  ON r.vehicle_id = v.id AND r.status = 'active'
    LEFT JOIN customers c ON c.id = r.customer_id
    ORDER BY v.id
  `).all();
  res.json(rows);
});

// GET /api/tracking/:id — one vehicle location
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT v.*, vl.lat, vl.lng, vl.speed_kph, vl.heading, vl.address, vl.updated_at
    FROM vehicles v
    LEFT JOIN vehicle_locations vl ON vl.vehicle_id = v.id
    WHERE v.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(row);
});

// PATCH /api/tracking/:id — update a vehicle's GPS location
// Body: { lat, lng, speed_kph, heading, address }
router.patch('/:id', (req, res) => {
  const { lat, lng, speed_kph, heading, address } = req.body;

  if (lat === undefined || lng === undefined)
    return res.status(400).json({ error: 'lat and lng are required' });

  // Validate coordinates are roughly in the Philippines
  if (lat < 4 || lat > 22 || lng < 116 || lng > 127)
    return res.status(400).json({ error: 'Coordinates appear to be outside the Philippines' });

  // Upsert — insert if no location exists, update if it does
  db.prepare(`
    INSERT INTO vehicle_locations (vehicle_id, lat, lng, speed_kph, heading, address, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(vehicle_id) DO UPDATE SET
      lat        = excluded.lat,
      lng        = excluded.lng,
      speed_kph  = excluded.speed_kph,
      heading    = excluded.heading,
      address    = excluded.address,
      updated_at = excluded.updated_at
  `).run(
    req.params.id,
    lat, lng,
    speed_kph ?? 0,
    heading   ?? 0,
    address   ?? ''
  );

  res.json({ success: true, vehicle_id: parseInt(req.params.id), lat, lng, speed_kph, heading, address });
});

module.exports = router;
