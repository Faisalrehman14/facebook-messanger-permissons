/**
 * PageChat Hub — Messenger Webhook Server
 * Receives real-time messages from Meta and logs them (extend to DB/push later).
 */
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'pagechat_verify_token';
const APP_SECRET = process.env.APP_SECRET || '';

app.use(express.json());

// Meta webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Incoming messages (POST)
app.post('/webhook', (req, res) => {
  if (APP_SECRET && !verifySignature(req)) {
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
            mid: event.message.mid,
          });
        }
        if (event.postback) {
          console.log('[Postback]', event.postback);
        }
      });
    });
  }

  res.sendStatus(200);
});

app.get('/health', (_, res) => res.json({ ok: true, app: 'PageChat Hub Webhook' }));

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
  console.log(`PageChat Hub webhook running on http://localhost:${PORT}/webhook`);
  console.log(`Verify token: ${VERIFY_TOKEN}`);
});
