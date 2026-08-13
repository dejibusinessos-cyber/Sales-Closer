# TK Store — Sales & Growth Frameworks Reference

This file documents the frameworks powering the WhatsApp AI Closer and related
growth/marketing work. Keep this in the repo (e.g. `docs/sales-frameworks.md`)
and reference it from `CLAUDE.md` so any AI-assisted work on this codebase —
prompts, dashboard copy, follow-up logic — stays consistent with them.

---

## 1. Three Business Pillars

Every function in the business maps to one of three pillars. Use this to decide
what a feature or task is actually for.

- **Product** — What are we offering? Who is it for? Why should they choose it?
  How can we improve it? (customer research, offer development, product improvement)
- **Operations** — How do we deliver the promise? Who's responsible? How do we
  keep quality consistent? (fulfillment, reporting, customer support, staff
  management: assign → train → review → improve)
- **Marketing** — How do we attract, convert, and retain customers? Who needs
  what we offer? How do we reach them? What message helps them understand?

---

## 2. AI Build System (six steps, problem → business use)

1. **Identify & choose** — pick the pillar, process, task, problem, and result.
2. **Brainstorm & define** — use AI to make the tool idea clear (context + task).
3. **Create build documents** — record the product, design, information, rules, and tests.
4. **Write the build prompt** — tell the AI builder what to build and how to check it.
5. **Build, test & improve** — create the first version, correct problems.
6. **Deploy, adopt & measure** — publish, protect, teach, maintain, measure.

Apply this to every non-trivial feature/integration/fix in this repo: write a
short build doc (context + task + rules + tests) before writing code.

---

## 3. Offer Strength Framework

Every offer/pitch should be checked against these four levers — don't stack all
four at once, use whichever fit naturally:

| Lever | Meaning |
|---|---|
| **Promise** | The bold, dream outcome |
| **Package** | The bundle of value (bonuses, extras, delivery) |
| **Protection** | Risk reversal |
| **Push** | Scarcity / urgency to act now |

Rule: don't run ads or push offers without a strong offer behind them.

---

## 4. Seven-Step Sales Process

1. Prospecting and Initial Contact
2. Qualifying
3. Needs Assessment
4. Sales Pitch / Product Demo
5. Proposal / Negotiation
6. Closing
7. Following Up, Support, Brokering & Referrals

The AI closer should never push a Closing-stage move (step 6) on a lead that's
still clearly at Needs Assessment (step 3) — match the response to the stage.

---

## 5. Follow-Up System (timed cadence)

| Timeline | Objective | Suggested channels |
|---|---|---|
| Immediately (0–5 min) | Acknowledge enquiry & set expectations | WhatsApp, Email, Phone (if urgent) |
| Day 1 | Provide value and answer questions | WhatsApp, Phone Call, Email |
| Day 3 | Handle objections and build trust | WhatsApp, Phone Call |
| Day 7 | Share proof (testimonial, case study, demo) | WhatsApp, Email |
| Day 14 | Re-engage with new angle/offer | WhatsApp, Email, SMS |
| Day 28 | Final follow-up / graceful close-out | WhatsApp, Email |

Mantra: **"Fast buyers were someone else's lead who wasn't followed up."**
A silent lead is a scheduling problem, not necessarily a lost sale.

---

## 6. Never Depend on One Source of Customers

Diversify acquisition across all ten channels — don't over-index on one:

1. Referrals (existing customers, friends, word of mouth)
2. Partnerships (strategic partners, complementary businesses, cross-promotions)
3. Communities & Associations (professional bodies, churches, alumni groups, trade associations)
4. Events & Networking (conferences, exhibitions, workshops, speaking)
5. Content Marketing (social media, blogs, videos, newsletters)
6. Search & Local Discovery (Google Search, Google Business Profile, SEO)
7. Paid Advertising (Meta, Google, LinkedIn, TikTok Ads)
8. Directories & Marketplaces (business listings, directories)
9. Email & WhatsApp Marketing
10. Affiliate & Influencer Marketing (referral partners, creators, ambassadors)

---

## 7. Strategic Questions Framework

Before building or greenlighting anything, answer:

- What problem are we solving?
- Why does this matter *now*?
- What happens if we don't do this?
- What's the simplest path to measurable impact?

---

## 8. Key Mantras

- Value communication overcomes price resistance.
- **"You can't scale what you can't measure."**
- Don't advertise without a strong offer.
- Fast buyers were someone else's lead who wasn't followed up.
- Personal branding is intentional — perception vs. reality.
- Business is not about being busy but doing what works.

---

## 9. Sales Response Vault — WhatsApp Closing Psychology

Seven core rules for every closing message:

1. Never defend or apologise for the price — state the value calmly once, then move forward.
2. Silence is not rejection — usually distraction or unspoken doubt, not a no. Respond with a warm, low-pressure nudge, never a guilt trip.
3. Speed itself sells — keep replies tight and immediate in tone.
4. Never sound desperate — confidence sells, begging repels.
5. Every message ends with ONE clear, easy next step — never leave a chat open-ended.
6. Mirror the customer's tone and energy — warm with the warm, calm and steady with the upset or angry.
7. Follow up politely, without pressure — most sales close after the third message, not the first.

### Situation-specific handling (9 categories)

| Situation | Handling |
|---|---|
| **Price objection** | Acknowledge briefly, reframe around value/outcome, never discount reflexively, end with a next step. |
| **Gone quiet / ghosted** | Warm no-pressure check-in; give an easy low-effort way to respond (a small choice, not an open question). |
| **Delay or stall** | Gently surface the real hidden doubt (price? fit? timing?); offer a low-commitment hold/deposit if it fits. |
| **Closing moment** | Assume the sale — ask a small logistics question (delivery vs pickup) instead of "do you want to buy?" |
| **Scheduled follow-up** | Reference timing naturally, stay warm and light, never guilt-trip about the wait. |
| **Difficult / angry customer** | Apologise once genuinely, stay calm, pivot immediately to solving the issue, never blame the customer. |
| **Complaint** | Acknowledge fully, ask exactly what went wrong, commit to fixing it before offering compensation. |
| **Refund request** | Understand the reason first, offer a fix/exchange before cash, stay fair and non-defensive. |
| **Delivery delay** | Inform before they ask if possible; give a concrete new time and honest reason; apologise sincerely if overdue. |

### Language rules (write like a human, not an AI)

- 1–3 short lines, ~35 words max. Never a wall of text.
- Contractions and natural Nigerian WhatsApp-seller phrasing — imperfect grammar beats stiff, polished copy.
- No em dashes, no semicolons, no bullet/numbered lists in the message itself.
- Avoid corporate phrases: "I understand your concern," "please note," "I appreciate your patience," "as previously mentioned."
- At most one emoji, only if it fits naturally — often none is better.
- Use the customer's name occasionally, not every message.
- Never fabricate stock numbers, guarantees, discounts, or policies not already established in the conversation.

---

## Usage note for Claude Code

When generating or editing anything customer-facing (WhatsApp replies, sales
page copy, follow-up sequences, ad creative) in this repo, apply the relevant
framework(s) above rather than generic sales language. The system prompt in
`server.js` (`SYSTEM_PROMPT`) is the canonical implementation of Section 9 —
keep other AI-generated customer messages in this codebase consistent with it.
