// database.js — SQLite setup, schema creation, and seed data
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './autorent.db';
const db = new Database(path.resolve(DB_PATH));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ──────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    make        TEXT NOT NULL,
    model       TEXT NOT NULL,
    year        INTEGER NOT NULL,
    plate       TEXT NOT NULL UNIQUE,
    type        TEXT NOT NULL DEFAULT 'Sedan',
    color       TEXT,
    daily_rate  REAL NOT NULL,
    status      TEXT NOT NULL DEFAULT 'available'
                  CHECK(status IN ('available','rented','maintenance')),
    notes       TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    license_no  TEXT,
    address     TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rentals (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id),
    customer_id  INTEGER NOT NULL REFERENCES customers(id),
    start_date   TEXT NOT NULL,
    end_date     TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active'
                   CHECK(status IN ('active','completed','cancelled')),
    notes        TEXT,
    created_at   TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    rental_id   INTEGER NOT NULL REFERENCES rentals(id),
    amount      REAL NOT NULL,
    method      TEXT NOT NULL DEFAULT 'Cash'
                  CHECK(method IN ('Cash','GCash','Maya','Bank Transfer','Credit Card')),
    paid_at     TEXT DEFAULT (datetime('now')),
    notes       TEXT
  );

  CREATE TABLE IF NOT EXISTS vehicle_locations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INTEGER NOT NULL UNIQUE REFERENCES vehicles(id),
    lat         REAL NOT NULL,
    lng         REAL NOT NULL,
    speed_kph   REAL DEFAULT 0,
    heading     REAL DEFAULT 0,
    address     TEXT DEFAULT '',
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'admin'
                    CHECK(role IN ('admin','staff')),
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);

// ─── SEED DATA ────────────────────────────────────────────────────────────────

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as n FROM vehicles').get().n;
  if (count > 0) return;

  console.log('🌱 Seeding database with sample data...');

  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (make, model, year, plate, type, color, daily_rate, status)
    VALUES (@make, @model, @year, @plate, @type, @color, @daily_rate, @status)
  `);

  const vehicles = [
    { make:'Toyota',     model:'Vios',     year:2022, plate:'BAA 1234', type:'Sedan',     color:'Pearl White',    daily_rate:1500, status:'rented'      },
    { make:'Honda',      model:'City',     year:2021, plate:'BAB 5678', type:'Sedan',     color:'Sonic Gray',     daily_rate:1600, status:'available'   },
    { make:'Toyota',     model:'Innova',   year:2023, plate:'BAC 9012', type:'Van / MPV', color:'Silver',         daily_rate:2800, status:'available'   },
    { make:'Mitsubishi', model:'Xpander',  year:2023, plate:'BAD 3456', type:'Van / MPV', color:'Quartz White',   daily_rate:2500, status:'available'   },
    { make:'Mitsubishi', model:'Mirage',   year:2022, plate:'BAE 7890', type:'Hatchback', color:'Plasma Blue',    daily_rate:1300, status:'rented'      },
    { make:'Toyota',     model:'Fortuner', year:2022, plate:'BAF 1111', type:'SUV',       color:'Black',          daily_rate:3500, status:'maintenance' },
    { make:'Suzuki',     model:'Swift',    year:2023, plate:'BAG 2222', type:'Hatchback', color:'Fire Red',       daily_rate:1300, status:'available'   },
    { make:'Ford',       model:'EcoSport', year:2021, plate:'BAH 3333', type:'SUV',       color:'White',          daily_rate:2200, status:'available'   },
    { make:'Kia',        model:'Soluto',   year:2022, plate:'BAI 4444', type:'Sedan',     color:'Aurora Blue',    daily_rate:1400, status:'available'   },
    { make:'Hyundai',    model:'Reina',    year:2021, plate:'BAJ 5555', type:'Sedan',     color:'Typhoon Silver', daily_rate:1350, status:'available'   },
  ];
  vehicles.forEach(v => insertVehicle.run(v));

  const insertCustomer = db.prepare(`
    INSERT INTO customers (first_name, last_name, email, phone, license_no)
    VALUES (@first_name, @last_name, @email, @phone, @license_no)
  `);

  const custs = [
    { first_name:'Juan',   last_name:'dela Cruz',   email:'juan@gmail.com',  phone:'+63 917 111 2222', license_no:'N01-22-000001' },
    { first_name:'Maria',  last_name:'Santos',      email:'maria@gmail.com', phone:'+63 918 333 4444', license_no:'N01-22-000002' },
    { first_name:'Pedro',  last_name:'Reyes',       email:'pedro@gmail.com', phone:'+63 919 555 6666', license_no:'N01-22-000003' },
    { first_name:'Ana',    last_name:'Gomez',       email:'ana@gmail.com',   phone:'+63 920 777 8888', license_no:'N01-22-000004' },
    { first_name:'Ramon',  last_name:'Cruz',        email:'ramon@gmail.com', phone:'+63 921 999 0000', license_no:'N01-22-000005' },
    { first_name:'Rosa',   last_name:'Villanueva',  email:'rosa@gmail.com',  phone:'+63 922 123 4567', license_no:'N01-22-000006' },
  ];
  custs.forEach(c => insertCustomer.run(c));

  // Sample rentals
  const insertRental = db.prepare(`
    INSERT INTO rentals (vehicle_id, customer_id, start_date, end_date, total_amount, status)
    VALUES (@vehicle_id, @customer_id, @start_date, @end_date, @total_amount, @status)
  `);
  const rentalRows = [
    { vehicle_id:1, customer_id:1, start_date:'2026-05-01', end_date:'2026-05-04', total_amount:4500, status:'active'    },
    { vehicle_id:5, customer_id:3, start_date:'2026-05-02', end_date:'2026-05-06', total_amount:5200, status:'active'    },
    { vehicle_id:2, customer_id:2, start_date:'2026-04-28', end_date:'2026-04-30', total_amount:3000, status:'completed' },
    { vehicle_id:3, customer_id:4, start_date:'2026-04-25', end_date:'2026-04-27', total_amount:7800, status:'completed' },
    { vehicle_id:6, customer_id:5, start_date:'2026-04-18', end_date:'2026-04-20', total_amount:6300, status:'completed' },
    { vehicle_id:7, customer_id:6, start_date:'2026-04-14', end_date:'2026-04-15', total_amount:2800, status:'completed' },
  ];
  rentalRows.forEach(r => insertRental.run(r));

  // Sample payments
  const insertPayment = db.prepare(`
    INSERT INTO payments (rental_id, amount, method, paid_at)
    VALUES (@rental_id, @amount, @method, @paid_at)
  `);
  [
    { rental_id:1, amount:4500, method:'Cash',          paid_at:'2026-05-01T09:00:00' },
    { rental_id:2, amount:5200, method:'GCash',         paid_at:'2026-05-02T09:14:00' },
    { rental_id:3, amount:3000, method:'Bank Transfer', paid_at:'2026-04-28T08:42:00' },
    { rental_id:4, amount:7800, method:'GCash',         paid_at:'2026-04-25T10:00:00' },
    { rental_id:5, amount:6300, method:'Cash',          paid_at:'2026-04-18T11:00:00' },
  ].forEach(p => insertPayment.run(p));

  // Seed vehicle locations — spread around Lipa City, Batangas
  const insertLoc = db.prepare(`
    INSERT OR IGNORE INTO vehicle_locations (vehicle_id, lat, lng, speed_kph, address)
    VALUES (@vehicle_id, @lat, @lng, @speed_kph, @address)
  `);
  [
    { vehicle_id:1,  lat:13.9411, lng:121.1631, speed_kph:42, address:'Ayala Malls, Lipa' },
    { vehicle_id:2,  lat:13.9373, lng:121.1680, speed_kph:0,  address:'SM City Lipa' },
    { vehicle_id:3,  lat:13.9450, lng:121.1600, speed_kph:0,  address:'Lipa City Hall' },
    { vehicle_id:4,  lat:13.9395, lng:121.1710, speed_kph:0,  address:'Robinsons Lipa' },
    { vehicle_id:5,  lat:13.9330, lng:121.1650, speed_kph:58, address:'Maharlika Highway' },
    { vehicle_id:6,  lat:13.9360, lng:121.1590, speed_kph:0,  address:'Auto Service Center' },
    { vehicle_id:7,  lat:13.9420, lng:121.1550, speed_kph:0,  address:'Lipa Public Market' },
    { vehicle_id:8,  lat:13.9480, lng:121.1700, speed_kph:0,  address:'Lipa Medical Center' },
    { vehicle_id:9,  lat:13.9340, lng:121.1620, speed_kph:31, address:'C.M. Recto Avenue' },
    { vehicle_id:10, lat:13.9400, lng:121.1660, speed_kph:0,  address:'Lipa City Rotunda' },
  ].forEach(l => insertLoc.run(l));

  console.log('✅ Seed complete — 10 vehicles, 6 customers, 6 rentals, 10 locations');

  const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')"
    ).run('admin', hash);
    console.log('👤 Default user created — username: admin  password: admin123');
    console.log('   ⚠️  Change this password after first login!');
  }
}

seedIfEmpty();

module.exports = db;
