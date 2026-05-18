// routes/notifications.js — generates business-critical alerts
const express = require('express');
const router  = express.Router();
const db      = require('../database');

router.get('/', (req, res) => {
  const alerts = [];

  // CRITICAL: Overdue rentals
  const overdue = db.prepare(`
    SELECT r.id, c.first_name || ' ' || c.last_name AS customer,
      v.make || ' ' || v.model AS vehicle, v.plate, r.end_date,
      CAST(julianday('now') - julianday(r.end_date) AS INTEGER) AS days_late
    FROM rentals r
    JOIN customers c ON c.id = r.customer_id
    JOIN vehicles  v ON v.id = r.vehicle_id
    WHERE r.status = 'active' AND date(r.end_date) < date('now')
    ORDER BY r.end_date ASC
  `).all();
  overdue.forEach(r => alerts.push({
    level:       'critical',
    icon:        '🚨',
    title:       `Overdue: ${r.vehicle} (${r.plate})`,
    message:     `${r.customer} — ${r.days_late} day${r.days_late !== 1 ? 's' : ''} overdue since ${r.end_date}`,
    action:      'rentals',
    target_id:   r.id,
    target_type: 'rental',
  }));

  // WARNING: Rentals ending tomorrow
  const endingSoon = db.prepare(`
    SELECT r.id, c.first_name || ' ' || c.last_name AS customer,
      c.phone, v.make || ' ' || v.model AS vehicle, v.plate, r.end_date
    FROM rentals r
    JOIN customers c ON c.id = r.customer_id
    JOIN vehicles  v ON v.id = r.vehicle_id
    WHERE r.status = 'active'
      AND date(r.end_date) = date('now', '+1 day')
  `).all();
  endingSoon.forEach(r => alerts.push({
    level:       'warning',
    icon:        '📅',
    title:       `Due tomorrow: ${r.vehicle} (${r.plate})`,
    message:     `${r.customer}${r.phone ? ' · ' + r.phone : ''} — return by ${r.end_date}`,
    action:      'rentals',
    target_id:   r.id,
    target_type: 'rental',
  }));

  // WARNING: Unpaid or partial payments on active rentals
  const unpaid = db.prepare(`
    SELECT r.id, c.first_name || ' ' || c.last_name AS customer,
      v.make || ' ' || v.model AS vehicle,
      r.total_amount,
      COALESCE(SUM(p.amount), 0) AS paid
    FROM rentals r
    JOIN customers c ON c.id = r.customer_id
    JOIN vehicles  v ON v.id = r.vehicle_id
    LEFT JOIN payments p ON p.rental_id = r.id
    WHERE r.status = 'active'
    GROUP BY r.id
    HAVING paid < r.total_amount
    ORDER BY (r.total_amount - paid) DESC
  `).all();
  unpaid.forEach(r => {
    const balance = r.total_amount - r.paid;
    alerts.push({
      level:       'warning',
      icon:        '💳',
      title:       `Balance due: ${r.vehicle}`,
      message:     `${r.customer} owes ₱${balance.toLocaleString()} of ₱${r.total_amount.toLocaleString()}`,
      action:      'payments',
      target_id:   r.id,
      target_type: 'rental',
    });
  });

  // INFO: Vehicles in maintenance
  const maintenance = db.prepare(`
    SELECT id, make || ' ' || model AS vehicle, plate
    FROM vehicles WHERE status = 'maintenance'
  `).all();
  maintenance.forEach(v => alerts.push({
    level:       'info',
    icon:        '🔧',
    title:       `Under maintenance: ${v.vehicle}`,
    message:     `${v.plate} — remember to schedule return to service`,
    action:      'fleet',
    target_id:   v.id,
    target_type: 'vehicle',
  }));

  // INFO: Long rentals (7+ days active)
  const longRentals = db.prepare(`
    SELECT r.id, c.first_name || ' ' || c.last_name AS customer,
      v.make || ' ' || v.model AS vehicle, r.start_date,
      CAST(julianday('now') - julianday(r.start_date) AS INTEGER) AS days_out
    FROM rentals r
    JOIN customers c ON c.id = r.customer_id
    JOIN vehicles  v ON v.id = r.vehicle_id
    WHERE r.status = 'active'
      AND julianday('now') - julianday(r.start_date) >= 7
  `).all();
  longRentals.forEach(r => alerts.push({
    level:       'info',
    icon:        '📆',
    title:       `Long rental: ${r.vehicle}`,
    message:     `${r.customer} — ${r.days_out} days since ${r.start_date}`,
    action:      'rentals',
    target_id:   r.id,
    target_type: 'rental',
  }));

  const urgentCount = alerts.filter(a => a.level === 'critical' || a.level === 'warning').length;
  res.json({ alerts, urgentCount });
});

module.exports = router;
