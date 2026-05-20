/**
 * PageChat Hub — Production server (Railway / Render)
 * Serves the web app + Messenger webhook on one HTTPS URL.
 */
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'pagechat_verify_token';
const APP_SECRET = process.env.APP_SECRET || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';

const WEB_ROOT = path.join(__dirname, '..');

app.use(express.json());

// ─── Meta Webhook ─────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verified successfully');
    return res.status(200).send(challenge);
  }
  console.warn('[Webhook] Verification failed — check VERIFY_TOKEN');
  return res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  if (APP_SECRET && !verifySignature(req)) {
    console.warn('[Webhook] Invalid signature');
    return res.sendStatus(403);
  }

  const body = req.body;
  if (body.object === 'page') {
    body.entry?.forEach((entry) => {
      entry.messaging?.forEach((event) => {
        if (event.message) {
          console.log('[Message]', {
            pageId: entry.id,
            sender: event.sender?.id,
            text: event.message.text,
          });
        }
      });
    });
  }

  res.sendStatus(200);
});

app.get('/health', (_, res) => {
  res.json({
    ok: true,
    app: 'PageChat Hub',
    webhook: '/webhook',
    facebookAppIdSet: Boolean(FACEBOOK_APP_ID),
    verifyTokenSet: VERIFY_TOKEN !== 'pagechat_verify_token',
    appSecretSet: Boolean(APP_SECRET),
  });
});

// App ID for public users (no manual entry on login page)
app.get('/js/env.js', (_, res) => {
  res.type('application/javascript').send(
    `window.__PAGECHAT__=${JSON.stringify({ appId: FACEBOOK_APP_ID })};`
  );
});

// ─── Static app (frontend) ────────────────────────────────
app.use(express.static(WEB_ROOT));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/webhook') || req.path === '/health') return next();
  const file = path.join(WEB_ROOT, req.path);
  if (req.path.includes('.')) return res.status(404).send('Not found');
  res.sendFile(path.join(WEB_ROOT, 'index.html'));
});

function verifySignature(req) {
  const sig = req.get('X-Hub-Signature-256');
  if (!sig) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', APP_SECRET).update(JSON.stringify(req.body)).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`PageChat Hub live on port ${PORT}`);
  console.log(`Webhook URL: /webhook`);
  console.log(`Verify token: ${VERIFY_TOKEN}`);
});
