// routes/dashboard.js — summary stats for the dashboard
const express = require('express');
const router  = express.Router();
const db      = require('../database');

router.get('/', (req, res) => {
  const fleetStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='available'   THEN 1 ELSE 0 END) AS available,
      SUM(CASE WHEN status='rented'      THEN 1 ELSE 0 END) AS rented,
      SUM(CASE WHEN status='maintenance' THEN 1 ELSE 0 END) AS maintenance
    FROM vehicles
  `).get();

  const rentalStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status='active'    THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status='active' AND date(end_date) < date('now') THEN 1 ELSE 0 END) AS overdue
    FROM rentals
  `).get();

  const revenue = db.prepare(`
    SELECT COALESCE(SUM(p.amount), 0) AS monthly_revenue
    FROM payments p
    WHERE strftime('%Y-%m', p.paid_at) = strftime('%Y-%m', 'now')
  `).get();

  const customerCount = db.prepare('SELECT COUNT(*) AS total FROM customers').get();

  const recentRentals = db.prepare(`
    SELECT r.id, r.status, r.start_date, r.end_date, r.total_amount,
      c.first_name || ' ' || c.last_name AS customer_name,
      v.make || ' ' || v.model AS vehicle_name
    FROM rentals r
    JOIN customers c ON c.id = r.customer_id
    JOIN vehicles  v ON v.id = r.vehicle_id
    ORDER BY r.created_at DESC LIMIT 5
  `).all();

  res.json({
    fleet: fleetStats,
    rentals: rentalStats,
    monthly_revenue: revenue.monthly_revenue,
    total_customers: customerCount.total,
    recent_rentals: recentRentals,
  });
});

module.exports = router;
