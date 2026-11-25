# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, responsive single-page web application that helps users track daily spending. It runs entirely in the browser with no backend server — all data persists via the browser's Local Storage API. Users can add and delete transactions, organize them by category, visualize spending with a pie chart, sort the transaction list, add custom categories, and toggle between light and dark themes. The application is built with plain HTML, CSS, and vanilla JavaScript, and is designed to be deployed on GitHub Pages.

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single spending record containing an id, item name, amount, category, and creation timestamp.
- **Category**: A label grouping transactions (e.g. "Food", "Transport", "Fun") or any user-defined custom label.
- **Balance**: The running total of all transaction amounts.
- **Chart**: The Chart.js pie chart displaying spending totals per category.
- **Local_Storage**: The browser's `localStorage` API used to persist all app state.
- **Render**: The single `render()` function that synchronizes the DOM (balance, list, chart) with the in-memory state arrays.
- **Theme**: The active color scheme — either "light" or "dark".
- **Sort_Option**: The user-selected ordering applied to the displayed transaction list.
- **Form**: The "Add Transaction" input form containing the item name, amount, and category fields.
- **Validator**: The client-side logic that checks Form input before a transaction is created.

---

## Requirements

### Requirement 1: Data Model and Persistence

**User Story:** As a user, I want my transactions and preferences saved automatically, so that my data is still available when I reopen the browser.

#### Acceptance Criteria

1. THE App SHALL maintain a single `transactions` array and a `categories` array as the source of truth for all displayed data.
2. THE App SHALL represent each transaction as an object with the fields: `id` (string, value of `Date.now().toString()`), `name` (string), `amount` (number), `category` (string), and `createdAt` (ISO 8601 date string).
3. THE App SHALL initialize the `categories` array with the values `["Food", "Transport", "Fun"]` when no saved data exists.
4. WHEN any state change occurs (transaction added, transaction deleted, category added, sort option changed, theme changed), THE App SHALL write the updated state to Local_Storage using the keys `"ebv_transactions"`, `"ebv_categories"`, `"ebv_theme"`, and `"ebv_sort"`.
5. WHEN the page loads, THE App SHALL read all four Local_Storage keys inside a `try/catch` block and fall back to empty default values for any key that is missing or contains invalid JSON.
6. WHEN any state change occurs, THE App SHALL call `render()` to synchronize the DOM with the current state.

---

### Requirement 2: Add Transaction Form

**User Story:** As a user, I want to add a spending transaction by filling in a name, amount, and category, so that I can record what I spent money on.

#### Acceptance Criteria

1. THE Form SHALL display three fields: a text input for item name, a number input for amount (with `step="0.01"` and `min="0.01"`), and a select dropdown for category populated from the `categories` array.
2. THE Form SHALL display a visible label above each input field.
3. THE Form SHALL display a full-width blue "Add Transaction" submit button with a minimum tap target height of 44px.
4. WHEN the user submits the Form, THE Validator SHALL verify that all three fields are filled, the item name contains at least one non-whitespace character, and the amount is a number greater than 0.
5. IF any validation condition in criterion 4 is not met, THEN THE Validator SHALL display a descriptive inline error message in red text below the Form using `role="alert"`, and SHALL NOT add a transaction.
6. WHEN a valid transaction is submitted, THE App SHALL add the transaction to the `transactions` array, save to Local_Storage, call `render()`, clear all Form fields, reset the category select to its first option, and return focus to the item name input.

---

### Requirement 3: Transaction List Display

**User Story:** As a user, I want to see a list of all my transactions, so that I can review what I have spent.

#### Acceptance Criteria

1. THE App SHALL display the transaction list in a scrollable container with a maximum height of approximately 400px and `overflow-y: auto`.
2. WHEN the `transactions` array is not empty, THE App SHALL render one row per transaction showing: the item name, the amount formatted as a dollar currency string with 2 decimal places (e.g. `$14.94`), and a small rounded category badge in gray text.
3. THE App SHALL display the amount in bold blue (`#3498db`).
4. WHEN the `transactions` array is empty, THE App SHALL display the text "No transactions yet" in muted text in place of the list rows.
5. THE App SHALL display transactions newest-first by default.
6. WHEN the user clicks the "Delete" button on a transaction row, THE App SHALL remove that transaction from the `transactions` array, save to Local_Storage, and call `render()`.
7. THE App SHALL render all transaction text using `textContent` rather than `innerHTML` to prevent XSS injection.

---

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display a "Total Balance" card at the top of the page with a label reading "TOTAL BALANCE" in small uppercase gray text.
2. THE App SHALL compute the balance as the arithmetic sum of the `amount` field of every transaction in the `transactions` array.
3. THE App SHALL format the balance as a dollar string with 2 decimal places and thousand separators (e.g. `$3.56`, `$1,234.00`).
4. THE App SHALL display the formatted balance in large bold blue (`#3498db`) text.
5. WHEN a transaction is added or deleted, THE App SHALL update the displayed balance immediately via `render()`.

---

### Requirement 5: Spending by Category Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending per category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL load Chart.js from the CDN `https://cdn.jsdelivr.net/npm/chart.js` and render a pie chart in the "Spending by Category" card.
2. THE App SHALL compute each pie slice as the sum of amounts for all transactions in that category.
3. THE App SHALL assign the following fixed colors: Food → `#2ecc71`, Transport → `#3498db`, Fun → `#e67e22`. Custom categories SHALL receive colors from the palette `["#9b59b6", "#e74c3c", "#f1c40f", "#1abc9c", "#34495e"]` in order of creation.
4. THE Chart SHALL display a legend below the pie and a tooltip showing the category name and total amount when hovered.
5. WHEN a transaction is added or deleted, THE App SHALL update the Chart by destroying the existing Chart instance and creating a new one, preventing duplicate canvas instances.
6. WHEN the `transactions` array is empty, THE App SHALL hide the canvas and display the text "Add a transaction to see the chart" in its place.
7. WHEN the Theme changes, THE App SHALL re-render the Chart so that text and legend colors match the active Theme.

---

### Requirement 6: Custom Categories

**User Story:** As a user, I want to add my own spending categories, so that I can organize transactions beyond the defaults.

#### Acceptance Criteria

1. THE App SHALL display a text input and an "+ Add Category" button below the category select dropdown in the Form.
2. WHEN the user submits a new category name, THE Validator SHALL verify that the name is not empty, does not duplicate an existing category name (case-insensitive comparison), and does not exceed 20 characters.
3. IF any validation condition in criterion 2 is not met, THEN THE Validator SHALL display a descriptive inline error message and SHALL NOT add the category.
4. WHEN a valid category name is submitted, THE App SHALL append the name to the `categories` array, save to Local_Storage, add the new option to the category select dropdown immediately, and include the category in the Chart with its assigned color.
5. WHEN a transaction is deleted, THE App SHALL retain all categories in the `categories` array unchanged.

---

### Requirement 7: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by different criteria, so that I can find items more easily.

#### Acceptance Criteria

1. THE App SHALL display a sort dropdown above the transaction list with four options: "Newest first" (default), "Amount: High to Low", "Amount: Low to High", and "Category: A to Z".
2. WHEN the user selects a Sort_Option, THE App SHALL sort a copy of the `transactions` array according to the selected option and display the sorted copy, leaving the original array order unchanged.
3. WHEN the user selects a Sort_Option, THE App SHALL save the selected value to Local_Storage under the key `"ebv_sort"` and call `render()`.
4. WHEN the page loads, THE App SHALL restore the saved Sort_Option from Local_Storage and apply it to the initial render.

---

### Requirement 8: Dark / Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL display a toggle button in the page header (with a sun or moon icon or descriptive text) that switches between light and dark Theme.
2. THE App SHALL implement theming using CSS custom properties on `:root` and a `[data-theme="dark"]` selector override, with no inline styles for color values.
3. WHEN the page loads for the first time with no saved Theme, THE App SHALL apply the Theme that matches the user's `prefers-color-scheme` media query.
4. WHEN the user activates the Theme toggle, THE App SHALL update the `data-theme` attribute on the root element, save the new Theme value to Local_Storage under `"ebv_theme"`, and call `render()` to update Chart colors.
5. WHEN the page loads with a saved Theme value, THE App SHALL apply that Theme regardless of `prefers-color-scheme`.

---

### Requirement 9: Layout, Visual Design, and Responsiveness

**User Story:** As a user, I want a clean, readable layout that works on both desktop and mobile, so that I can track expenses on any device.

#### Acceptance Criteria

1. THE App SHALL display content in this top-to-bottom order: (1) page header with title "Expense & Budget Visualizer" and theme toggle, (2) Total Balance card, (3) Add Transaction card, (4) Transactions card and Spending by Category card side by side.
2. THE App SHALL constrain the main content to a maximum width of approximately 900px, centered on the page, with a light gray page background (`#f9f9f9`).
3. THE App SHALL style each card with a white background, `border-radius: 8px`, and a soft `box-shadow`.
4. WHILE the viewport width is 768px or wider, THE App SHALL display the Transactions card and Spending by Category card side by side in a two-column layout.
5. WHILE the viewport width is below 768px, THE App SHALL stack all cards vertically, with the Transactions card above the Spending by Category card.
6. THE App SHALL ensure all interactive elements (inputs, buttons, select dropdowns) have a minimum height of 44px to meet mobile tap target guidelines.
7. THE App SHALL apply smooth, subtle CSS transitions on hover states and theme changes, with no heavy animations.

---

### Requirement 10: Accessibility and Code Quality

**User Story:** As a developer and user, I want the app to use semantic markup and be accessible, so that it works with assistive technologies and is easy to maintain.

#### Acceptance Criteria

1. THE App SHALL use semantic HTML elements: `<header>`, `<main>`, `<section>`, `<form>`, `<label>`, and `<button>` where appropriate.
2. THE App SHALL associate every `<input>` and `<select>` with a `<label>` using matching `for` and `id` attributes.
3. THE App SHALL give every error message element the attribute `role="alert"` so screen readers announce it.
4. THE App SHALL use a system font stack (e.g. `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) with no external font downloads.
5. THE App SHALL be delivered as exactly three files at the paths `index.html`, `css/style.css`, and `js/app.js`, using relative paths for all asset references, so it loads correctly on GitHub Pages.
6. THE App SHALL load Chart.js and reference all assets using relative or CDN URLs only, with no build tools or package managers required.
