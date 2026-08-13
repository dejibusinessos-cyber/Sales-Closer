# TK Store — WhatsApp AI Closer

A WhatsApp AI sales-closing assistant for TK Store. Node/Express backend,
vanilla JS dashboard (no build step), deploys to Render.

The AI's sales logic (`SYSTEM_PROMPT` in `server.js`) implements the
frameworks documented in [`docs/sales-frameworks.md`](docs/sales-frameworks.md) —
the Seven-Step Sales Process, the Offer Strength framework, and the Sales
Response Vault closing methodology. Read that file to understand *why* the
AI responds the way it does.

## How it works

1. A customer messages the store's WhatsApp number.
2. Meta forwards it to `POST /webhook` on this server.
3. The server asks Claude for a reply, using `SYSTEM_PROMPT` and the
   conversation history.
4. If **auto-reply** is on for that conversation, the reply is sent back to
   the customer immediately. If it's off (the default for new
   conversations), the draft is held as a `pending_reply` and shown in the
   dashboard for a human to approve, edit, or override.
5. The dashboard (`public/index.html`) lets you watch conversations, flip
   auto-reply on/off per customer, and approve/send replies.

## Local setup

```bash
npm install
cp .env.example .env   # then fill in the values below
npm start
```

The server listens on `PORT` (default `3000`). `GET /health` returns `{"ok":true}`
once it's up.

## Environment variables

Fill these in `.env`. Nothing here is guessable — get each one from its real
source below.

### `ANTHROPIC_API_KEY`

1. Go to [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Sign in, open **Settings → API Keys**.
3. Create a new key and paste it in as `ANTHROPIC_API_KEY`.

`CLAUDE_MODEL` defaults to `claude-sonnet-5` — leave it unless you have a
reason to pin a different model.

### WhatsApp Cloud API variables

These come from a **Meta App** connected to a **WhatsApp Business Account**.
If you haven't set that up yet:

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
   and create an app of type **Business**.
2. From the app dashboard, add the **WhatsApp** product.
3. Under **WhatsApp → API Setup** you'll see a test phone number Meta gives
   you for free (or you can add your own business number later).

**`WHATSAPP_PHONE_NUMBER_ID`**
Shown right there on the **API Setup** page, under "From" — it's a numeric
ID, not the phone number itself.

**`WHATSAPP_TOKEN`**
Also on **API Setup**, there's a temporary access token (valid ~24 hours) —
fine for local testing. For anything that needs to keep running (Render):
go to **Business Settings → Users → System Users**, create a system user,
generate a **permanent token** for it scoped to `whatsapp_business_messaging`
and `whatsapp_business_management`, and use that instead.

**`WHATSAPP_VERIFY_TOKEN`**
You make this one up yourself — any random string. You'll enter the exact
same string in two places: here in `.env`, and in the Meta dashboard's
webhook configuration (next step). It's just a shared secret so Meta can
confirm it's really your server answering.

**`WHATSAPP_APP_SECRET`**
From your app's dashboard: **App Settings → Basic**, under "App Secret"
(click "Show"). This is used to verify the `X-Hub-Signature-256` header
Meta signs every webhook request with — don't skip this in production.

### Registering the webhook (after you have a public URL)

Once this server is deployed (or tunneled via something like `ngrok` for
local testing) and you know its public URL:

1. In the Meta app dashboard, go to **WhatsApp → Configuration**.
2. Set **Callback URL** to `https://<your-domain>/webhook`.
3. Set **Verify Token** to the same value you put in `WHATSAPP_VERIFY_TOKEN`.
4. Click **Verify and Save** — Meta will call `GET /webhook` with a
   challenge; the server answers it automatically if the token matches.
5. Under **Webhook fields**, subscribe to `messages`.

### Dashboard protection

**`DASHBOARD_USER`** / **`DASHBOARD_PASSWORD`** — pick any username/password
yourself. These gate the dashboard and its API with HTTP Basic Auth. Leave
both blank only while developing locally; the server treats blank as "auth
disabled," which is not safe for anything public-facing (the dashboard can
read customer conversations and send messages on the store's behalf).

## What's still manual

Supabase-backed persistent storage isn't wired up yet — conversations
currently live in an in-memory `Map` and are lost on restart. That's tracked
separately; don't point this at real customer traffic until it's done.

## Deploying to Render

- **Build command:** `npm install`
- **Start command:** `npm start`
- **Node version:** 18 or later (set via Render's environment settings or an
  `engines` field — already present in `package.json`)
- Add every variable from `.env.example` in Render's **Environment** tab.
- Health check path: `/health`

After deploying, come back to the "Registering the webhook" steps above
using your Render URL.
