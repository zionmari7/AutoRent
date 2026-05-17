// routes/invoice.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET /api/invoice/:rentalId
router.get('/:rentalId', (req, res) => {
  const rental = db.prepare(`
    SELECT r.id, r.start_date, r.end_date, r.total_amount, r.status, r.notes
    FROM rentals r
    WHERE r.id = ?
  `).get(req.params.rentalId);

  if (!rental) return res.status(404).json({ error: 'Rental not found' });

  const rentalRow = db.prepare('SELECT vehicle_id, customer_id FROM rentals WHERE id = ?').get(rental.id);

  const vehicle = db.prepare(`
    SELECT make, model, year, plate, type, daily_rate
    FROM vehicles WHERE id = ?
  `).get(rentalRow.vehicle_id);

  const customer = db.prepare(`
    SELECT first_name, last_name, email, phone, license_no, address
    FROM customers WHERE id = ?
  `).get(rentalRow.customer_id);

  const payments = db.prepare(`
    SELECT amount, method, paid_at, notes
    FROM payments WHERE rental_id = ? ORDER BY paid_at
  `).all(rental.id);

  const days = Math.max(1, Math.ceil((new Date(rental.end_date) - new Date(rental.start_date)) / 86400000));

  const amount_paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance_due = Math.max(0, rental.total_amount - amount_paid);

  res.json({
    rental: { ...rental, days },
    vehicle,
    customer,
    payments,
    summary: {
      total_amount: rental.total_amount,
      amount_paid,
      balance_due,
      is_paid: balance_due === 0,
    },
    company: {
      name:    process.env.COMPANY_NAME    || 'AutoRent',
      address: process.env.COMPANY_ADDRESS || 'Lipa City, Batangas',
      phone:   process.env.COMPANY_PHONE   || '+63 917 000 0000',
      email:   process.env.COMPANY_EMAIL   || 'autorent@email.com',
      tin:     process.env.COMPANY_TIN     || '',
    },
  });
});

module.exports = router;
