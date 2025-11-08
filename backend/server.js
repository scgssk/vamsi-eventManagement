// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
// provide a compatible fetch function:
// - if running on Node 18+ use the global fetch
// - otherwise dynamically import the ESM-only `node-fetch` and call its default export
// We use a small wrapper `doFetch` so existing await calls can stay async.

async function doFetch(...args) {
  // 1) prefer global fetch when available (Node 18+ or polyfilled)
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch(...args);
  }

  // 2) try CJS require (node-fetch v2 or other CJS shims)
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const nf = require('node-fetch');
    const fn = typeof nf === 'function' ? nf : (nf.default || nf.fetch || nf);
    if (typeof fn === 'function') return fn(...args);
  } catch (err) {
    // ignore and fallback to dynamic import below
  }

  // 3) dynamic import of node-fetch (works with node-fetch v3+ which is ESM-only)
  try {
    const mod = await import('node-fetch');
    const fn = mod.default || mod.fetch || mod;
    if (typeof fn !== 'function') throw new Error('node-fetch did not export a callable function');
    return fn(...args);
  } catch (err) {
    // give a clearer error message for easier debugging
    throw new Error(`no fetch available (tried globalThis.fetch, require('node-fetch'), import('node-fetch')): ${err.message}`);
  }
}
const crypto = require('crypto');
const Participant = require('./models/Participant');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI;
const PY_QR_SERVICE = process.env.PY_QR_SERVICE;
const QR_SHARED_SECRET = process.env.QR_SHARED_SECRET;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'devkey';
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PASS = process.env.ADMIN_PASS || ADMIN_API_KEY; // simple fallback

// simple in-memory admin session store: token -> { expires }
const adminSessions = new Map();
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function createAdminSession() {
  const token = crypto.randomBytes(24).toString('hex');
  const expires = Date.now() + ADMIN_SESSION_TTL_MS;
  adminSessions.set(token, { expires });
  return { token, expires };
}

function validateAdminToken(token) {
  if (!token) return false;
  const s = adminSessions.get(token);
  if (!s) return false;
  if (s.expires < Date.now()) { adminSessions.delete(token); return false; }
  return true;
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('Mongo connected'))
  .catch(err=>{ console.error(err); process.exit(1); });

// helper: sign payload (HMAC-SHA256)
function signPayload(payload) {
  const payloadJson = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', QR_SHARED_SECRET);
  hmac.update(payloadJson);
  return {
    payload,
    signature: hmac.digest('hex')
  };
}

// helper: verify signature
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', QR_SHARED_SECRET);
  hmac.update(JSON.stringify(payload));
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { name, college, email, phone, eventId } = req.body;
    if (!name || !college) return res.status(400).json({ error: 'name and college required' });

    const participant = new Participant({ name, college, email, phone, eventId });
    await participant.save();

    // Prepare QR payload (we sign id + minimal fields + type)
    const qrData = {
      type: 'registration',
      id: participant._id.toString(),
      eventId: eventId || null,
      name: participant.name,
      email: participant.email,
      createdAt: new Date().toISOString()
    };
    const signed = signPayload(qrData);

    // call python service to generate PNG (base64)
    const pyResp = await doFetch(`${PY_QR_SERVICE}/generate_qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: signed })
    });
    if (!pyResp.ok) {
      const txt = await pyResp.text();
      return res.status(502).json({ error: 'QR service failed', detail: txt });
    }
    const { pngDataUri } = await pyResp.json();

    participant.registrationQRCode = pngDataUri; // save
    await participant.save();

    res.json({ participantId: participant._id, pngDataUri, participant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/verify-qr
// receives the decoded JSON from the QR or raw scanned string
app.post('/api/verify-qr', async (req, res) => {
  try {
    const { signed } = req.body; // { payload, signature }
    if (!signed) return res.status(400).json({ error: 'signed required' });
    const { payload, signature } = signed;
    if (!verifySignature(payload, signature)) return res.status(400).json({ error: 'invalid signature' });

    // find participant
    const participant = await Participant.findById(payload.id);
    if (!participant) return res.status(404).json({ error: 'not found' });

    res.json({ ok: true, participant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// PATCH /api/participants/:id/approve (admin)
// admin auth middleware (accepts either legacy x-admin-key OR x-admin-token)
function requireAdmin(req, res, next) {
  try {
    const apiKey = req.headers['x-admin-key'];
    if (apiKey && apiKey === ADMIN_API_KEY) return next();
    const token = req.headers['x-admin-token'];
    if (token && validateAdminToken(token)) return next();
    return res.status(401).json({ error: 'unauthorized' });
  } catch (err) {
    console.error('admin auth error', err);
    return res.status(500).json({ error: 'server error' });
  }
}

app.patch('/api/participants/:id/approve', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const participant = await Participant.findById(id);
    if (!participant) return res.status(404).json({ error: 'not found' });
    participant.approved = true;
    await participant.save();
    res.json({ ok: true, participant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/generate-entry-pass -> generate fresh entry pass QR (only if approved)
app.post('/api/generate-entry-pass', async (req, res) => {
  try {
    const { participantId } = req.body;
    const participant = await Participant.findById(participantId);
    if (!participant) return res.status(404).json({ error: 'not found' });
    if (!participant.approved) return res.status(403).json({ error: 'participant not approved yet' });

    const payload = {
      type: 'entry_pass',
      id: participant._id.toString(),
      name: participant.name,
      email: participant.email,
      eventId: participant.eventId || null,
      exp: new Date(Date.now() + 1000 * 60 * 60).toISOString() // expires in 1 hour
    };
    const signed = signPayload(payload);

    // ask python to build QR
    const pyResp = await doFetch(`${PY_QR_SERVICE}/generate_qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: signed })
    });
    if (!pyResp.ok) return res.status(502).json({ error: 'qr service error' });
    const { pngDataUri } = await pyResp.json();

    participant.entryPassQRCode = pngDataUri;
    await participant.save();

    res.json({ pngDataUri, participant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /api/participants/search - find by email & name
app.get('/api/participants/search', async (req, res) => {
  try {
    const { email, name } = req.query;
    if (!email && !name) {
      return res.status(400).json({ error: 'email or name required' });
    }

    // Build query - match either email or name (case-insensitive)
    const query = {
      $or: []
    };
    if (email) query.$or.push({ email: new RegExp(email, 'i') });
    if (name) query.$or.push({ name: new RegExp(name, 'i') });
    
    const participant = await Participant.findOne(query);
    res.json({ participant: participant || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/admin/login -> returns a short-lived admin token
app.post('/api/admin/login', async (req, res) => {
  try {
    const { id, pass } = req.body || {};
    if (!id || !pass) return res.status(400).json({ error: 'id and pass required' });
    // simple check against env vars
    if (id === ADMIN_ID && pass === ADMIN_PASS) {
      const s = createAdminSession();
      return res.json({ ok: true, token: s.token, expires: s.expires });
    }
    return res.status(401).json({ error: 'invalid credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// POST /api/admin/logout -> invalidate token (optional)
app.post('/api/admin/logout', async (req, res) => {
  try {
    const token = req.headers['x-admin-token'] || (req.body && req.body.token);
    if (token && adminSessions.has(token)) adminSessions.delete(token);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// health endpoint
app.get('/api/status', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'not-ready';
  } catch(e) {}
  // check python service
  let pyStatus = 'unknown';
  try {
  // note: some fetch implementations may not support `timeout` option; the fallback
  // below passes the provided options through but the global fetch may ignore timeout.
  const r = await doFetch(`${PY_QR_SERVICE}/health`, { timeout: 3000 });
    if (r.ok) pyStatus = 'ok';
    else pyStatus = 'bad';
  } catch(e) { pyStatus = 'unreachable'; }

  res.json({ ok: true, db: dbStatus, python: pyStatus, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log(`API listening on ${PORT}`));
