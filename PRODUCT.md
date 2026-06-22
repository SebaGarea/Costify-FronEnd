# Product

## Register

product

## Users

The owner-operator of a small Argentine manufacturing / craft business and a
small team around them. They are not "software people" — they live in the
workflow of quoting, costing, selling, and delivering physical products across
channels (Mercado Libre, Instagram, WhatsApp, Nube, in-person). Their context is
busy and operational: they open Costify to answer a concrete question ("what did
I make this month?", "what's overdue?", "what does this product cost to build?")
or to record a sale, build a cost sheet, or check what raw materials to buy.
Currency is ARS; the entire UI is in Spanish (es-AR).

The job to be done: **run the money side of a small maker business without a
spreadsheet maze** — know real costs (planillas de costo), track sales and
pending balances, see what's late, and keep production inputs and tasks under
control, all in one place.

## Product Purpose

Costify turns scattered spreadsheets and mental math into a single operational
cockpit for a small maker business. It exists because the owner needs to know
their true unit costs and margins — not guesses — and to manage the sales,
deliveries, raw materials, shopping lists, tasks, and calendar that surround
production. Success looks like: the owner trusts the numbers enough to price
confidently, never misses a delivery, and spends minutes (not hours) on
bookkeeping. This is a real product in production; it also doubles as a portfolio
piece, so polish counts.

## Brand Personality

Confident and efficient. Costify should feel like a tool a professional trusts —
calm, precise, and out of the way, in the spirit of Linear or Stripe. Voice is
direct and plain-Spanish, never jargon-heavy and never cute. The interface earns
trust by being legible, consistent, and fast: the user is in a task, and the UI
serves it. Three words: **trustworthy, precise, effortless.**

## Anti-references

- **Cutesy / toy-like consumer app** (primary): no oversized rounded-everything,
  mascots, playful illustrations, or bouncy/elastic motion. This is a business
  tool that handles real money; it must read as serious and dependable, not
  gamified.
- **Generic AI/SaaS template:** avoid the cookie-cutter look — gradient hero
  metrics, tiny uppercase tracked eyebrows over every section, identical
  icon+heading+text card grids, side-stripe accent borders. (The current
  dashboard leans on some of these; treat them as debt, not the target.)
- **Heavy enterprise ERP:** not cluttered, gray, or intimidating. Density when
  the data warrants it, not complexity for its own sake.

## Design Principles

1. **The tool disappears into the task.** Earned familiarity over novelty.
   Standard affordances for standard jobs; no invented controls. The user should
   never pause to figure out how the UI works.
2. **Numbers must be trustworthy at a glance.** Costs, margins, balances, and
   due dates are the product. Give them clear hierarchy, correct contrast, and
   tabular legibility — never bury a figure in decoration.
3. **Consistency is a feature.** One component vocabulary across every screen —
   same buttons, form controls, cards, badges, and states. Surprise is saved for
   moments, never spread across pages.
4. **Density with hierarchy, not clutter.** Show what the operator needs, but
   group and rank it. Dense ≠ overwhelming; every screen has a clear primary
   action and reading order.
5. **Motion conveys state, not personality.** 150–250 ms, purposeful: feedback,
   state change, loading, reveal. No choreography for its own sake.

## Accessibility & Inclusion

- **Dark-mode-first, WCAG AA.** Dark mode is the default and primary surface;
  prioritize it, but keep light mode fully working. Target ≥4.5:1 contrast for
  body text and ≥3:1 for large text in *both* modes — watch muted grays on the
  dark navy (`#050b13`) and tinted card surfaces especially.
- Visible focus states and full keyboard navigation on all interactive elements.
- Honor `prefers-reduced-motion` with crossfade/instant alternatives.
- Spanish (es-AR) is the UI language; copy, dates, and currency follow local
  conventions.
