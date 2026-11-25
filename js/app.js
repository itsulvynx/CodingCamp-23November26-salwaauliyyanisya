/* Expense & Budget Visualizer — application logic (populated in Tasks 3–9) */

// ── 1. STATE ──────────────────────────────────────────────────────

let transactions  = [];
let categories    = [];
let currentTheme  = "light";
let currentSort   = "newest";
let chartInstance = null;

// ── 2. PERSISTENCE (localStorage read / write) ────────────────────

/**
 * Detects the operating-system colour-scheme preference.
 * @returns {"dark"|"light"} The preferred theme.
 */
function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Loads persisted application state from localStorage.
 * All four reads are wrapped in a single try/catch so that any
 * JSON parse error or missing-key scenario silently falls back to
 * safe, known defaults rather than crashing the app.
 */
function loadState() {
  try {
    transactions = JSON.parse(localStorage.getItem("ebv_transactions")) || [];
    categories   = JSON.parse(localStorage.getItem("ebv_categories"))   || ["Food", "Transport", "Fun"];
    currentTheme = localStorage.getItem("ebv_theme") || getSystemTheme();
    currentSort  = localStorage.getItem("ebv_sort")  || "newest";
  } catch (_) {
    transactions = [];
    categories   = ["Food", "Transport", "Fun"];
    currentTheme = getSystemTheme();
    currentSort  = "newest";
  }
}

/**
 * Persists the current application state to localStorage so it
 * survives page refreshes and browser restarts.
 */
function saveState() {
  localStorage.setItem("ebv_transactions", JSON.stringify(transactions));
  localStorage.setItem("ebv_categories",   JSON.stringify(categories));
  localStorage.setItem("ebv_theme",        currentTheme);
  localStorage.setItem("ebv_sort",         currentSort);
}

// ── 3. UTILITIES (pure functions: format, sort, validate, colors) ──

/**
 * Computes the total balance as the sum of all transaction amounts.
 * @param {Array} arr - Array of transaction objects
 * @returns {number} Total sum of amounts
 */
function computeBalance(arr) {
  return arr.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Formats a number as a dollar currency string with 2 decimal places
 * and thousand separators (e.g. "$1,234.56").
 * @param {number} n - The number to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Returns a sorted copy of the transactions array based on the given option.
 * Does not mutate the original array.
 * @param {Array} arr - Array of transaction objects
 * @param {string} option - Sort option: "newest", "amount-desc", "amount-asc", "category-az"
 * @returns {Array} New sorted array
 */
function sortTransactions(arr, option) {
  const copy = [...arr];
  if (option === "newest") {
    copy.sort((a, b) => Number(b.id) - Number(a.id));
  } else if (option === "amount-desc") {
    copy.sort((a, b) => b.amount - a.amount);
  } else if (option === "amount-asc") {
    copy.sort((a, b) => a.amount - b.amount);
  } else if (option === "category-az") {
    copy.sort((a, b) => a.category.localeCompare(b.category));
  }
  return copy;
}

/** Fixed colors for default categories */
const FIXED_COLORS = {
  Food:      "#2ecc71",
  Transport: "#3498db",
  Fun:       "#e67e22"
};

/** Palette for custom categories, assigned in order of creation */
const CUSTOM_PALETTE = [
  "#9b59b6", "#e74c3c", "#f1c40f", "#1abc9c", "#34495e"
];

/**
 * Returns the display color for a category.
 * Fixed categories always get their designated color.
 * Custom categories get a palette color by their index among custom categories.
 * @param {string} name - Category name
 * @param {string[]} categories - Full categories array
 * @returns {string} Hex color string
 */
function getCategoryColor(name, categories) {
  if (FIXED_COLORS[name]) return FIXED_COLORS[name];
  const customCategories = categories.filter(c => !FIXED_COLORS[c]);
  const index = customCategories.indexOf(name);
  return CUSTOM_PALETTE[index % CUSTOM_PALETTE.length] || CUSTOM_PALETTE[0];
}

/**
 * Aggregates transaction amounts by category.
 * @param {Array} arr - Array of transaction objects
 * @returns {Object} Map of { categoryName: totalAmount }
 */
function computeCategoryTotals(arr) {
  return arr.reduce((totals, t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
    return totals;
  }, {});
}

/**
 * Validates the transaction form inputs.
 * @param {string} name - Item name input value
 * @param {string|number} amount - Amount input value
 * @param {string} category - Selected category value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateTransaction(name, amount, category) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Please enter an item name." };
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: "Please enter a positive amount." };
  }
  if (!category || category.trim().length === 0) {
    return { valid: false, error: "Please select a category." };
  }
  return { valid: true };
}

/**
 * Validates a new custom category name.
 * @param {string} name - Proposed category name
 * @param {string[]} existing - Current categories array
 * @returns {{ valid: boolean, error?: string }}
 */
function validateCategory(name, existing) {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Please enter a category name." };
  }
  if (name.trim().length > 20) {
    return { valid: false, error: "Category name must be 20 characters or fewer." };
  }
  const lowerName = name.trim().toLowerCase();
  const isDuplicate = existing.some(c => c.toLowerCase() === lowerName);
  if (isDuplicate) {
    return { valid: false, error: "That category already exists." };
  }
  return { valid: true };
}

// ── STATE MUTATIONS ───────────────────────────────────────────────

/**
 * Adds a new transaction to the transactions array, saves state, and re-renders.
 * @param {string} name - Trimmed item name
 * @param {number} amount - Positive amount
 * @param {string} category - Category name
 */
function addTransaction(name, amount, category) {
  const transaction = {
    id: Date.now().toString(),
    name: name.trim(),
    amount: parseFloat(amount),
    category: category,
    createdAt: new Date().toISOString()
  };
  transactions.push(transaction);
  saveState();
  render();
}

/**
 * Removes the transaction with the given id from the array, saves, and re-renders.
 * @param {string} id - Transaction id to remove
 */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveState();
  render();
}

/**
 * Adds a new custom category, saves state, and re-renders.
 * @param {string} name - Trimmed category name to add
 */
function addCategory(name) {
  categories.push(name.trim());
  saveState();
  render();
}

/**
 * Updates the sort option, saves state, and re-renders.
 * @param {string} value - Sort option value
 */
function setSortOption(value) {
  currentSort = value;
  saveState();
  render();
}

/**
 * Updates the theme, sets the data-theme attribute on the body,
 * saves state, and re-renders (so chart colors update).
 * @param {string} value - "light" or "dark"
 */
function setTheme(value) {
  currentTheme = value;
  document.body.setAttribute("data-theme", value);
  saveState();
  render();
}

// ── 4. RENDER (DOM reconciliation) ────────────────────────────────

/**
 * Re-renders the total balance card using the current transactions array.
 */
function renderBalance() {
  const balance = computeBalance(transactions);
  const display = document.getElementById("balance-display");
  display.textContent = formatCurrency(balance);
}

/**
 * Repopulates the category select dropdown from the categories array.
 * Uses textContent (not innerHTML) to avoid XSS.
 */
function renderCategorySelect() {
  const select = document.getElementById("category-select");
  // Remember currently selected value to preserve selection if possible
  const currentValue = select.value;
  // Clear existing options
  select.innerHTML = "";
  // Rebuild from categories array
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
  // Restore previous selection if it still exists
  if (currentValue && categories.includes(currentValue)) {
    select.value = currentValue;
  }
}

/**
 * Renders the transaction list using the current sort option.
 * Uses textContent for all user data to prevent XSS.
 */
function renderList() {
  const list = document.getElementById("transaction-list");
  // Clear the list
  list.innerHTML = "";

  // Sort a copy — never mutate the original array
  const sorted = sortTransactions(transactions, currentSort);

  if (sorted.length === 0) {
    // Empty state
    const li = document.createElement("li");
    li.className = "transaction-empty";
    li.textContent = "No transactions yet";
    list.appendChild(li);
    return;
  }

  sorted.forEach(transaction => {
    const li = document.createElement("li");
    li.className = "transaction-item";

    // Left side: info
    const info = document.createElement("div");
    info.className = "transaction-info";

    const name = document.createElement("p");
    name.className = "transaction-name";
    name.textContent = transaction.name;

    const amount = document.createElement("p");
    amount.className = "transaction-amount";
    amount.textContent = formatCurrency(transaction.amount);

    const badge = document.createElement("span");
    badge.className = "category-badge";
    badge.textContent = transaction.category;

    info.appendChild(name);
    info.appendChild(amount);
    info.appendChild(badge);

    // Right side: delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", "Delete transaction: " + transaction.name);
    deleteBtn.setAttribute("data-id", transaction.id);

    li.appendChild(info);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

/**
 * Renders the pie chart using Chart.js.
 * Destroys any existing chart instance first to prevent duplicate canvas errors.
 * Shows an empty-state message if there are no transactions.
 */
function renderChart() {
  const canvas = document.getElementById("spending-chart");
  const emptyMsg = document.getElementById("chart-empty");

  // Empty state: no transactions
  if (transactions.length === 0) {
    canvas.classList.add("hidden");
    emptyMsg.classList.remove("hidden");
    // Destroy existing chart if any
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  // Show canvas, hide empty message
  canvas.classList.remove("hidden");
  emptyMsg.classList.add("hidden");

  // Destroy previous chart instance to avoid "Canvas already in use" error
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Compute totals per category
  const totals = computeCategoryTotals(transactions);
  const labels = Object.keys(totals);
  const data = labels.map(cat => totals[cat]);
  const colors = labels.map(cat => getCategoryColor(cat, categories));

  // Determine chart text color based on current theme
  const textColor = currentTheme === "dark" ? "#e0e0e0" : "#333333";

  // Create new Chart.js pie chart
  chartInstance = new Chart(canvas, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: currentTheme === "dark" ? "#16213e" : "#ffffff"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textColor,
            padding: 16,
            font: { size: 13 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || "";
              const value = context.parsed;
              return label + ": " + formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

/**
 * Main render function — synchronizes the entire DOM with the current state.
 * Called after every state mutation.
 */
function render() {
  renderBalance();
  renderCategorySelect();
  renderList();
  renderChart();
}

// ── 5. EVENT HANDLERS & INIT ──────────────────────────────────────

/**
 * Handles the "Add Transaction" form submission.
 * Validates inputs, shows errors inline, or adds the transaction on success.
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById("item-name");
  const amountInput = document.getElementById("amount");
  const categorySelect = document.getElementById("category-select");
  const formError = document.getElementById("form-error");

  const name = nameInput.value;
  const amount = amountInput.value;
  const category = categorySelect.value;

  const result = validateTransaction(name, amount, category);

  if (!result.valid) {
    // Show error
    formError.textContent = result.error;
    formError.classList.remove("hidden");
    return;
  }

  // Hide any previous error
  formError.textContent = "";
  formError.classList.add("hidden");

  // Add the transaction
  addTransaction(name, parseFloat(amount), category);

  // Clear the form
  nameInput.value = "";
  amountInput.value = "";
  categorySelect.selectedIndex = 0;

  // Return focus to item name field
  nameInput.focus();
}

// Attach form submit handler
document.getElementById("transaction-form").addEventListener("submit", handleFormSubmit);

/**
 * Handles the "+ Add Category" button click.
 * Validates the new category name and adds it on success.
 */
function handleAddCategory() {
  const input = document.getElementById("new-category");
  const categoryError = document.getElementById("category-error");
  const name = input.value;

  const result = validateCategory(name, categories);

  if (!result.valid) {
    categoryError.textContent = result.error;
    categoryError.classList.remove("hidden");
    return;
  }

  // Hide any previous error
  categoryError.textContent = "";
  categoryError.classList.add("hidden");

  // Add the category
  addCategory(name.trim());

  // Clear the input
  input.value = "";
}

// Attach add-category handler
document.getElementById("add-category-btn").addEventListener("click", handleAddCategory);

/**
 * Handles the sort dropdown change event.
 */
function handleSortChange(event) {
  setSortOption(event.target.value);
}

// Attach sort change handler
document.getElementById("sort-select").addEventListener("change", handleSortChange);

/**
 * Updates the theme toggle button label to reflect the current theme.
 * @param {string} theme - "light" or "dark"
 */
function updateThemeToggleLabel(theme) {
  const btn = document.getElementById("theme-toggle");
  if (theme === "dark") {
    btn.textContent = "☀️ Light Mode";
  } else {
    btn.textContent = "🌙 Dark Mode";
  }
}

/**
 * Handles the theme toggle button click.
 * Switches between light and dark themes.
 */
function handleThemeToggle() {
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
  updateThemeToggleLabel(newTheme);
}

// Attach theme toggle handler
document.getElementById("theme-toggle").addEventListener("click", handleThemeToggle);

/**
 * Handles delete button clicks via event delegation on the transaction list.
 * Checks if the click target is a delete button and reads its data-id attribute.
 */
function handleListClick(event) {
  const btn = event.target.closest(".delete-btn");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  if (id) {
    deleteTransaction(id);
  }
}

// Attach delete handler via event delegation on the list
document.getElementById("transaction-list").addEventListener("click", handleListClick);

/**
 * Initializes the application:
 * 1. Loads state from localStorage
 * 2. Applies the saved theme
 * 3. Restores the saved sort option in the dropdown
 * 4. Calls render() for the initial UI render
 */
function init() {
  // Load persisted state
  loadState();

  // Apply saved theme and update button label
  setTheme(currentTheme);
  updateThemeToggleLabel(currentTheme);

  // Restore saved sort option in the dropdown
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.value = currentSort;
  }

  // Initial render
  render();
}


// ── ERROR AUTO-CLEAR LISTENERS ────────────────────────────────────

// Clear the category error as soon as the user starts typing in the category input.
document.getElementById("new-category").addEventListener("input", function () {
  const categoryError = document.getElementById("category-error");
  categoryError.textContent = "";
  categoryError.classList.add("hidden");
});

// Clear the transaction form error as soon as the user edits any form field.
["item-name", "amount", "category-select"].forEach(function (id) {
  const eventType = id === "category-select" ? "change" : "input";
  document.getElementById(id).addEventListener(eventType, function () {
    const formError = document.getElementById("form-error");
    formError.textContent = "";
    formError.classList.add("hidden");
  });
});

// Start the app
init();
