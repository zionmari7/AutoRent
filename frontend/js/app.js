// app.js — AutoRent frontend  (Week 1: all gaps closed)
const API    = '/api';

// ─── AUTH GUARD ───────────────────────────────────────────────────────────────
(function checkAuth() {
  const token = sessionStorage.getItem('autorent_token');
  if (!token) { window.location.href = '/login.html'; return; }
  const user = JSON.parse(sessionStorage.getItem('autorent_user') || '{}');
  // Populate sidebar user pill with real name
  const nameEl = document.getElementById('sidebar-username');
  const roleEl = document.getElementById('sidebar-userrole');
  if (nameEl) nameEl.textContent = user.username || 'Admin';
  if (roleEl) roleEl.textContent = user.role     || 'staff';
})();

const COLORS = ['#f43f5e','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#f97316','#10b981','#ec4899','#64748b'];
const EMOJIS = { Sedan:'🚗', SUV:'🚙', Hatchback:'🚗', 'Van / MPV':'🚐', Pickup:'🛻' };

const QUICK_LOCS = [
  { label:'SM City Calapan',          lat:13.4102, lng:121.1802 },
  { label:'Calapan City Hall',        lat:13.4138, lng:121.1806 },
  { label:'J.P. Rizal Avenue',        lat:13.4115, lng:121.1792 },
  { label:'Calapan Public Market',    lat:13.4130, lng:121.1775 },
  { label:'Oriental Mindoro Capitol', lat:13.4088, lng:121.1815 },
  { label:'Calapan Port (RORO)',       lat:13.4072, lng:121.1838 },
  { label:'Robinsons Calapan',        lat:13.4095, lng:121.1765 },
  { label:'Sacred Heart College',     lat:13.4150, lng:121.1788 },
  { label:'Calapan Rotonda',          lat:13.4120, lng:121.1810 },
  { label:'Service Center',           lat:13.4145, lng:121.1760 },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const token = sessionStorage.getItem('autorent_token');
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    // Token expired or invalid — send back to login
    sessionStorage.removeItem('autorent_token');
    sessionStorage.removeItem('autorent_user');
    window.location.href = '/login.html';
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

const fmt      = n  => '₱' + Number(n).toLocaleString();
const fmtDate  = d  => new Date(d).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });
const fmtTime  = d  => d ? new Date(d).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' }) : '—';
const el       = id => document.getElementById(id);
const esc      = s  => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function badge(status) {
  const labels = {
    available:'Available', rented:'Rented', maintenance:'Maintenance',
    active:'Active', completed:'Completed', cancelled:'Cancelled', overdue:'Overdue',
  };
  return `<span class="bp ${status}"><span class="dot"></span>${labels[status] || status}</span>`;
}

function toast(msg, type = 'success') {
  const t = el('toast');
  t.textContent = msg;
  t.style.background = type === 'error' ? '#ef4444' : 'var(--brand)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

const PAGE_TITLES = {
  dashboard: ['Dashboard',     'Overview'],
  fleet:     ['Fleet',         'All Vehicles'],
  tracking:  ['Live Tracking', 'GPS Fleet Map'],
  rentals:   ['Rentals',       'Rental History'],
  customers: ['Customers',     'All Customers'],
  payments:  ['Payments',      'Payment Records'],
  reports:   ['Reports',       'Analytics'],
};

function goTo(page) {
  if (page !== 'tracking') stopTrackingRefresh();
  // Clear search on page change
  const si = el('search-input');
  if (si) { si.value = ''; }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el('page-' + page)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
  const [title, sub] = PAGE_TITLES[page] || [page, ''];
  el('ptitle').innerHTML = `${title} <span>${sub}</span>`;
  const placeholders = {
    fleet:     'Search make, model, plate...',
    rentals:   'Search customer, vehicle, ID...',
    customers: 'Search name, email, phone...',
  };
  if (si) si.placeholder = placeholders[page] || 'Search...';
  loadPage(page);
}

async function loadPage(page) {
  try {
    if (page === 'dashboard') await loadDashboard();
    if (page === 'fleet')     await loadFleet();
    if (page === 'tracking')  await loadTracking();
    if (page === 'rentals')   await loadRentals();
    if (page === 'customers') await loadCustomers();
    if (page === 'payments')  await loadPayments();
    if (page === 'reports')   await loadReports();
  } catch (e) {
    toast('Error loading: ' + e.message, 'error');
  }
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

async function loadDashboard() {
  const [d, trackData] = await Promise.all([apiFetch('/dashboard'), apiFetch('/tracking')]);

  el('d-revenue').textContent    = fmt(d.monthly_revenue);
  el('d-available').textContent  = d.fleet.available;
  el('d-rented').textContent     = d.fleet.rented;
  el('d-active').textContent     = d.rentals.active;

  // Overdue alert strip
  const overdue = d.rentals.overdue || 0;
  const strip   = el('d-overdue-strip');
  if (overdue > 0) {
    el('d-overdue-msg').textContent = `${overdue} rental${overdue > 1 ? 's are' : ' is'} overdue — vehicles not yet returned.`;
    strip.style.display = 'flex';
  } else {
    strip.style.display = 'none';
  }

  // Overdue badge on sidebar Rentals nav
  const ob = el('nav-overdue-count');
  if (ob) {
    ob.textContent  = overdue || '';
    ob.style.display = overdue ? 'inline-flex' : 'none';
  }

  // On road now (tracking)
  const movingCount = trackData.filter(v => v.speed_kph > 0).length;
  const nb = el('nav-live-count');
  if (nb) { nb.textContent = movingCount || ''; nb.style.display = movingCount ? 'inline-flex' : 'none'; }

  el('d-recent-rentals').innerHTML = d.recent_rentals.length
    ? d.recent_rentals.map(r => `
        <tr>
          <td><strong>${esc(r.customer_name)}</strong></td>
          <td>${esc(r.vehicle_name)}</td>
          <td style="color:var(--text2)">${fmtDate(r.start_date)} – ${fmtDate(r.end_date)}</td>
          <td><strong>${fmt(r.total_amount)}</strong></td>
          <td>${badge(r.status)}</td>
        </tr>`).join('')
    : '<tr><td colspan="5" class="td-empty">No rentals yet</td></tr>';

  el('d-fleet-status').innerHTML = `
    <div class="sh"><div class="st">Fleet Breakdown</div></div>
    ${fleetBar('Available',   d.fleet.available,   d.fleet.total, 'var(--green)')}
    ${fleetBar('Rented',      d.fleet.rented,      d.fleet.total, 'var(--blue)')}
    ${fleetBar('Maintenance', d.fleet.maintenance, d.fleet.total, 'var(--yellow)')}
  `;
  // Refresh notification badge count silently
  loadNotifications().catch(() => {});
}

function fleetBar(label, count, total, color) {
  const pct = total ? Math.round(count / total * 100) : 0;
  return `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="color:var(--text2)">${label}</span>
        <span style="font-weight:500">${count} / ${total}</span>
      </div>
      <div style="background:var(--surface3);border-radius:20px;height:7px">
        <div style="width:${pct}%;background:${color};height:7px;border-radius:20px;transition:width 0.4s"></div>
      </div>
    </div>`;
}

// ─── FLEET ────────────────────────────────────────────────────────────────────

let fleetFilter  = '';
let fleetAllData = [];   // cache full list for client-side search

async function loadFleet(status = fleetFilter) {
  fleetFilter = status;
  const data = await apiFetch('/vehicles' + (status ? `?status=${status}` : ''));
  fleetAllData = data;
  renderFleetGrid(data);
}

function renderFleetGrid(data) {
  const grid = el('fgrid');
  if (!data.length) { grid.innerHTML = '<div class="loading">No vehicles found.</div>'; return; }
  grid.innerHTML = data.map(v => `
    <div class="fc">
      <div class="fc-top">
        <div>
          <div class="fc-name">${v.year} ${esc(v.make)} ${esc(v.model)}</div>
          <div style="margin-top:3px"><span class="fc-plate">${esc(v.plate)}</span></div>
        </div>
        ${badge(v.status)}
      </div>
      <div class="fc-emoji">${EMOJIS[v.type] || '🚗'}</div>
      <div class="fc-meta">
        <div class="fc-row"><span class="fc-key">Type</span><span class="fc-val">${esc(v.type)}</span></div>
        <div class="fc-row"><span class="fc-key">Color</span><span class="fc-val">${esc(v.color) || '—'}</span></div>
        <div class="fc-row"><span class="fc-key">Daily Rate</span>
          <span class="fc-val" style="color:var(--accent)">${fmt(v.daily_rate)}</span></div>
      </div>
      <div class="fc-actions">
        <button class="btn btn-o btn-sm" onclick="editVehicle(${v.id})">Edit</button>
        <button class="btn btn-sm" style="background:var(--surface3);color:var(--text2)"
          onclick="setVehicleStatus(${v.id},'${v.status}')">Status</button>
        <button class="btn btn-danger btn-sm mla" onclick="deleteVehicle(${v.id})">Delete</button>
      </div>
    </div>`).join('');
}

async function editVehicle(id) {
  try {
    const v = await apiFetch(`/vehicles/${id}`);
    el('m-vehicle-title').textContent = 'Edit Vehicle';
    el('v-id').value     = v.id;
    el('v-make').value   = v.make;
    el('v-model').value  = v.model;
    el('v-year').value   = v.year;
    el('v-plate').value  = v.plate;
    el('v-type').value   = v.type;
    el('v-rate').value   = v.daily_rate;
    el('v-color').value  = v.color || '';
    el('v-status').value = v.status;
    openModal('m-vehicle');
  } catch (e) { toast(e.message, 'error'); }
}

async function setVehicleStatus(id, current) {
  const next = { available:'maintenance', maintenance:'available', rented:'available' };
  if (!confirm(`Change status to "${next[current]}"?`)) return;
  try {
    await apiFetch(`/vehicles/${id}`, { method:'PATCH', body:{ status: next[current] } });
    toast('Status updated'); loadFleet();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteVehicle(id) {
  if (!confirm('Delete this vehicle? This cannot be undone.')) return;
  try {
    await apiFetch(`/vehicles/${id}`, { method:'DELETE' });
    toast('Vehicle removed'); loadFleet();
  } catch (e) { toast(e.message, 'error'); }
}

async function saveVehicle() {
  const id   = el('v-id').value;
  const body = {
    make:       el('v-make').value.trim(),
    model:      el('v-model').value.trim(),
    year:       parseInt(el('v-year').value),
    plate:      el('v-plate').value.trim(),
    type:       el('v-type').value,
    daily_rate: parseFloat(el('v-rate').value),
    color:      el('v-color').value.trim(),
    status:     el('v-status').value,
  };
  if (!body.make || !body.model || !body.plate || !body.daily_rate)
    return toast('Fill in all required fields', 'error');
  try {
    if (id) {
      await apiFetch(`/vehicles/${id}`, { method:'PATCH', body });
      toast('Vehicle updated');
      invalidateSearchCache('vehicles');
    } else {
      await apiFetch('/vehicles', { method:'POST', body });
      toast('Vehicle added!');
      invalidateSearchCache('vehicles');
    }
    closeModal('m-vehicle'); loadFleet();
  } catch (e) { toast(e.message, 'error'); }
}

// ─── LIVE TRACKING ────────────────────────────────────────────────────────────

let leafletMap        = null;
let leafletMarkers    = {};
let trackRefreshTimer = null;
let selectedVehicleId = null;

function trackColor(v) {
  if (v.status === 'maintenance') return '#f59e0b';
  if (v.speed_kph > 0)           return '#22c55e';
  if (v.status === 'rented')     return '#3b82f6';
  return '#94a3b8';
}

function pinIcon(v) {
  const color = trackColor(v);
  const emoji = EMOJIS[v.type] || '🚗';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <circle cx="20" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2.5"/>
      <text x="20" y="24" font-size="14" text-anchor="middle">${emoji}</text>
      <polygon points="12,30 28,30 20,46" fill="${color}"/>
    </svg>`;
  return L.divIcon({ html:svg, className:'', iconSize:[40,50], iconAnchor:[20,46], popupAnchor:[0,-46] });
}

function buildPopup(v) {
  const renter = v.renter_name
    ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #eee;font-size:11.5px;color:#64748b">
         👤 ${esc(v.renter_name)} · ${esc(v.renter_phone) || '—'}
       </div>` : '';
  return `
    <div style="font-family:'DM Sans',sans-serif;min-width:180px">
      <div style="font-weight:700;font-size:14px;margin-bottom:2px">${v.year} ${esc(v.make)} ${esc(v.model)}</div>
      <div style="font-size:11px;background:#f1f5f9;padding:2px 7px;border-radius:4px;
                  display:inline-block;font-family:'Space Grotesk',sans-serif;margin-bottom:7px">${esc(v.plate)}</div>
      <div style="font-size:12px;color:#475569;margin-bottom:3px">📍 ${esc(v.address) || 'Unknown location'}</div>
      <div style="font-size:12px;color:#475569">
        🚀 ${v.speed_kph > 0 ? v.speed_kph + ' km/h' : 'Parked'}
        &nbsp;·&nbsp; ⏱ ${fmtTime(v.updated_at)}
      </div>
      ${renter}
    </div>`;
}

async function loadTracking() {
  const data = await apiFetch('/tracking');

  const moving      = data.filter(v => v.speed_kph > 0).length;
  const parked      = data.filter(v => v.speed_kph === 0 && v.status !== 'maintenance').length;
  const maintenance = data.filter(v => v.status === 'maintenance').length;

  el('ts-total').textContent       = data.length;
  el('ts-moving').textContent      = moving;
  el('ts-parked').textContent      = parked;
  el('ts-maintenance').textContent = maintenance;

  const nb = el('nav-live-count');
  if (nb) { nb.textContent = moving || ''; nb.style.display = moving ? 'inline-flex' : 'none'; }

  el('track-last-update').textContent =
    'Updated ' + new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  if (!leafletMap) {
    leafletMap = L.map('leaflet-map', { zoomControl:true }).setView([13.4122, 121.1798], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(leafletMap);
  }

  const seenIds = new Set();
  data.forEach(v => {
    seenIds.add(v.id);
    const latlng = [v.lat, v.lng], popHtml = buildPopup(v);
    if (leafletMarkers[v.id]) {
      leafletMarkers[v.id].setLatLng(latlng);
      leafletMarkers[v.id].setIcon(pinIcon(v));
      leafletMarkers[v.id].getPopup().setContent(popHtml);
    } else {
      const marker = L.marker(latlng, { icon: pinIcon(v) }).addTo(leafletMap).bindPopup(popHtml);
      marker.on('click', () => highlightVehicle(v.id));
      leafletMarkers[v.id] = marker;
    }
  });

  Object.keys(leafletMarkers).forEach(id => {
    if (!seenIds.has(parseInt(id))) { leafletMarkers[id].remove(); delete leafletMarkers[id]; }
  });

  el('tracking-vehicle-list').innerHTML = data.map(v => `
    <div class="tl-card ${selectedVehicleId === v.id ? 'sel' : ''}" id="tlc-${v.id}" onclick="flyToVehicle(${v.id})">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-weight:600;font-size:13px">${esc(v.make)} ${esc(v.model)}</div>
          <div style="font-size:10.5px;color:var(--text2);font-family:'Space Grotesk',sans-serif">${esc(v.plate)}</div>
        </div>
        <span class="speed-pill ${v.speed_kph > 0 ? 'moving' : 'parked'}">
          ${v.speed_kph > 0 ? v.speed_kph + ' km/h' : 'Parked'}
        </span>
      </div>
      <div style="font-size:11.5px;color:var(--text2);margin-top:6px;display:flex;align-items:center;gap:4px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        ${esc(v.address) || 'Unknown location'}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:7px;font-size:11px;color:var(--text3)">
        <span>${badge(v.status)}</span>
        <span>⏱ ${fmtTime(v.updated_at)}</span>
      </div>
      ${v.renter_name ? `<div style="font-size:11px;color:var(--blue);margin-top:5px">👤 ${esc(v.renter_name)}</div>` : ''}
    </div>`).join('');

  if (!trackRefreshTimer) {
    trackRefreshTimer = setInterval(async () => {
      if (el('page-tracking')?.classList.contains('active')) {
        try { await loadTracking(); } catch (_) {}
      } else { stopTrackingRefresh(); }
    }, 15000);
  }
}

function stopTrackingRefresh() {
  if (trackRefreshTimer) { clearInterval(trackRefreshTimer); trackRefreshTimer = null; }
}

function flyToVehicle(vehicleId) {
  selectedVehicleId = vehicleId;
  const marker = leafletMarkers[vehicleId];
  if (marker) { leafletMap.flyTo(marker.getLatLng(), 16, { duration:0.8 }); marker.openPopup(); }
  document.querySelectorAll('.tl-card').forEach(c => c.classList.remove('sel'));
  el('tlc-' + vehicleId)?.classList.add('sel');
}

function highlightVehicle(vehicleId) {
  selectedVehicleId = vehicleId;
  document.querySelectorAll('.tl-card').forEach(c => c.classList.remove('sel'));
  const card = el('tlc-' + vehicleId);
  if (card) { card.classList.add('sel'); card.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
}

async function refreshTracking() {
  try { await loadTracking(); toast('Map refreshed'); }
  catch (e) { toast('Refresh failed: ' + e.message, 'error'); }
}

async function openLocationModal() {
  const vehicles = await apiFetch('/vehicles');
  el('loc-vehicle').innerHTML = '<option value="">Select vehicle...</option>' +
    vehicles.map(v => `<option value="${v.id}">${v.year} ${esc(v.make)} ${esc(v.model)} (${esc(v.plate)})</option>`).join('');
  el('quick-locs').innerHTML = QUICK_LOCS.map(loc =>
    `<button class="ql-btn" onclick="applyQuickLoc(${loc.lat},${loc.lng},'${loc.label}')">${loc.label}</button>`
  ).join('');
  ['loc-lat','loc-lng','loc-speed','loc-address'].forEach(id => { el(id).value = ''; });
  openModal('m-location');
}

function applyQuickLoc(lat, lng, label) {
  el('loc-lat').value     = (lat + (Math.random() - 0.5) * 0.003).toFixed(4);
  el('loc-lng').value     = (lng + (Math.random() - 0.5) * 0.003).toFixed(4);
  el('loc-address').value = label;
}

async function saveLocation() {
  const vehicleId = el('loc-vehicle').value;
  const lat       = parseFloat(el('loc-lat').value);
  const lng       = parseFloat(el('loc-lng').value);
  const speed     = parseFloat(el('loc-speed').value) || 0;
  const address   = el('loc-address').value.trim();
  if (!vehicleId)             return toast('Select a vehicle', 'error');
  if (isNaN(lat)||isNaN(lng)) return toast('Enter valid coordinates', 'error');
  try {
    await apiFetch(`/tracking/${vehicleId}`, { method:'PATCH', body:{ lat, lng, speed_kph:speed, address } });
    toast('Location updated!'); closeModal('m-location'); await loadTracking();
  } catch (e) { toast(e.message, 'error'); }
}

// ─── RENTALS ─────────────────────────────────────────────────────────────────

let rentalAllData = [];   // cache for client-side overdue filter

async function loadRentals(filter = '') {
  // 'overdue' is a client-side filter — backend uses status=active
  const apiStatus = filter === 'overdue' ? 'active' : filter;
  const data = await apiFetch('/rentals' + (apiStatus ? `?status=${apiStatus}` : ''));
  rentalAllData = data;

  const filtered  = filter === 'overdue' ? data.filter(r => r.is_overdue) : data;
  const activeAll = data.filter(r => r.status === 'active');
  const overdue   = activeAll.filter(r => r.is_overdue).length;
  const completed = data.filter(r => r.status === 'completed').length;
  const revenue   = data.reduce((s, r) => s + (r.amount_paid || 0), 0);

  el('r-active').textContent    = activeAll.length;
  el('r-overdue').textContent   = overdue;
  el('r-completed').textContent = completed;
  el('r-revenue').textContent   = fmt(revenue);

  // Sidebar overdue badge
  const ob = el('nav-overdue-count');
  if (ob) { ob.textContent = overdue || ''; ob.style.display = overdue ? 'inline-flex' : 'none'; }

  el('rentals-body').innerHTML = filtered.length
    ? filtered.map(r => {
        const isOverdue   = r.is_overdue;
        const daysOverdue = r.days_overdue || 0;
        const statusCell  = isOverdue
          ? `${badge('overdue')}<span class="overdue-tag">${daysOverdue}d late</span>`
          : badge(r.status);
        return `
        <tr style="${isOverdue ? 'background:#fff5f5' : ''}">
          <td><strong style="font-family:'Space Grotesk',sans-serif">#${r.id}</strong></td>
          <td>${esc(r.customer_name)}</td>
          <td>${esc(r.vehicle_name)}</td>
          <td style="color:var(--text2)">${fmtDate(r.start_date)}</td>
          <td style="color:${isOverdue ? 'var(--red)' : 'var(--text2)'}">
            ${fmtDate(r.end_date)}${isOverdue ? ' ⚠' : ''}
          </td>
          <td><strong>${fmt(r.total_amount)}</strong></td>
          <td style="color:${(r.amount_paid||0)>=r.total_amount ? 'var(--green)' : 'var(--red)'}">
            ${fmt(r.amount_paid||0)}
          </td>
          <td>${statusCell}</td>
          <td style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
            ${r.status === 'active'
              ? `<button class="btn btn-o btn-sm" onclick="completeRental(${r.id})">Complete</button>
                 <button class="btn btn-sm" style="background:#fff0f0;color:var(--red);border:1px solid #fecaca"
                   onclick="cancelRental(${r.id})">Cancel</button>`
              : ''}
            <button class="btn btn-o btn-sm" onclick="openInvoice(${r.id})">🧾 Invoice</button>
            <button class="btn btn-o btn-sm" onclick="window.open('/contract.html?id=${r.id}','_blank')">📄 Contract</button>
          </td>
        </tr>`}).join('')
    : `<tr><td colspan="9" class="td-empty">${filter === 'overdue' ? 'No overdue rentals 🎉' : 'No rentals found.'}</td></tr>`;
}

async function completeRental(id) {
  if (!confirm('Mark rental as completed? Vehicle will become available.')) return;
  try {
    await apiFetch(`/rentals/${id}/complete`, { method:'PATCH' });
    toast('Rental completed!'); invalidateSearchCache('rentals'); loadRentals();
  } catch (e) { toast(e.message, 'error'); }
}

async function cancelRental(id) {
  if (!confirm('Cancel this rental? Vehicle will become available.')) return;
  try {
    await apiFetch(`/rentals/${id}/cancel`, { method:'PATCH' });
    toast('Rental cancelled.'); invalidateSearchCache('rentals'); loadRentals();
  } catch (e) { toast(e.message, 'error'); }
}

function openInvoice(rentalId) {
  window.open(`/invoice.html?id=${rentalId}`, '_blank');
}

async function openAddRental() {
  try {
    const [customers, vehicles] = await Promise.all([
      apiFetch('/customers'),
      apiFetch('/vehicles?status=available'),
    ]);
    el('r-customer').innerHTML = '<option value="">Select customer...</option>' +
      customers.map(c => `<option value="${c.id}">${esc(c.first_name)} ${esc(c.last_name)}</option>`).join('');
    el('r-vehicle').innerHTML = '<option value="">Select vehicle...</option>' +
      vehicles.map(v =>
        `<option value="${v.id}" data-rate="${v.daily_rate}">
           ${v.year} ${esc(v.make)} ${esc(v.model)} (${esc(v.plate)}) — ${fmt(v.daily_rate)}/day
         </option>`).join('');
    const today = new Date().toISOString().split('T')[0];
    const tmr   = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    el('r-start').value = today; el('r-end').value = tmr;
    updateRentalTotal();
    openModal('m-rental');
  } catch (e) { toast(e.message, 'error'); }
}

function updateRentalTotal() {
  const sel  = el('r-vehicle');
  const rate = parseFloat(sel.options[sel.selectedIndex]?.dataset?.rate || 0);
  const start = el('r-start').value, end = el('r-end').value;
  const disp  = el('r-total-display');
  if (rate && start && end) {
    const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
    el('r-total-val').textContent = fmt(days * rate) + ` (${days} day${days > 1 ? 's' : ''})`;
    disp.style.display = 'block';
  } else { disp.style.display = 'none'; }
}

async function saveRental() {
  const body = {
    customer_id: parseInt(el('r-customer').value),
    vehicle_id:  parseInt(el('r-vehicle').value),
    start_date:  el('r-start').value,
    end_date:    el('r-end').value,
  };
  if (!body.customer_id || !body.vehicle_id || !body.start_date || !body.end_date)
    return toast('Fill in all required fields', 'error');
  try {
    const created = await apiFetch('/rentals', { method:'POST', body });
    closeModal('m-rental');
    loadRentals();
    invalidateSearchCache('rentals');
    toast('Rental created! Opening contract...');
    setTimeout(() => window.open(`/contract.html?id=${created.id}`, '_blank'), 400);
  } catch (e) { toast(e.message, 'error'); }
}

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

let customerAllData = [];

async function loadCustomers(list) {
  const data = list || await apiFetch('/customers');
  customerAllData = list ? customerAllData : data;
  el('cust-count').textContent = `${data.length} customer${data.length !== 1 ? 's' : ''}`;
  el('cgrid').innerHTML = data.length
    ? data.map((c, i) => {
        const ini   = `${c.first_name[0]}${c.last_name[0]}`;
        const spent = Number(c.total_spent) || 0;
        const rents = Number(c.total_rentals) || 0;
        return `
          <div class="cc">
            <div class="cc-top">
              <div class="cc-av" style="background:${COLORS[i % COLORS.length]}">${ini}</div>
              <div>
                <div class="cc-name">${esc(c.first_name)} ${esc(c.last_name)}</div>
                <div class="cc-info">${esc(c.email) || '—'}</div>
                <div class="cc-info">${esc(c.phone) || '—'}</div>
              </div>
            </div>
            <div class="cc-stats">
              <div class="cs"><div class="cs-v">${rents}</div><div class="cs-l">Rentals</div></div>
              <div class="cs"><div class="cs-v">${fmt(spent)}</div><div class="cs-l">Spent</div></div>
              <div class="cs"><div class="cs-v">${rents ? fmt(Math.round(spent/rents)) : '₱0'}</div><div class="cs-l">Avg</div></div>
            </div>
            <div class="cc-actions">
              <button class="btn btn-o btn-sm" onclick="editCustomer(${c.id})">Edit</button>
            </div>
          </div>`;
      }).join('')
    : '<div class="loading">No customers yet.</div>';
}

async function editCustomer(id) {
  try {
    const c = await apiFetch(`/customers/${id}`);
    el('m-customer-title').textContent = 'Edit Customer';
    el('c-id').value      = c.id;
    el('c-fn').value      = c.first_name;
    el('c-ln').value      = c.last_name;
    el('c-email').value   = c.email || '';
    el('c-phone').value   = c.phone || '';
    el('c-license').value = c.license_no || '';
    el('c-address').value = c.address || '';
    openModal('m-customer');
  } catch (e) { toast(e.message, 'error'); }
}

async function saveCustomer() {
  const id   = el('c-id').value;
  const body = {
    first_name: el('c-fn').value.trim(),
    last_name:  el('c-ln').value.trim(),
    email:      el('c-email').value.trim(),
    phone:      el('c-phone').value.trim(),
    license_no: el('c-license').value.trim(),
    address:    el('c-address').value.trim(),
  };
  if (!body.first_name || !body.last_name) return toast('Name is required', 'error');
  try {
    if (id) {
      await apiFetch(`/customers/${id}`, { method:'PATCH', body });
      toast('Customer updated!');
      invalidateSearchCache('customers');
    } else {
      await apiFetch('/customers', { method:'POST', body });
      toast(`${body.first_name} added!`);
      invalidateSearchCache('customers');
    }
    closeModal('m-customer');
    ['c-id','c-fn','c-ln','c-email','c-phone','c-license','c-address'].forEach(i => { el(i).value = ''; });
    el('m-customer-title').textContent = 'Add Customer';
    loadCustomers();
  } catch (e) { toast(e.message, 'error'); }
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

async function loadPayments() {
  // fetch payments + active rentals to compute balance
  const [payments, rentals] = await Promise.all([
    apiFetch('/payments'),
    apiFetch('/rentals'),
  ]);

  // Build a map: rental_id → { total_amount, total_paid }
  const rentalMap = {};
  rentals.forEach(r => {
    rentalMap[r.id] = { total: r.total_amount, paid: r.amount_paid || 0 };
  });

  el('payments-body').innerHTML = payments.length
    ? payments.map(p => {
        const rental  = rentalMap[p.rental_id] || {};
        const balance = (rental.total || 0) - (rental.paid || 0);
        const balCell = balance > 0
          ? `<span class="balance-due">-${fmt(balance)}</span>`
          : `<span class="balance-ok">Paid in full</span>`;
        return `
        <tr>
          <td style="color:var(--text2)">${fmtDate(p.paid_at)}</td>
          <td><strong>${esc(p.customer_name)}</strong></td>
          <td>${esc(p.vehicle_name)}</td>
          <td><span style="font-family:'Space Grotesk',sans-serif;font-size:12px;color:var(--text2)">#${p.rental_id}</span></td>
          <td><span style="background:var(--surface3);padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500">${esc(p.method)}</span></td>
          <td><strong>${fmt(p.amount)}</strong></td>
          <td>${balCell}</td>
        </tr>`}).join('')
    : '<tr><td colspan="7" class="td-empty">No payments recorded.</td></tr>';
}

async function openAddPayment() {
  const rentals = await apiFetch('/rentals?status=active');
  el('p-rental').innerHTML = '<option value="">Select rental...</option>' +
    rentals.map(r =>
      `<option value="${r.id}">#${r.id} — ${esc(r.customer_name)} · ${esc(r.vehicle_name)} (${fmt(r.total_amount)})</option>`
    ).join('');
  openModal('m-payment');
}

async function savePayment() {
  const body = {
    rental_id: parseInt(el('p-rental').value),
    amount:    parseFloat(el('p-amount').value),
    method:    el('p-method').value,
    notes:     el('p-notes').value.trim(),
  };
  if (!body.rental_id || !body.amount) return toast('Rental and amount required', 'error');
  try {
    await apiFetch('/payments', { method:'POST', body });
    toast('Payment recorded!'); closeModal('m-payment'); loadPayments();
  } catch (e) { toast(e.message, 'error'); }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

async function loadNotifications() {
  const data  = await apiFetch('/notifications');
  const list  = el('notif-list');
  const badge = el('bell-badge');
  if (badge) {
    badge.textContent   = data.urgentCount || '';
    badge.style.display = data.urgentCount > 0 ? 'flex' : 'none';
  }
  if (!list) return;
  if (!data.alerts.length) {
    list.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon">✅</div>
        <div style="font-weight:600;color:var(--text);margin-bottom:4px">All clear!</div>
        <div style="font-size:13px">No pending actions needed.</div>
      </div>`;
    return;
  }
  const groups      = { critical: [], warning: [], info: [] };
  data.alerts.forEach(a => groups[a.level]?.push(a));
  const groupLabels = { critical: '🔴 Needs Immediate Action', warning: '🟠 Upcoming', info: '🔵 For Your Info' };
  let html = '';
  for (const level of ['critical', 'warning', 'info']) {
    if (!groups[level].length) continue;
    html += `<div class="notif-section">${groupLabels[level]}</div>`;
    html += groups[level].map(a => `
      <div class="notif-item ${level}" onclick="handleNotifClick('${a.action}','${a.target_type || ''}',${a.target_id || 0});closeNotifPanel()">
        <div class="notif-icon">${a.icon}</div>
        <div class="notif-content">
          <div class="notif-item-title">${a.title}</div>
          <div class="notif-item-msg">${a.message}</div>
        </div>
      </div>`).join('');
  }
  list.innerHTML = html;
}

function openNotifPanel() {
  el('notif-panel')?.classList.add('open');
  el('notif-overlay')?.classList.add('open');
  loadNotifications();
}

function closeNotifPanel() {
  el('notif-panel')?.classList.remove('open');
  el('notif-overlay')?.classList.remove('open');
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────

let revenueChart = null;
let fleetChart   = null;

function getSelectedMonth() {
  const m = el('rpt-month')?.value || String(new Date().getMonth() + 1).padStart(2, '0');
  const y = el('rpt-year')?.value  || String(new Date().getFullYear());
  return `${y}-${m}`;
}

async function loadReports() {
  const yearSel = el('rpt-year');
  if (yearSel && yearSel.options.length === 0) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 3; y--) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      yearSel.appendChild(opt);
    }
    const monthSel = el('rpt-month');
    if (monthSel) monthSel.value = String(new Date().getMonth() + 1).padStart(2, '0');
  }

  const month = getSelectedMonth();
  const data  = await apiFetch(`/reports?month=${month}`);

  drawRevenueChart(data.monthly_revenue);
  drawSummaryStats(data.revenue_target, month);
  drawFleetChart(data.fleet_utilization, month);
  drawTopCustomers(data.top_customers, month);
}

function drawRevenueChart(rows) {
  const labels = rows.map(r => r.month);
  const values = rows.map(r => r.revenue);
  const ctx    = el('chart-revenue');
  if (!ctx) return;
  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Revenue (₱)',
        data: values,
        backgroundColor: '#f43f5e',
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => '₱' + Number(ctx.raw).toLocaleString(),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => '₱' + Number(v).toLocaleString() },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

function drawSummaryStats(revenueTarget, month) {
  const container = el('chart-methods')?.closest('.rpt-card');
  if (!container) return;

  const r = revenueTarget;
  const pct = r ? r.percent : 0;
  const bar_color = pct >= 100 ? 'var(--green)' : pct >= 60 ? 'var(--blue)' : 'var(--yellow)';

  container.innerHTML = `
    <div class="sh">
      <div class="st">Monthly Summary</div>
      <div style="font-size:12px;color:var(--text2)">${month}</div>
    </div>
    ${r ? `
    <div style="margin-bottom:18px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
        <span style="color:var(--text2)">Revenue vs ₱${Number(r.target).toLocaleString()} target</span>
        <span style="font-weight:600;color:${bar_color}">${pct}%</span>
      </div>
      <div style="background:var(--surface3);border-radius:99px;height:8px;overflow:hidden">
        <div style="width:${pct}%;background:${bar_color};height:8px;border-radius:99px;transition:width 0.5s ease"></div>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:5px">
        ${fmt(r.current)} collected
        ${pct >= 100 ? ' · <span style="color:var(--green);font-weight:600">🎉 Target reached!</span>' : ''}
      </div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:14px">
      <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px">By Payment Method</div>
      ${r.methods && r.methods.length
        ? r.methods.map(m => `
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:13px">
            <span style="color:var(--text2)">${esc(m.method)}</span>
            <span><strong>${fmt(m.total)}</strong>
            <span style="color:var(--text3);font-size:11px;margin-left:4px">${m.count}×</span></span>
          </div>`).join('')
        : '<div style="color:var(--text3);font-size:13px;padding:8px 0">No payments this month</div>'
      }
    </div>` : '<div style="color:var(--text3);font-size:13px;padding:20px 0;text-align:center">No data for this month</div>'}`;
}

function drawFleetChart(rows, month) {
  el('rpt-fleet-month').textContent = month;
  const ctx = el('chart-fleet');
  if (!ctx) return;
  if (fleetChart) fleetChart.destroy();
  fleetChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels:   rows.map(r => r.plate),
      datasets: [{
        label:           'Days rented',
        data:            rows.map(r => Math.round(r.days_rented * 10) / 10),
        backgroundColor: '#3b82f6',
        borderRadius:    4,
        borderSkipped:   false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
        y: { grid: { display: false } },
      },
    },
  });
}

function drawTopCustomers(rows, month) {
  el('rpt-cust-month').textContent = month;
  const container = el('rpt-top-customers');
  if (!container) return;
  if (!rows.length) {
    container.innerHTML = '<div class="rpt-empty">No rental data for this month</div>';
    return;
  }
  container.innerHTML = rows.map((r, i) => `
    <div class="rpt-cust-row">
      <span class="rpt-cust-rank">#${i + 1}</span>
      <span class="rpt-cust-name">${esc(r.customer_name)}</span>
      <span style="font-size:11px;color:var(--text2);margin-right:10px">
        ${r.rental_count} rental${r.rental_count !== 1 ? 's' : ''}
      </span>
      <span class="rpt-cust-amt">${fmt(r.total_spent)}</span>
    </div>`).join('');
}

// ── Excel Export ──────────────────────────────────────────────────────────────

function downloadExcel(filename, rows, columns) {
  if (!window.XLSX) { toast('Excel library not loaded', 'error'); return; }

  const header = columns.map(c => c.label);
  const data   = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      return c.numeric ? (Number(val) || 0) : String(val);
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

  ws['!cols'] = columns.map((c, i) => ({
    wch: Math.max(
      c.label.length,
      ...data.map(r => String(r[i] ?? '').length)
    ) + 2
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, filename);
}

async function exportRentalsExcel() {
  try {
    toast('Preparing rentals export...');
    const data = await apiFetch('/rentals');
    downloadExcel('autorent-rentals.xlsx', data, [
      { key:'id',            label:'Rental ID',   numeric:true  },
      { key:'customer_name', label:'Customer'                   },
      { key:'vehicle_name',  label:'Vehicle'                    },
      { key:'plate',         label:'Plate'                      },
      { key:'start_date',    label:'Start Date'                 },
      { key:'end_date',      label:'End Date'                   },
      { key:'total_amount',  label:'Total (PHP)', numeric:true  },
      { key:'amount_paid',   label:'Paid (PHP)',  numeric:true  },
      { key:'status',        label:'Status'                     },
    ]);
    toast('Rentals Excel downloaded!');
  } catch (e) { toast('Export failed: ' + e.message, 'error'); }
}

async function exportPaymentsExcel() {
  try {
    toast('Preparing payments export...');
    const data = await apiFetch('/payments');
    downloadExcel('autorent-payments.xlsx', data, [
      { key:'id',            label:'Payment ID',   numeric:true  },
      { key:'rental_id',     label:'Rental ID',    numeric:true  },
      { key:'customer_name', label:'Customer'                    },
      { key:'vehicle_name',  label:'Vehicle'                     },
      { key:'amount',        label:'Amount (PHP)', numeric:true  },
      { key:'method',        label:'Method'                      },
      { key:'paid_at',       label:'Date Paid'                   },
      { key:'notes',         label:'Notes'                       },
    ]);
    toast('Payments Excel downloaded!');
  } catch (e) { toast('Export failed: ' + e.message, 'error'); }
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function openModal(id)  { el(id)?.classList.add('open'); }
function closeModal(id) { el(id)?.classList.remove('open'); }

// ─── SEARCH ───────────────────────────────────────────────────────────────────

// ─── SEARCH AUTOCOMPLETE ─────────────────────────────────────────────────────

const searchCache = { vehicles: [], customers: [], rentals: [] };

function highlight(text, query) {
  if (!query) return esc(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return esc(text);
  return esc(text.slice(0, idx)) +
    `<span class="sd-highlight">${esc(text.slice(idx, idx + query.length))}</span>` +
    esc(text.slice(idx + query.length));
}

function showDropdown(html) {
  const d = el('search-dropdown');
  d.innerHTML = html;
  d.style.display = 'block';
}

function hideDropdown() {
  const d = el('search-dropdown');
  if (d) { d.style.display = 'none'; d.innerHTML = ''; }
}

async function runSearch(query) {
  if (!query || query.length < 2) { hideDropdown(); return; }
  try {
    if (!searchCache.vehicles.length)
      searchCache.vehicles = await apiFetch('/vehicles');
    if (!searchCache.customers.length)
      searchCache.customers = await apiFetch('/customers');
    if (!searchCache.rentals.length)
      searchCache.rentals = await apiFetch('/rentals');
  } catch (e) { return; }

  const q = query.toLowerCase();
  let html = '';

  const vMatches = searchCache.vehicles.filter(v =>
    `${v.make} ${v.model} ${v.plate} ${v.color} ${v.type}`.toLowerCase().includes(q)
  ).slice(0, 4);
  if (vMatches.length) {
    html += `<div class="sd-section">Vehicles</div>`;
    html += vMatches.map(v => `
      <div class="sd-item" onclick="goTo('fleet');hideDropdown();el('search-input').value=''">
        <span class="sd-icon">${EMOJIS[v.type] || '🚗'}</span>
        <div style="flex:1">
          <div class="sd-label">${highlight(v.make + ' ' + v.model, query)}</div>
          <div class="sd-sub">${esc(v.plate)} · ${esc(v.status)}</div>
        </div>
      </div>`).join('');
  }

  const cMatches = searchCache.customers.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(q)
  ).slice(0, 4);
  if (cMatches.length) {
    html += `<div class="sd-section">Customers</div>`;
    html += cMatches.map(c => `
      <div class="sd-item" onclick="goTo('customers');hideDropdown();el('search-input').value=''">
        <span class="sd-icon">👤</span>
        <div style="flex:1">
          <div class="sd-label">${highlight(c.first_name + ' ' + c.last_name, query)}</div>
          <div class="sd-sub">${esc(c.phone || c.email || '—')}</div>
        </div>
      </div>`).join('');
  }

  const rMatches = searchCache.rentals.filter(r =>
    `${r.customer_name} ${r.vehicle_name} ${r.id}`.toLowerCase().includes(q)
  ).slice(0, 3);
  if (rMatches.length) {
    html += `<div class="sd-section">Rentals</div>`;
    html += rMatches.map(r => `
      <div class="sd-item" onclick="goTo('rentals');hideDropdown();el('search-input').value=''">
        <span class="sd-icon">📄</span>
        <div style="flex:1">
          <div class="sd-label">${highlight(r.customer_name, query)}</div>
          <div class="sd-sub">#${r.id} · ${esc(r.vehicle_name)} · ${badge(r.status)}</div>
        </div>
      </div>`).join('');
  }

  if (!html) {
    html = `<div class="sd-empty">No results for "<strong>${esc(query)}</strong>"</div>`;
  }
  showDropdown(html);
}

function invalidateSearchCache(type) {
  if (type === 'vehicles'  || !type) searchCache.vehicles  = [];
  if (type === 'customers' || !type) searchCache.customers = [];
  if (type === 'rentals'   || !type) searchCache.rentals   = [];
}

let searchTimeout;
el('search-input').addEventListener('input', e => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => runSearch(e.target.value.trim()), 200);
});

document.addEventListener('click', e => {
  if (!e.target.closest('.sbar-wrap')) hideDropdown();
});

el('search-input').addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideDropdown(); el('search-input').value = ''; }
  if (e.key === 'Enter') {
    const first = el('search-dropdown')?.querySelector('.sd-item');
    if (first) first.click();
  }
});

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────

// Nav
document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => goTo(btn.dataset.page));
});

// Stat card + link shortcuts
document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', () => goTo(el.dataset.nav));
});

// Fleet filter chips
document.querySelectorAll('[data-filter="fleet"]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter="fleet"]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadFleet(btn.dataset.val);
  });
});

// Rental filter chips (includes client-side 'overdue')
document.querySelectorAll('[data-filter="rental"]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter="rental"]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadRentals(btn.dataset.val);
  });
});

// Open buttons
el('btn-add-vehicle').addEventListener('click', () => {
  el('m-vehicle-title').textContent = 'Add Vehicle';
  el('v-id').value = '';
  ['v-make','v-model','v-year','v-plate','v-rate','v-color'].forEach(id => { el(id).value = ''; });
  el('v-type').value = 'Sedan'; el('v-status').value = 'available';
  openModal('m-vehicle');
});
el('btn-add-rental').addEventListener('click',      openAddRental);
el('btn-dash-new-rental').addEventListener('click', openAddRental);
el('btn-add-customer').addEventListener('click', () => {
  el('m-customer-title').textContent = 'Add Customer';
  el('c-id').value = '';
  ['c-fn','c-ln','c-email','c-phone','c-license','c-address'].forEach(id => { el(id).value = ''; });
  openModal('m-customer');
});
el('btn-add-payment').addEventListener('click',    openAddPayment);
el('btn-update-location').addEventListener('click', openLocationModal);
el('btn-bell').addEventListener('click', openNotifPanel);
el('btn-notif-close').addEventListener('click', closeNotifPanel);
el('notif-overlay').addEventListener('click', closeNotifPanel);
el('btn-export-rentals').addEventListener('click',  exportRentalsExcel);
el('btn-export-payments').addEventListener('click', exportPaymentsExcel);
el('rpt-month')?.addEventListener('change', loadReports);
el('rpt-year')?.addEventListener('change',  loadReports);

// Save buttons
el('btn-save-vehicle').addEventListener('click',  saveVehicle);
el('btn-save-rental').addEventListener('click',   saveRental);
el('btn-save-customer').addEventListener('click', saveCustomer);
el('btn-save-payment').addEventListener('click',  savePayment);
el('btn-save-location').addEventListener('click', saveLocation);

// Rental total live calc
el('r-vehicle').addEventListener('change', updateRentalTotal);
el('r-start').addEventListener('change',   updateRentalTotal);
el('r-end').addEventListener('change',     updateRentalTotal);

// Modal close (backdrop + × buttons)
document.querySelectorAll('[data-close]').forEach(e => {
  e.addEventListener('click', () => closeModal(e.dataset.close));
});
document.querySelectorAll('.moverlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.moverlay.open').forEach(m => m.classList.remove('open'));
    closeNotifPanel();
  }
  // "/" key focuses search bar (unless user is already in an input)
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT'
    && document.activeElement.tagName !== 'TEXTAREA'
    && document.activeElement.tagName !== 'SELECT') {
    e.preventDefault();
    el('search-input')?.focus();
  }
});

function logout() {
  sessionStorage.removeItem('autorent_token');
  sessionStorage.removeItem('autorent_user');
  window.location.href = '/login.html';
}

// ─── LIVE CLOCK ───────────────────────────────────────────────────────────────
function startClock() {
  function tick() {
    const now  = new Date();
    const opts = { timeZone: 'Asia/Manila' };
    const time = now.toLocaleTimeString('en-PH', { ...opts, hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const date = now.toLocaleDateString('en-PH', { ...opts, weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const te = el('clock-time'), de = el('clock-date');
    if (te) te.textContent = time;
    if (de) de.textContent = date;
  }
  tick();
  setInterval(tick, 1000);
}

// ─── NOTIFICATION CLICK HANDLER ──────────────────────────────────────────────
function handleNotifClick(page, targetType, targetId) {
  goTo(page);
  if (!targetId) return;

  setTimeout(() => {
    if (targetType === 'rental') {
      const rows = document.querySelectorAll('#rentals-body tr');
      rows.forEach(row => {
        const idCell = row.querySelector('td:first-child strong');
        if (idCell && idCell.textContent.trim() === `#${targetId}`) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.transition = 'background 0.3s';
          row.style.background = '#fffbeb';
          setTimeout(() => { row.style.background = ''; }, 2500);
        }
      });
    }
    if (targetType === 'vehicle') {
      el('fgrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 600);
}

// ─── SESSION EXPIRY WARNING ───────────────────────────────────────────────────
function startSessionWatcher() {
  const token = sessionStorage.getItem('autorent_token');
  if (!token) return;
  try {
    const payload    = JSON.parse(atob(token.split('.')[1]));
    const expiresAt  = payload.exp * 1000;

    function checkExpiry() {
      const msLeft = expiresAt - Date.now();
      if (msLeft <= 0) { logout(); return; }
      if (msLeft <= 30 * 60 * 1000) {
        const minsLeft = Math.ceil(msLeft / 60000);
        toast(`⏱ Session expires in ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}. Save your work.`, 'error');
      }
    }

    checkExpiry();
    setInterval(checkExpiry, 5 * 60 * 1000);
  } catch (e) {
    logout();
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
goTo('dashboard');
startClock();
startSessionWatcher();
