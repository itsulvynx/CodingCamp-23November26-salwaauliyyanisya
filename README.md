# Expense & Budget Visualizer

A mobile-friendly, responsive single-page web app for tracking daily spending. All data is stored locally in your browser — no account or server required.

## Features

### MVP
- **Total Balance** — Live running total of all transactions, displayed prominently at the top
- **Add Transaction** — Form with item name, amount, and category fields; validates all inputs before adding
- **Transaction List** — Scrollable list of all transactions with item name, amount, category badge, and a Delete button
- **Pie Chart** — Visual breakdown of spending by category using Chart.js (Food, Transport, Fun get fixed colors)
- **Persistent Storage** — All data saved to localStorage automatically; survives page refreshes

### Optional Features
- **Custom Categories** — Add your own categories beyond the defaults; they appear in the form and chart immediately
- **Sort Transactions** — Sort by newest, amount high/low, or category A–Z; preference is saved across sessions
- **Dark / Light Mode** — Toggle button in the header; respects your system preference on first visit; saved to localStorage

## Tech Stack

- **HTML5** — Semantic markup (`header`, `main`, `section`, `form`)
- **CSS3** — Custom properties for theming, flexbox layout, responsive breakpoints
- **Vanilla JavaScript** — No frameworks, no build tools
- **Chart.js** — Loaded from CDN for the pie chart
- **localStorage** — All persistence, no backend

## How to Run Locally

1. Clone or download this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. No build step, no npm install — it just works

## GitHub Pages

Live demo: `https://<your-username>.github.io/<your-repo-name>/`

## File Structure

```
index.html          ← App markup
css/style.css       ← All styles (custom properties, layout, dark mode)
js/app.js           ← All app logic (state, render, handlers)
README.md           ← This file
```
