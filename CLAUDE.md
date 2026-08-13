# TK Store — WhatsApp AI Closer

Node/Express backend + vanilla JS dashboard (no build step) for a WhatsApp AI
sales-closing assistant for TK Store, a Nigerian retail business. Deploys to
Render; conversation storage backed by Supabase.

## Sales frameworks

Any AI-assisted work in this repo that touches customer-facing text —
`SYSTEM_PROMPT` in `server.js`, dashboard copy, follow-up sequences, ad
creative — must stay consistent with `docs/sales-frameworks.md`. That file is
the source of truth for the Seven-Step Sales Process, Offer Strength
framework, and the Sales Response Vault (the closing psychology rules).
`SYSTEM_PROMPT` is the canonical implementation of Section 9 of that doc —
don't weaken or simplify its rules when editing it.

## Layout

- `server.js` — Express app: WhatsApp Cloud API webhook, Claude integration,
  conversation store, dashboard API.
- `public/index.html` — dashboard (single file, no build step).
- `docs/sales-frameworks.md` — sales/growth framework reference.
- `README.md` — Meta WhatsApp Cloud API setup steps and deployment notes.
