# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a zero-dependency, single-page expense tracker as three static files (`index.html`, `css/style.css`, `js/app.js`). All logic lives in vanilla JavaScript with a unidirectional data-flow: User Action → State Mutation → localStorage Sync → `render()` → DOM. Tasks are ordered so each step produces runnable, integrated code — no orphaned modules.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html`, `css/style.css`, and `js/app.js` at the workspace root (paths that work on GitHub Pages)
  - In `index.html`: add `<body data-theme="light">`, semantic elements `<header>`, `<main>`, all `<section>` cards, the two-column `.row` wrapper, the `<form id="transaction-form">`, the add-category sub-form, and the `<canvas id="spending-chart">` with its empty-state `<p>`
  - Add all `<label for="…">` / `id` pairings for every `<input>` and `<select>` as specified in the HTML structure design
  - Include all `role="alert"` error containers (`#form-error`, `#category-error`) with class `hidden`
  - Add `<script src="https://cdn.jsdelivr.net/npm/chart.js">` and `<script src="js/app.js">` at the bottom of `<body>`
  - Add `<link rel="stylesheet" href="css/style.css">` in `<head>`
  - _Requirements: 9.1, 10.1, 10.2, 10.3, 10.5, 10.6_

- [x] 2. Implement CSS custom properties, layout, and responsive design
  - [x] 2.1 Define CSS custom properties and base styles
    - Write `:root` custom properties (`--bg-page`, `--bg-card`, `--text-main`, `--text-muted`, `--accent`, `--shadow`, `--radius`, `--transition`) with their light-mode values
    - Write `[data-theme="dark"]` overrides for all color variables
    - Apply `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` to `body`
    - Set `background: var(--bg-page)` on `body` and `max-width: ~900px; margin: auto` on `main`
    - _Requirements: 8.2, 9.2, 9.4, 10.4_

  - [x] 2.2 Style cards, form, and interactive elements
    - Style `.card` / `<section>` with `background: var(--bg-card)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow)`
    - Ensure all `input`, `select`, `button` have `min-height: 44px`
    - Style the "Add Transaction" submit button full-width, blue background (`var(--accent)`)
    - Style `#balance-display` large, bold, `color: var(--accent)`; style `.card-label` small, uppercase, `color: var(--text-muted)`
    - Style transaction `<li>` rows: item name, bold-blue amount (`#3498db`), gray category badge
    - Style `#transaction-list` with `max-height: ~400px; overflow-y: auto`
    - Style `.error` class with red text; `.hidden` with `display: none`
    - Add CSS transitions on hover states and theme changes using `var(--transition)`
    - _Requirements: 3.1, 3.3, 4.1, 4.4, 9.3, 9.6, 9.7_

  - [x] 2.3 Implement responsive two-column layout
    - Write media query: `@media (min-width: 768px)` → `.row` uses `display: flex; gap: …` with both cards side by side
    - Below 768px: `.row` stacks vertically with Transactions card above Chart card
    - _Requirements: 9.4, 9.5_

- [x] 3. Implement state variables, persistence, and utilities in `app.js`
  - [x] 3.1 Write Section 1 (STATE) and Section 2 (PERSISTENCE)
    - Declare module-level variables: `let transactions = []`, `let categories = []`, `let currentTheme = "light"`, `let currentSort = "newest"`, `let chartInstance = null`
    - Implement `loadState()`: wrap all four `localStorage.getItem` + `JSON.parse` calls in a single `try/catch`; fall back to empty defaults; call `getSystemTheme()` for theme default
    - Implement `saveState()`: write all four keys (`"ebv_transactions"`, `"ebv_categories"`, `"ebv_theme"`, `"ebv_sort"`) via `localStorage.setItem`
    - Implement `getSystemTheme()`: returns `"dark"` or `"light"` based on `prefers-color-scheme`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.3_

  - [ ]* 3.2 Write property test for state serialization round-trip (Property 2)
    - **Property 2: State serialization round-trip preserves all state**
    - **Validates: Requirements 1.4**

  - [ ]* 3.3 Write property test for state hydration safety (Property 3)
    - **Property 3: State hydration never throws and always produces valid defaults**
    - **Validates: Requirements 1.5**

  - [x] 3.4 Write Section 3 (UTILITIES): pure functions
    - Implement `computeBalance(arr)`: `arr.reduce((s, t) => s + t.amount, 0)`
    - Implement `formatCurrency(n)`: returns `"$X,XXX.XX"` using `toLocaleString` or manual formatting with thousand separators and exactly 2 decimal places
    - Implement `sortTransactions(arr, option)`: returns a **copy** sorted by `"newest"` (desc by `id`), `"amount-desc"`, `"amount-asc"`, `"category-az"`; original array unchanged
    - Implement `computeCategoryTotals(arr)`: returns `{ [category]: totalAmount }` object
    - Implement `getCategoryColor(name, categories)` with `FIXED_COLORS` and `CUSTOM_PALETTE` as specified in the design
    - _Requirements: 4.2, 4.3, 5.2, 5.3, 7.2_

  - [ ]* 3.5 Write property test for `computeBalance` (Property 9)
    - **Property 9: Balance equals the sum of all transaction amounts**
    - **Validates: Requirements 4.2**

  - [ ]* 3.6 Write property test for `formatCurrency` (Property 10)
    - **Property 10: Currency format produces a valid dollar string**
    - **Validates: Requirements 4.3**

  - [ ]* 3.7 Write property test for `sortTransactions` (Property 15)
    - **Property 15: Sort returns a correctly ordered copy without mutating the input**
    - **Validates: Requirements 3.5, 7.2**

  - [ ]* 3.8 Write property test for `computeCategoryTotals` (Property 11)
    - **Property 11: Category totals aggregation is correct**
    - **Validates: Requirements 5.2**

  - [ ]* 3.9 Write property test for `getCategoryColor` (Property 12)
    - **Property 12: Category color assignment is deterministic**
    - **Validates: Requirements 5.3**

- [x] 4. Checkpoint — Ensure all utility unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement validation functions
  - [x] 5.1 Implement `validateTransaction(name, amount, category)`
    - Return `{ valid: true }` iff `name.trim().length > 0`, `amount > 0` (numeric), and `category` is a non-empty string
    - Return `{ valid: false, error: "<message>" }` with the exact error messages defined in the design for each failure condition
    - _Requirements: 2.4, 2.5_

  - [ ]* 5.2 Write property test for `validateTransaction` (Property 4)
    - **Property 4: Form validation predicate is correct for all inputs**
    - **Validates: Requirements 2.4**

  - [x] 5.3 Implement `validateCategory(name, existing)`
    - Return `{ valid: true }` iff `name.trim().length > 0`, `name.trim().length <= 20`, and no element of `existing` matches `name` case-insensitively
    - Return `{ valid: false, error: "<message>" }` with the exact error messages from the design
    - _Requirements: 6.2, 6.3_

  - [ ]* 5.4 Write property test for `validateCategory` (Property 13)
    - **Property 13: Category validation predicate is correct for all inputs**
    - **Validates: Requirements 6.2**

- [x] 6. Implement state mutation functions
  - [x] 6.1 Implement `addTransaction(name, amount, category)`
    - Build transaction object: `id: Date.now().toString()`, trimmed `name`, numeric `amount`, `category`, `createdAt: new Date().toISOString()`
    - Push to `transactions`, call `saveState()`, call `render()`
    - _Requirements: 1.2, 2.6_

  - [ ]* 6.2 Write property test for `addTransaction` (Property 1)
    - **Property 1: Transaction object has all required fields with correct types**
    - **Validates: Requirements 1.2**

  - [ ]* 6.3 Write property test for valid form submit adds transaction (Property 6)
    - **Property 6: Valid form submit adds transaction with matching data**
    - **Validates: Requirements 2.6**

  - [ ]* 6.4 Write property test for invalid form submit leaves array unchanged (Property 5)
    - **Property 5: Invalid form submit leaves transactions array unchanged**
    - **Validates: Requirements 2.5**

  - [x] 6.5 Implement `deleteTransaction(id)`
    - Filter `transactions` by id, call `saveState()`, call `render()`
    - _Requirements: 3.6_

  - [ ]* 6.6 Write property test for `deleteTransaction` (Property 8)
    - **Property 8: Delete removes exactly the targeted transaction**
    - **Validates: Requirements 3.6**

  - [x] 6.7 Implement `addCategory(name)`, `setSortOption(value)`, `setTheme(value)`
    - `addCategory`: push to `categories`, call `saveState()`, `render()`
    - `setSortOption`: update `currentSort`, call `saveState()`, `render()`
    - `setTheme`: update `currentTheme`, set `document.documentElement` (or `body`) `data-theme` attribute, call `saveState()`, `render()`
    - _Requirements: 6.4, 7.3, 8.4_

  - [ ]* 6.8 Write property test for deleteTransaction preserves categories (Property 14)
    - **Property 14: Deleting a transaction preserves the categories array**
    - **Validates: Requirements 6.5**

- [x] 7. Implement render functions
  - [x] 7.1 Implement `renderBalance()`
    - Compute balance with `computeBalance(transactions)`, format with `formatCurrency`, set `#balance-display` textContent
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.2 Implement `renderCategorySelect()`
    - Clear `#category-select`, re-populate `<option>` elements from the `categories` array using `textContent` (not `innerHTML`)
    - _Requirements: 2.1, 6.4_

  - [x] 7.3 Implement `renderList()`
    - Sort a copy of `transactions` via `sortTransactions(transactions, currentSort)`
    - Clear `#transaction-list`
    - If empty, append a single `<li>` with text "No transactions yet" in muted style
    - Otherwise, create one `<li>` per transaction using `textContent` for all text values; show item name, formatted amount (bold blue), category badge, and a "Delete" button with the transaction id
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_

  - [ ]* 7.4 Write property test for rendered row count (Property 7)
    - **Property 7: Rendered row count equals transaction count**
    - **Validates: Requirements 3.2**

  - [x] 7.5 Implement `renderChart()`
    - If `transactions` is empty: hide `<canvas>`, show `#chart-empty`; return early
    - Otherwise: show canvas, hide `#chart-empty`
    - Destroy existing `chartInstance` if not null
    - Compute labels, data, and colors via `computeCategoryTotals` and `getCategoryColor`
    - Instantiate new `Chart` (pie type) with legend below and tooltip enabled
    - Set chart text/legend colors to match current theme (`var(--text-main)`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 7.6 Wire `render()` to call all four sub-renders
    - Implement `render()` as `renderBalance(); renderList(); renderChart(); renderCategorySelect();`
    - _Requirements: 1.6_

- [x] 8. Checkpoint — Ensure all render and mutation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement event handlers and initialize the app
  - [x] 9.1 Implement transaction form submit handler
    - Attach `submit` listener to `#transaction-form`; prevent default
    - Read `#item-name`, `#amount`, `#category-select` values
    - Call `validateTransaction`; on failure show error in `#form-error` (remove `hidden`, set `textContent`); on success hide error, call `addTransaction`, clear fields, reset select to first option, return focus to `#item-name`
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 9.2 Implement add-category button handler
    - Attach `click` listener to `#add-category-btn`
    - Read `#new-category` value; call `validateCategory(name, categories)`; on failure show `#category-error`; on success hide error, call `addCategory`, clear `#new-category`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 9.3 Implement sort select change handler
    - Attach `change` listener to `#sort-select`; call `setSortOption(value)`
    - On page load, restore saved sort by setting `#sort-select.value = currentSort`
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 9.4 Implement theme toggle handler
    - Attach `click` listener to `#theme-toggle`
    - Toggle between `"light"` and `"dark"`, call `setTheme(newTheme)`, update button label/icon
    - On page load, apply saved theme via `setTheme(currentTheme)` and set button label appropriately
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 9.5 Implement delete transaction event delegation
    - Attach a single `click` listener to `#transaction-list`; check `event.target` for the "Delete" button; read `data-id` attribute; call `deleteTransaction(id)`
    - _Requirements: 3.6_

  - [x] 9.6 Implement app initialization (`init()`)
    - Call `loadState()`, apply theme via `setTheme(currentTheme)`, restore `#sort-select.value`, call `render()`
    - Call `init()` at the bottom of `app.js`
    - _Requirements: 1.5, 7.4, 8.3, 8.5_

- [x] 10. Final checkpoint — Ensure all tests pass and the app works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property-based tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations per property; each test is tagged with its property number and requirements clause
- Unit tests (plain assertions) cover concrete examples: `formatCurrency` edge cases, default categories, empty-state rendering, theme toggle behavior
- Checkpoints ensure incremental validation at logical breaks
- All text inserted into the DOM must use `textContent` — never `innerHTML` — to prevent XSS

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["2.3", "3.5", "3.6", "3.7", "3.8", "3.9"] },
    { "id": 4, "tasks": ["4"] },
    { "id": 5, "tasks": ["5.1", "5.3"] },
    { "id": 6, "tasks": ["5.2", "5.4", "6.1", "6.5", "6.7"] },
    { "id": 7, "tasks": ["6.2", "6.3", "6.4", "6.6", "6.8"] },
    { "id": 8, "tasks": ["7.1", "7.2", "7.3", "7.5"] },
    { "id": 9, "tasks": ["7.4", "7.6"] },
    { "id": 10, "tasks": ["8"] },
    { "id": 11, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 12, "tasks": ["9.6"] },
    { "id": 13, "tasks": ["10"] }
  ]
}
```
