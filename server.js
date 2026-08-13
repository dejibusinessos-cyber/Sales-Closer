require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { getConversation, getOrCreateConversation, saveConversation, listConversations } = require('./store');

const {
  PORT = 3000,
  ANTHROPIC_API_KEY,
  CLAUDE_MODEL = 'claude-sonnet-5',
  WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_APP_SECRET,
  DASHBOARD_USER,
  DASHBOARD_PASSWORD,
} = process.env;

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// Sales logic — canonical implementation of docs/sales-frameworks.md, Section 9
// (Sales Response Vault), with stage-awareness from Section 4 (Seven-Step
// Sales Process) and offer language from Section 3 (Offer Strength).
// Do not weaken or simplify these rules — refine wording only.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are the WhatsApp sales assistant for TK Store, a Nigerian retail business. You chat directly with customers on the store's WhatsApp to move them toward a purchase. You sound like a real person running the shop, never like a bot or a customer service script.

## Seven-Step Sales Process
Every conversation sits somewhere on this path. Read where the customer actually is and respond to that stage, never skip ahead:
1. Prospecting and Initial Contact
2. Qualifying
3. Needs Assessment
4. Sales Pitch / Product Demo
5. Proposal / Negotiation
6. Closing
7. Following Up, Support, Brokering & Referrals

Never push a Closing-stage move (step 6) on a lead that is still clearly at Needs Assessment (step 3) or earlier. Match the ask to the stage the customer is at.

## Offer Strength Framework
When you present or reinforce an offer, draw on whichever of these fit naturally. Don't stack all four in one message, and never invent one that isn't true:
- Promise: the bold, dream outcome the product delivers
- Package: the bundle of value (bonuses, extras, delivery)
- Protection: risk reversal, only if it is a real, already-established policy
- Push: scarcity or urgency to act now, only if genuinely true

## Sales Response Vault — Seven Core Rules
1. Never defend or apologise for the price. State the value calmly once, then move forward.
2. Silence is not rejection. It is usually distraction or unspoken doubt, not a no. Respond with a warm, low-pressure nudge, never a guilt trip.
3. Speed itself sells. Keep replies tight and immediate in tone.
4. Never sound desperate. Confidence sells, begging repels.
5. Every message ends with ONE clear, easy next step. Never leave a chat open-ended.
6. Mirror the customer's tone and energy. Warm with the warm, calm and steady with the upset or angry.
7. Follow up politely, without pressure. Most sales close after the third message, not the first.

## Situation-Specific Handling
- Price objection: acknowledge briefly, reframe around value/outcome, never discount reflexively, end with a next step.
- Gone quiet / ghosted: warm no-pressure check-in, give an easy low-effort way to respond (a small choice, not an open question).
- Delay or stall: gently surface the real hidden doubt (price? fit? timing?), offer a low-commitment hold/deposit if it fits.
- Closing moment: assume the sale, ask a small logistics question (delivery vs pickup) instead of "do you want to buy?"
- Scheduled follow-up: reference timing naturally, stay warm and light, never guilt-trip about the wait.
- Difficult / angry customer: apologise once genuinely, stay calm, pivot immediately to solving the issue, never blame the customer.
- Complaint: acknowledge fully, ask exactly what went wrong, commit to fixing it before offering compensation.
- Refund request: understand the reason first, offer a fix/exchange before cash, stay fair and non-defensive.
- Delivery delay: inform before they ask if possible, give a concrete new time and honest reason, apologise sincerely if overdue.

## Sound Human, Not AI
- 1 to 3 short lines, about 35 words max. Never a wall of text.
- Use contractions and natural Nigerian WhatsApp-seller phrasing. Imperfect grammar beats stiff, polished copy.
- No em dashes, no semicolons, no bullet or numbered lists inside the message itself.
- Avoid corporate phrases: "I understand your concern," "please note," "I appreciate your patience," "as previously mentioned."
- At most one emoji, only if it fits naturally. Often none is better.
- Use the customer's name occasionally, not in every message.
- Never fabricate stock numbers, guarantees, discounts, or policies that haven't already been established in this conversation.

Respond with only the WhatsApp message text itself. No preamble, no labels, no explanation of your reasoning.`;

// ---------------------------------------------------------------------------
// Conversation store — backed by Supabase (see store.js)
// ---------------------------------------------------------------------------
async function safeSaveConversation(convo) {
  try {
    await saveConversation(convo);
  } catch (err) {
    logError(`Failed to save conversation for ${maskPhone(convo.phone)}`, err);
  }
}

// ---------------------------------------------------------------------------
// Logging (mask phone numbers — keep only the last 4 digits)
// ---------------------------------------------------------------------------
function maskPhone(phone) {
  const str = String(phone || '');
  if (str.length <= 4) return '*'.repeat(str.length);
  return '*'.repeat(str.length - 4) + str.slice(-4);
}

function truncate(str, n = 120) {
  const s = String(str || '');
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function logInfo(msg) {
  console.log(`[${new Date().toISOString()}] INFO  ${msg}`);
}

function logError(msg, err) {
  console.error(`[${new Date().toISOString()}] ERROR ${msg}`, err && err.stack ? err.stack : err);
}

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------
async function generateAIReply(convo) {
  const history = convo.messages
    .filter((m) => m.role === 'customer' || m.role === 'ai')
    .map((m) => ({ role: m.role === 'customer' ? 'user' : 'assistant', content: m.text }));

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

// ---------------------------------------------------------------------------
// WhatsApp Cloud API
// ---------------------------------------------------------------------------
async function sendWhatsAppMessage(phone, text) {
  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${errBody}`);
  }

  return res.json();
}

function verifyWebhookSignature(req) {
  const signature = req.get('X-Hub-Signature-256');
  if (!signature || !WHATSAPP_APP_SECRET || !req.rawBody) return false;

  const expected =
    'sha256=' + crypto.createHmac('sha256', WHATSAPP_APP_SECRET).update(req.rawBody).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

async function handleIncomingMessage(phone, name, text) {
  let convo;
  try {
    convo = await getOrCreateConversation(phone, name);
  } catch (err) {
    logError(`Failed to load conversation for ${maskPhone(phone)}`, err);
    return;
  }
  if (name && !convo.name) convo.name = name;

  convo.messages.push({ role: 'customer', text, ts: new Date().toISOString() });
  logInfo(`Incoming message from ${maskPhone(phone)}: "${truncate(text)}"`);

  let draft;
  try {
    draft = await generateAIReply(convo);
  } catch (err) {
    logError(`Anthropic API error generating reply for ${maskPhone(phone)}`, err);
    await safeSaveConversation(convo);
    return;
  }

  if (convo.auto_reply) {
    try {
      await sendWhatsAppMessage(phone, draft);
      convo.messages.push({ role: 'ai', text: draft, ts: new Date().toISOString(), mode: 'auto' });
      convo.pending_reply = null;
      logInfo(`Auto reply sent to ${maskPhone(phone)}: "${truncate(draft)}"`);
    } catch (err) {
      logError(`WhatsApp send error (auto reply) for ${maskPhone(phone)}`, err);
      convo.pending_reply = draft; // fall back to manual approval if the send failed
    }
  } else {
    convo.pending_reply = draft;
  }

  await safeSaveConversation(convo);
}

async function processWebhookPayload(body) {
  const entries = body.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      if (!value.messages) continue; // status callbacks (sent/delivered/read) — nothing to do

      const contact = (value.contacts && value.contacts[0]) || {};
      const name = contact.profile && contact.profile.name;

      for (const msg of value.messages) {
        if (msg.type !== 'text') {
          logInfo(`Skipping non-text message (type=${msg.type}) from ${maskPhone(msg.from)}`);
          continue;
        }
        await handleIncomingMessage(msg.from, name, msg.text.body);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Meta calls this to verify the webhook URL. Must stay unauthenticated.
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    logInfo('Webhook verification succeeded');
    return res.status(200).send(challenge);
  }
  logInfo('Webhook verification failed');
  return res.sendStatus(403);
});

// Meta delivers inbound messages here. Must stay unauthenticated (protected by
// the X-Hub-Signature-256 check instead) and must ack fast or Meta retry-storms us.
app.post('/webhook', (req, res) => {
  if (!verifyWebhookSignature(req)) {
    logInfo('Rejected webhook POST with invalid or missing signature');
    return res.sendStatus(401);
  }

  res.sendStatus(200); // ack immediately, before any Claude/WhatsApp calls

  processWebhookPayload(req.body).catch((err) => {
    logError('Error processing webhook payload', err);
  });
});

function requireDashboardAuth(req, res, next) {
  if (!DASHBOARD_USER || !DASHBOARD_PASSWORD) return next(); // not configured — local dev only

  const header = req.get('Authorization');
  if (!header || !header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="TK Store Dashboard"');
    return res.status(401).send('Authentication required');
  }

  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (user === DASHBOARD_USER && pass === DASHBOARD_PASSWORD) return next();

  res.set('WWW-Authenticate', 'Basic realm="TK Store Dashboard"');
  return res.status(401).send('Invalid credentials');
}

app.use(requireDashboardAuth);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

function asyncHandler(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

const apiRouter = express.Router();

apiRouter.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    res.json({ conversations: await listConversations() });
  })
);

apiRouter.get(
  '/conversations/:phone',
  asyncHandler(async (req, res) => {
    const convo = await getConversation(req.params.phone);
    if (!convo) return res.status(404).json({ error: 'conversation not found' });
    res.json({ conversation: convo });
  })
);

apiRouter.post(
  '/conversations/:phone/auto-reply',
  asyncHandler(async (req, res) => {
    const convo = await getConversation(req.params.phone);
    if (!convo) return res.status(404).json({ error: 'conversation not found' });

    convo.auto_reply = !!req.body.auto_reply;
    await saveConversation(convo);
    res.json({ ok: true, conversation: convo });
  })
);

apiRouter.post(
  '/conversations/:phone/reply',
  asyncHandler(async (req, res) => {
    const { phone } = req.params;
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text) return res.status(400).json({ error: 'text is required' });

    const convo = await getConversation(phone);
    if (!convo) return res.status(404).json({ error: 'conversation not found' });

    try {
      await sendWhatsAppMessage(phone, text);
    } catch (err) {
      logError(`WhatsApp send error (manual reply) for ${maskPhone(phone)}`, err);
      return res.status(502).json({ error: 'failed to send WhatsApp message' });
    }

    convo.messages.push({ role: 'ai', text, ts: new Date().toISOString(), mode: 'manual-approved' });
    convo.pending_reply = null;
    await saveConversation(convo);
    logInfo(`Manual reply sent to ${maskPhone(phone)}: "${truncate(text)}"`);

    res.json({ ok: true, conversation: convo });
  })
);

app.use('/api', apiRouter);

// JSON 404 for unmatched /api routes
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));

// Final error handler — catches anything asyncHandler forwards, keeps the
// process from crashing on a bad request.
app.use((err, req, res, next) => {
  logError('Unhandled request error', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal server error' });
});

process.on('unhandledRejection', (reason) => {
  logError('Unhandled promise rejection', reason);
});

process.on('uncaughtException', (err) => {
  logError('Uncaught exception — exiting so the platform can restart the process', err);
  process.exit(1);
});

app.listen(PORT, () => {
  logInfo(`TK Store WhatsApp AI Closer listening on port ${PORT}`);
});
