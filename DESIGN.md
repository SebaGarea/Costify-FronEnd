---
name: Costify
description: Operational cockpit for a small maker business — costs, sales, and production at a glance.
colors:
  teal-primary: "#319795"
  teal-hover: "#2C7A7B"
  teal-active: "#234E52"
  cyan-accent: "#0BC5EA"
  ink-bg: "#050b13"
  paper-bg: "#f5f7fb"
  surface-dark: "#0f172a"
  surface-light: "#ffffff"
  text-paper: "#F7FAFC"
  text-ink: "#1A202C"
  border-dark: "#2D3748"
  border-light: "#E2E8F0"
  muted-dark: "#A0AEC0"
  muted-light: "#4A5568"
  success: "#38A169"
  warning: "#DD6B20"
  danger: "#E53E3E"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  data:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1, 'cv01' 1"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  md: "8px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.teal-primary}"
    textColor: "{colors.text-paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
  button-primary-active:
    backgroundColor: "{colors.teal-active}"
  card:
    backgroundColor: "{colors.surface-dark}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-paper}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  nav-item:
    textColor: "{colors.text-paper}"
    rounded: "{rounded.lg}"
    padding: "16px"
  nav-item-hover:
    backgroundColor: "{colors.cyan-accent}"
    textColor: "{colors.surface-light}"
---

# Design System: Costify

## 1. Overview

**Creative North Star: "The Operator's Cockpit"**

Costify is the control cabin of a small maker business. The owner sits down to
answer one concrete question — *what did I make this month, what's overdue, what
does this product cost to build* — and the interface answers it without ceremony.
Like a well-laid cockpit, every instrument is legible at a glance, every control
is exactly where the hand expects it, and nothing flashes for attention it hasn't
earned. The mood is calm-under-pressure: dark-first, dense where the data
warrants, and unshakably trustworthy. The figures are the product; the chrome
gets out of their way.

This system is **dark-mode-first**. The default surface is a near-black navy
(`#050b13`) with slate panels floating on it; light mode is a fully-supported
mirror on cool paper (`#f5f7fb`), not an afterthought. A single confident teal
(`#319795`) carries every primary action, selection, and live state — it is the
one voice in the cabin, never decoration. Information is organized by hierarchy
and rhythm, not by boxing everything into identical cards.

What this system explicitly **rejects**: the cutesy, toy-like consumer look
(oversized rounded everything, mascots, bouncy motion) — this tool handles real
money and must read as serious. It also rejects the generic AI/SaaS template
(gradient hero metrics, tiny uppercase tracked eyebrows over every section,
endless identical icon+number card grids) and the cluttered, gray enterprise-ERP
feel. Density is earned with hierarchy, never imposed as complexity.

**Key Characteristics:**
- Dark-first navy cockpit; light mode is a faithful mirror, not a downgrade.
- One teal voice for action, selection, and state — reserved, never decorative.
- Numbers rendered with tabular figures and clear hierarchy; data is the hero.
- One typeface (Inter) across headings, labels, body, and data — no display pairing.
- Calm motion: 150–250 ms, conveying state, never choreography.

## 2. Colors

A restrained dark-navy cockpit lit by a single teal instrument light, with a
disciplined neutral ramp and three semantic states held in reserve.

### Primary
- **Cockpit Teal** (`#319795`, Chakra `teal.500`): The one voice. Primary
  buttons, the active/selected state, links, focus accents, calendar event chips,
  and any "live" indicator. In dark mode it brightens toward `teal.300` for
  contrast; in light mode it deepens toward `teal.600` (`#2C7A7B`) for legible
  text on pale surfaces. Hover deepens to `teal.600` (`#2C7A7B`), active to
  `teal.800` (`#234E52`).

### Secondary
- **Signal Cyan** (`#0BC5EA`, Chakra `cyan.400`): Reserved for navigation
  affordance — the sidebar item hover/active fill. A brighter cousin of the
  primary teal; never used for primary actions, so the two never compete.

### Neutral
- **Deep Hull Navy** (`#050b13`): The default app background. Near-black with a
  blue undertone — the cabin at night.
- **Slate Panel** (`#0f172a`, surfaced at ~85% alpha): Card, panel, input, and
  sidebar surfaces floating above the hull in dark mode.
- **Cool Paper** (`#f5f7fb`): Light-mode background. A true cool off-white, not
  a warm cream.
- **Instrument White** (`#F7FAFC`, Chakra `gray.50`): Primary text on dark.
- **Hull Ink** (`#1A202C`, Chakra `gray.800`): Primary text on light.
- **Readout Grey** (`#A0AEC0` dark / `#4A5568` light): Muted/secondary text and
  helper copy. **Floor, not default** — see the Readout Rule.
- **Panel Seam** (`#2D3748` dark / `#E2E8F0` light): Borders, dividers, table
  rules. 1px only.

### Tertiary (semantic states only)
- **Go Green** (`#38A169`): success, paid, completed, in-stock.
- **Caution Amber** (`#DD6B20`): warning, partial balance, due soon, medium priority.
- **Alert Red** (`#E53E3E`): error, overdue, high priority, destructive actions.

### Named Rules
**The One Voice Rule.** Cockpit Teal is the only accent that signals action and
state. It appears on a small fraction of any screen; its rarity is what makes a
primary button or a selected row read instantly. Never use it as decoration or
as a background wash.

**The Readout Rule.** Muted grey (`#A0AEC0` on dark, `#4A5568` on light) is the
*lightest* a piece of text may go, and only for genuinely secondary copy. Body
text, figures, and anything a user reads to make a decision use Instrument White
/ Hull Ink. If a number is hard to read against a tinted panel, the fix is more
contrast, never a lighter grey.

**The Reserved-State Rule.** Green, Amber, and Red carry *meaning*, never style.
A green badge means paid; it never means "nice." Do not introduce a fourth or
fifth decorative hue (no indigo, lime, purple confetti across a dashboard).

## 3. Typography

**Display / Headline / Body / Label / Data Font:** Inter (with
`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` fallback)

**Character:** One humanist-geometric sans does everything. Inter is neutral,
highly legible at small sizes, and ships true tabular figures (`tnum`) — ideal
for a tool whose job is aligning currency columns. A product UI rarely benefits
from a display/body pairing; one well-tuned family across headings, labels,
body, and data reads as deliberate, not plain.

> **Migration note:** components currently request `'Space Grotesk', 'DM Sans'`
> inline, but **no font is actually loaded** anywhere — those headings silently
> fall back to the system sans. The system standardizes on **Inter, loaded once**
> and tokenized in the Chakra theme (`fonts.heading` / `fonts.body`), removing
> the inline `fontFamily` strings.

### Hierarchy
- **Display** (700, 2.25rem / `4xl`, line-height 1.15, letter-spacing -0.02em):
  Page titles only — the dashboard "Dashboard Operativo", a section's top H1.
- **Headline** (700, 1.5rem / `2xl`, 1.25): Card and panel headings.
- **Title** (600, 1.125rem / `lg`, 1.3): Sub-section headings, list group labels.
- **Body** (400, 1rem / `md`, 1.5): Default reading text. Prose capped at 65–75ch.
- **Data** (600, 1.5rem / `2xl`, 1.1, tabular figures): Key metrics, currency
  readouts, stat numbers. Always tabular (`font-feature-settings: 'tnum'`) so
  columns of money align.
- **Label** (500, 0.875rem / `sm`, 1.4, sentence case): Form labels, helper text,
  badges, table headers.

### Named Rules
**The Tabular Money Rule.** Every figure a user compares — prices, costs,
balances, totals in a column — uses tabular-figure Inter. Proportional digits in
a money column are a defect.

**The Sentence-Case Rule.** Labels and headers are sentence case. Tiny uppercase
letter-tracked "eyebrow" labels (e.g. `letterSpacing: 0.2em; textTransform:
uppercase` over every stat) are an AI-template tell and are prohibited as default
scaffolding. Reserve all-caps for a deliberate, rare badge — never as a section kicker.

## 4. Elevation

A hybrid, leaning flat-tonal. Depth comes first from **tonal layering** — slate
panels (`#0f172a`) sit visibly above the navy hull (`#050b13`), and a 1px Panel
Seam border defines every surface edge. Shadows are a light secondary cue, used
to lift the most important floating surfaces (primary stat readouts, modals,
popovers), not sprinkled on every box.

### Shadow Vocabulary
- **Resting panel** (`box-shadow: none`, border only): Default for cards,
  inputs, list rows. The seam border does the work.
- **Lifted readout** (Chakra `xl` → `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`):
  The few stat cards / summary panels that should read as primary instruments.
- **Floating** (Chakra `2xl` → `0 25px 50px -12px rgba(0,0,0,0.25)`): Modals,
  menus, tooltips, day-detail popovers — surfaces that leave the plane.

### Named Rules
**The Seam-First Rule.** A surface is defined by its 1px Panel Seam border and
its tonal step above the background, not by a drop shadow. Reach for shadow only
when a surface genuinely floats above the page (modal, menu) or is the single
most important instrument on screen. On dark mode especially, heavy shadows read
as muddy — prefer the tonal step.

## 5. Components

### Buttons
- **Shape:** Gently rounded (8px, `rounded.md`). Never pill-shaped for standard
  actions; pills are reserved for badges/chips.
- **Primary:** Solid Cockpit Teal (`#319795`) fill, Instrument White text,
  `8px 16px` padding. The one high-emphasis action per view.
- **Hover / Focus:** Hover deepens to `teal.600` (`#2C7A7B`); active to
  `teal.800` (`#234E52`). Focus shows a visible 2px teal focus ring
  (`box-shadow` outline) — never `_focus={{ boxShadow: "none" }}` on an
  interactive control.
- **Secondary / Ghost:** Outline (1px Panel Seam border, transparent fill, teal
  text) for secondary actions; ghost (no border, teal text, subtle hover fill)
  for tertiary/toolbar actions. One save button shape across the whole app.

### Chips / Badges
- **Style:** Pill (`rounded.full`), `px 8–12`, label type (500, 0.875rem),
  sentence case. Subtle variant: tinted background of the semantic hue at low
  alpha with the solid hue as text.
- **State:** Semantic only — Go Green / Caution Amber / Alert Red for
  paid/partial/overdue and priority. Teal pill for selected filters.

### Cards / Containers
- **Corner Style:** `rounded.xl` (12px) for standard cards; `rounded.2xl`
  (16px) for large summary panels.
- **Background:** Slate Panel (`#0f172a`, ~85% alpha) on dark; Surface White on
  light. Nested inner rows step to a slightly different tone — **never a card
  inside a card with the same treatment.**
- **Shadow Strategy:** Seam-First — border by default; `xl`/`2xl` shadow only on
  primary instruments and floating surfaces (see Elevation).
- **Border:** 1px Panel Seam (`#2D3748` / `#E2E8F0`).
- **Internal Padding:** `md`–`lg` (16–24px); large panels `24px`.

### Inputs / Fields
- **Style:** Slate Panel / Surface White fill, 1px Panel Seam border,
  `rounded.md` (8px), `8px 12px` padding, Instrument White / Hull Ink text.
- **Focus:** Border shifts to Cockpit Teal with a 2px teal ring. No glow, no bounce.
- **Error / Disabled:** Error border in Alert Red with a short message below
  (never color alone). Disabled drops to 60% opacity, no pointer.
- **Placeholder:** Must meet 4.5:1 — use Readout Grey at full strength, not a
  faint near-background tint.

### Navigation
- **Sidebar:** Fixed 224px (`md: 56`) Slate Panel rail with a 1px right seam,
  logo at top, vertical nav list. On mobile it collapses into a full-screen
  Drawer behind a hamburger; a top bar carries the menu trigger, brand, color-mode
  toggle, and user menu.
- **Nav item:** Label type, `rounded.lg`, `16px` padding. **Default** is quiet
  (inherited text). **Hover/active** fills with Signal Cyan (`#0BC5EA`) and white
  text. The current route should also read as active (not hover-only).
- **Color-mode toggle:** Sun/Moon in the top bar; dark is the default.

### Stat / Readout Card (signature)
The dashboard's core instrument. A panel with: a sentence-case Label, a large
tabular **Data** number in a semantic accent, an optional helper line in Readout
Grey, and a circular tinted icon badge. Prohibited: rendering these as an
endless identical grid of 8 — group and rank them, give the few that matter
visual primacy.

## 6. Do's and Don'ts

### Do:
- **Do** keep Costify dark-mode-first; treat light mode as a fully-working mirror
  with the same contrast guarantees (≥4.5:1 body, ≥3:1 large), in both modes.
- **Do** use Cockpit Teal (`#319795`) as the single action/state voice — primary
  buttons, selection, focus, live indicators — and nothing decorative.
- **Do** render every comparable figure (price, cost, balance, total) in
  tabular-figure Inter so money columns align.
- **Do** load Inter once and reference it via the Chakra theme
  (`fonts.heading` / `fonts.body`); delete the inline `fontFamily` strings.
- **Do** define surfaces with a 1px Panel Seam border and a tonal step; add
  shadow only to floating surfaces and the single most important instrument.
- **Do** give every interactive control a visible focus ring and full
  keyboard reachability; honor `prefers-reduced-motion`.
- **Do** keep motion at 150–250 ms and tie it to state (feedback, loading,
  reveal) — never page-load choreography.

### Don't:
- **Don't** make it cutesy or toy-like: no oversized rounded-everything, no
  mascots, no bouncy/elastic motion. This tool handles real money.
- **Don't** reach for the generic AI/SaaS template: no gradient hero metrics, no
  tiny uppercase letter-tracked eyebrows over every section, no endless identical
  icon+number card grids.
- **Don't** let body text or figures fade to muted grey for "elegance" — Readout
  Grey is the floor and only for secondary copy (the Readout Rule).
- **Don't** introduce a fourth/fifth decorative hue (indigo, lime, purple) across
  a dashboard — and **don't reference Chakra color scales that don't exist**
  (`indigo.*`, `lime.*` silently fail). Use the documented palette + semantic states.
- **Don't** ship `_focus={{ boxShadow: "none" }}` on interactive elements — it
  kills keyboard visibility.
- **Don't** nest a card inside a card with the same treatment; step the tone or
  drop the inner border.
- **Don't** use `border-left`/`border-right` > 1px as a colored accent stripe;
  use a full border, a tint, or a leading icon/number instead.
