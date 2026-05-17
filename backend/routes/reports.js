// routes/reports.js
const express = require('express');
const router  = express.Router();
const db      = require('../database');

// GET /api/reports?month=YYYY-MM
router.get('/', (req, res) => {
  const month = req.query.month ||
    db.prepare("SELECT strftime('%Y-%m', 'now') AS m").get().m;

  const [year, mon] = month.split('-');
  const month_start = `${year}-${mon}-01`;
  // Last day of month: first day of next month minus 1 day
  const month_end = db.prepare(
    "SELECT date(:ms, '+1 month', '-1 day') AS d"
  ).get({ ms: month_start }).d;

  // Query 1 — last 6 months revenue (ignores month filter)
  const monthly_revenue = db.prepare(`
    SELECT
      strftime('%Y-%m', paid_at) AS month,
      SUM(amount)                AS revenue
    FROM payments
    WHERE paid_at >= date('now', '-5 months', 'start of month')
    GROUP BY strftime('%Y-%m', paid_at)
    ORDER BY month ASC
  `).all();

  // Query 2 — fleet utilization for selected month
  const fleet_utilization = db.prepare(`
    SELECT
      v.id,
      v.make || ' ' || v.model AS vehicle_name,
      v.plate,
      COUNT(r.id) AS rental_count,
      COALESCE(SUM(
        max(
          julianday(
            CASE
              WHEN r.end_date   > @month_end   THEN @month_end
              ELSE r.end_date
            END
          ) -
          julianday(
            CASE
              WHEN r.start_date < @month_start THEN @month_start
              ELSE r.start_date
            END
          ),
          0
        )
      ), 0) AS days_rented
    FROM vehicles v
    LEFT JOIN rentals r
      ON r.vehicle_id = v.id
      AND r.status IN ('active', 'completed')
      AND r.start_date <= @month_end
      AND r.end_date   >= @month_start
    GROUP BY v.id
    ORDER BY days_rented DESC
  `).all({ month_start, month_end });

  // Query 3 — top customers for selected month
  const top_customers = db.prepare(`
    SELECT
      c.first_name || ' ' || c.last_name AS customer_name,
      COUNT(r.id)       AS rental_count,
      SUM(p_total.paid) AS total_spent
    FROM customers c
    JOIN rentals r ON r.customer_id = c.id
    JOIN (
      SELECT rental_id, SUM(amount) AS paid
      FROM payments
      WHERE strftime('%Y-%m', paid_at) = ?
      GROUP BY rental_id
    ) p_total ON p_total.rental_id = r.id
    WHERE strftime('%Y-%m', r.start_date) = ?
    GROUP BY c.id
    ORDER BY total_spent DESC
    LIMIT 5
  `).all(month, month);

  // Query 4 — revenue vs target for selected month
  const monthlyTarget  = parseFloat(process.env.MONTHLY_TARGET) || 50000;
  const currentRevenue = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM payments
    WHERE strftime('%Y-%m', paid_at) = ?
  `).get(month).total;
  const paymentMethods = db.prepare(`
    SELECT method, COUNT(*) AS count, SUM(amount) AS total
    FROM payments
    WHERE strftime('%Y-%m', paid_at) = ?
    GROUP BY method ORDER BY total DESC
  `).all(month);
  const revenue_target = {
    target:  monthlyTarget,
    current: currentRevenue,
    percent: Math.min(100, Math.round((currentRevenue / monthlyTarget) * 100)),
    methods: paymentMethods,
  };

  res.json({
    month,
    monthly_revenue,
    fleet_utilization,
    top_customers,
    revenue_target,
  });
});

module.exports = router;
