# 🚗 AutoRent — Car Rental Management System

Full-stack car rental management — web app + Android app, sharing one backend.

```
autorent/
├── backend/      ← Node.js + Express + SQLite API (shared by web & mobile)
├── frontend/     ← Web app (HTML + CSS + Vanilla JS)
└── mobile/       ← Android app (React Native + TypeScript)
```

---

## Quick Start

### 1. Start the backend (required for both apps)
```bash
cd backend
npm install
npm run dev
```
Server runs at **http://localhost:3000** — database auto-creates and seeds on first run.

### 2. Web app
Open **http://localhost:3000** in your browser. Done.

### 3. Android app
```bash
cd mobile
# Follow mobile/README.md for full Android setup steps
npx react-native run-android
```

---

## Architecture

```
Browser / Android App
        │  HTTP + JSON
        ▼
  Express Server  (backend/server.js → port 3000)
        │  better-sqlite3
        ▼
  autorent.db  (SQLite — auto-created on first run)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Summary stats |
| GET/POST/PATCH/DELETE | /api/vehicles | Fleet management |
| GET/POST/PATCH | /api/customers | Customer records |
| GET/POST | /api/rentals | Rentals + complete/cancel |
| GET/POST | /api/payments | Payment records |
| GET/PATCH | /api/tracking | Live GPS locations |

---

## Features

### Web App
- Dashboard with revenue, fleet, and live tracking stats
- Fleet management — grid view, filters, add/edit/delete
- Live tracking with Leaflet map (OpenStreetMap tiles)
- Rentals with auto-calculated totals
- Customer records with spend analytics
- Payments — Cash, GCash, Maya, Bank Transfer

### Android App (React Native)
- Native mobile UI sharing the same backend API
- Google Maps with colored vehicle pins + info popups
- Bottom tab navigation across all 6 modules
- Pull-to-refresh on every screen
- Native slide-up modals for all forms
- 15-second auto-refreshing live tracking
- Runs on Android emulator and real devices

---

_Renamed from DriveFleet → AutoRent. All files updated._
