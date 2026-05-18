// routes/invoice.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

router.get('/:rentalId', (req, res) => {
  const rentalId = parseInt(req.params.rentalId);
  if (!rentalId) return res.status(400).json({ error: 'Invalid rental ID' });

  const rental = db.prepare(`
    SELECT r.*,
      v.make, v.model, v.year, v.plate, v.type, v.daily_rate,
      c.first_name, c.last_name, c.email, c.phone,
      c.license_no, c.address
    FROM rentals r
    JOIN vehicles  v ON v.id = r.vehicle_id
    JOIN customers c ON c.id = r.customer_id
    WHERE r.id = ?
  `).get(rentalId);

  if (!rental) return res.status(404).json({ error: 'Rental not found' });

  const payments = db.prepare(
    'SELECT * FROM payments WHERE rental_id = ? ORDER BY paid_at ASC'
  ).all(rentalId);

  const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
  const days = Math.max(1, Math.ceil(
    (new Date(rental.end_date) - new Date(rental.start_date)) / 86400000
  ));

  res.json({
    rental: {
      id: rental.id, start_date: rental.start_date,
      end_date: rental.end_date, total_amount: rental.total_amount,
      status: rental.status, notes: rental.notes || '', days,
    },
    vehicle: {
      make: rental.make, model: rental.model, year: rental.year,
      plate: rental.plate, type: rental.type, daily_rate: rental.daily_rate,
    },
    customer: {
      first_name: rental.first_name, last_name: rental.last_name,
      email: rental.email || '', phone: rental.phone || '',
      license_no: rental.license_no || '', address: rental.address || '',
    },
    payments,
    summary: {
      total_amount: rental.total_amount,
      amount_paid:  amountPaid,
      balance_due:  Math.max(0, rental.total_amount - amountPaid),
      is_paid:      amountPaid >= rental.total_amount,
    },
    company: {
      name:    process.env.COMPANY_NAME    || 'AutoRent',
      address: process.env.COMPANY_ADDRESS || 'Calapan City, Oriental Mindoro',
      phone:   process.env.COMPANY_PHONE   || '+63 917 000 0000',
      email:   process.env.COMPANY_EMAIL   || 'autorent@email.com',
      tin:     process.env.COMPANY_TIN     || '',
    },
  });
});

module.exports = router;
