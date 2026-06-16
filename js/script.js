const form = document.getElementById("expenseForm");
const tableBody = document.getElementById("expenseTableBody");
const totalElement = document.getElementById("total");
const monthTotalElement = document.getElementById("monthTotal");
const remainingBudgetElement = document.getElementById("remainingBudget");
const averageExpenseElement = document.getElementById("averageExpense");
const expenseCountElement = document.getElementById("expenseCount");
const filterCategory = document.getElementById("filterCategory");
const searchInput = document.getElementById("searchInput");
const monthFilter = document.getElementById("monthFilter");
const sortSelect = document.getElementById("sortSelect");
const categoryTotals = document.getElementById("categoryTotals");
const recentList = document.getElementById("recentList");
const emptyState = document.getElementById("emptyState");
const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");
const budgetBar = document.getElementById("budgetBar");
const sidebarBudgetBar = document.getElementById("sidebarBudgetBar");
const budgetStatus = document.getElementById("budgetStatus");
const sidebarBudget = document.getElementById("sidebarBudget");
const sidebarBudgetHint = document.getElementById("sidebarBudgetHint");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formModeBadge = document.getElementById("formModeBadge");
const highestExpense = document.getElementById("highestExpense");
const topCategory = document.getElementById("topCategory");
const heroTotal = document.getElementById("heroTotal");
const heroTopCategory = document.getElementById("heroTopCategory");
const heroBudgetHealth = document.getElementById("heroBudgetHealth");

const today = new Date();
const currentMonth = today.toISOString().slice(0, 7);
const categories = ["Food", "Transport", "Utilities", "Entertainment", "Shopping", "Health", "Education", "Travel", "Other"];

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 120000;
let editId = null;

document.getElementById("date").valueAsDate = today;
monthFilter.value = currentMonth;
budgetInput.value = monthlyBudget;

form.addEventListener("submit", handleSubmit);
cancelEditBtn.addEventListener("click", resetForm);
filterCategory.addEventListener("change", render);
searchInput.addEventListener("input", render);
monthFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);
saveBudgetBtn.addEventListener("click", saveBudget);
document.getElementById("exportBtn").addEventListener("click", exportCsv);
document.getElementById("clearBtn").addEventListener("click", clearExpenses);
document.getElementById("seedDemoBtn").addEventListener("click", loadDemoData);

function handleSubmit(event) {
  event.preventDefault();

  const expense = {
    id: editId || createId(),
    title: document.getElementById("title").value.trim(),
    amount: Number(document.getElementById("amount").value),
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
    payment: document.getElementById("payment").value,
    note: document.getElementById("note").value.trim()
  };

  if (!validateExpense(expense)) return;

  if (editId) {
    expenses = expenses.map((item) => item.id === editId ? expense : item);
  } else {
    expenses.push(expense);
  }

  saveExpenses();
  resetForm();
  render();
}

function validateExpense(expense) {
  clearErrors();
  let valid = true;

  if (!expense.title) {
    setError("titleError", "Title required");
    valid = false;
  }

  if (!expense.amount || expense.amount <= 0) {
    setError("amountError", "Enter an amount greater than 0");
    valid = false;
  }

  if (!expense.category) {
    setError("categoryError", "Select category");
    valid = false;
  }

  if (!expense.date) {
    setError("dateError", "Select date");
    valid = false;
  }

  return valid;
}

function clearErrors() {
  ["titleError", "amountError", "categoryError", "dateError"].forEach((id) => {
    document.getElementById(id).textContent = "";
  });
}

function setError(id, message) {
  document.getElementById(id).textContent = message;
}

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function saveBudget() {
  monthlyBudget = Math.max(0, Number(budgetInput.value) || 0);
  localStorage.setItem("monthlyBudget", monthlyBudget);
  render();
}

function resetForm() {
  form.reset();
  document.getElementById("date").valueAsDate = today;
  editId = null;
  submitBtn.textContent = "Add Expense";
  cancelEditBtn.hidden = true;
  formModeBadge.textContent = "Create";
  clearErrors();
}

function getFilteredExpenses() {
  const query = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const selectedMonth = monthFilter.value;

  return expenses
    .filter((expense) => category === "All" || expense.category === category)
    .filter((expense) => !selectedMonth || expense.date.slice(0, 7) === selectedMonth)
    .filter((expense) => {
      const searchable = `${expense.title} ${expense.note || ""} ${expense.payment}`.toLowerCase();
      return !query || searchable.includes(query);
    })
    .sort(sortExpenses);
}

function sortExpenses(a, b) {
  const sortBy = sortSelect.value;

  if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
  if (sortBy === "amountDesc") return b.amount - a.amount;
  if (sortBy === "amountAsc") return a.amount - b.amount;
  if (sortBy === "titleAsc") return a.title.localeCompare(b.title);
  return new Date(b.date) - new Date(a.date);
}

function render() {
  const filtered = getFilteredExpenses();
  renderTable(filtered);
  renderTotals();
  renderCategoryBreakdown();
  renderRecentList();
}

function renderTable(list) {
  tableBody.innerHTML = "";
  emptyState.hidden = list.length > 0;

  list.forEach((expense) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(expense.date)}</td>
      <td>
        <strong>${escapeHtml(expense.title)}</strong>
        <span>${escapeHtml(expense.note || "No note")}</span>
      </td>
      <td><span class="category-pill ${getCategoryClass(expense.category)}">${expense.category}</span></td>
      <td>${expense.payment}</td>
      <td class="amount-cell">${formatMoney(expense.amount)}</td>
      <td>
        <div class="action-buttons">
          <button class="edit-btn" type="button" data-id="${expense.id}">Edit</button>
          <button class="delete-btn" type="button" data-id="${expense.id}">Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => editExpense(button.dataset.id));
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => deleteExpense(button.dataset.id));
  });
}

function renderTotals() {
  const allTotal = sum(expenses);
  const selectedMonth = monthFilter.value || currentMonth;
  const monthExpenses = expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth);
  const monthTotal = sum(monthExpenses);
  const remaining = monthlyBudget - monthTotal;
  const average = expenses.length ? allTotal / expenses.length : 0;
  const highest = expenses.length ? Math.max(...expenses.map((expense) => expense.amount)) : 0;
  const usage = monthlyBudget ? Math.min((monthTotal / monthlyBudget) * 100, 100) : 0;
  const top = getTopCategory(expenses);

  totalElement.textContent = formatMoney(allTotal);
  heroTotal.textContent = formatMoney(allTotal);
  monthTotalElement.textContent = formatMoney(monthTotal);
  remainingBudgetElement.textContent = formatMoney(Math.max(remaining, 0));
  averageExpenseElement.textContent = formatMoney(average);
  expenseCountElement.textContent = `${expenses.length} transaction${expenses.length === 1 ? "" : "s"}`;
  highestExpense.textContent = formatMoney(highest);
  topCategory.textContent = top.name;
  heroTopCategory.textContent = top.total ? formatMoney(top.total) : "PKR 0";
  heroBudgetHealth.textContent = usage >= 95 ? "Tight" : usage >= 75 ? "Watch" : "Good";

  budgetBar.style.width = `${usage}%`;
  sidebarBudgetBar.style.width = `${usage}%`;
  budgetInput.value = monthlyBudget;
  sidebarBudget.textContent = formatMoney(monthlyBudget);
  sidebarBudgetHint.textContent = `${Math.round(usage)}% used this month`;

  if (!monthlyBudget) {
    budgetStatus.textContent = "Set a monthly budget to start tracking.";
  } else if (remaining >= 0) {
    budgetStatus.textContent = `${formatMoney(remaining)} left for ${formatMonth(selectedMonth)}.`;
  } else {
    budgetStatus.textContent = `${formatMoney(Math.abs(remaining))} over budget for ${formatMonth(selectedMonth)}.`;
  }
}

function renderCategoryBreakdown() {
  const totals = categories
    .map((category) => ({
      name: category,
      total: sum(expenses.filter((expense) => expense.category === category))
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  if (!totals.length) {
    categoryTotals.innerHTML = `<div class="muted-box">Your category chart will appear after you add expenses.</div>`;
    return;
  }

  const max = totals[0].total;
  categoryTotals.innerHTML = totals.map((item) => `
    <div class="category-row">
      <div class="category-label">
        <span class="dot ${getCategoryClass(item.name)}"></span>
        <strong>${item.name}</strong>
        <small>${formatMoney(item.total)}</small>
      </div>
      <div class="bar-track"><span style="width: ${(item.total / max) * 100}%"></span></div>
    </div>
  `).join("");
}

function renderRecentList() {
  const recent = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (!recent.length) {
    recentList.innerHTML = `<div class="muted-box">Recent expenses will appear here.</div>`;
    return;
  }

  recentList.innerHTML = recent.map((expense) => `
    <div class="recent-item">
      <span class="dot ${getCategoryClass(expense.category)}"></span>
      <div>
        <strong>${escapeHtml(expense.title)}</strong>
        <small>${formatDate(expense.date)} - ${expense.category}</small>
      </div>
      <b>${formatMoney(expense.amount)}</b>
    </div>
  `).join("");
}

function editExpense(id) {
  const expense = expenses.find((item) => item.id === id);
  if (!expense) return;

  editId = id;
  document.getElementById("title").value = expense.title;
  document.getElementById("amount").value = expense.amount;
  document.getElementById("category").value = expense.category;
  document.getElementById("date").value = expense.date;
  document.getElementById("payment").value = expense.payment;
  document.getElementById("note").value = expense.note || "";
  submitBtn.textContent = "Update Expense";
  cancelEditBtn.hidden = false;
  formModeBadge.textContent = "Editing";
  document.getElementById("add-expense").scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveExpenses();
  render();
}

function clearExpenses() {
  if (!expenses.length) return;
  const confirmed = confirm("Clear all saved expenses?");
  if (!confirmed) return;
  expenses = [];
  saveExpenses();
  resetForm();
  render();
}

function exportCsv() {
  if (!expenses.length) return;

  const headers = ["Date", "Title", "Category", "Payment", "Amount", "Note"];
  const rows = expenses.map((expense) => [
    expense.date,
    expense.title,
    expense.category,
    expense.payment,
    expense.amount,
    expense.note || ""
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `spendwise-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function loadDemoData() {
  const demo = [
    ["Groceries", 9200, "Food", "Debit Card", "Weekly kitchen restock", 2],
    ["Fuel", 6500, "Transport", "Cash", "Car refill", 4],
    ["Internet bill", 4800, "Utilities", "Bank Transfer", "Monthly fiber payment", 7],
    ["Movie night", 3600, "Entertainment", "Wallet", "Tickets and snacks", 9],
    ["Running shoes", 14500, "Shopping", "Credit Card", "Fitness gear", 12],
    ["Clinic visit", 3000, "Health", "Cash", "Consultation", 15],
    ["Online course", 12500, "Education", "Debit Card", "Design course", 18],
    ["Weekend trip", 22500, "Travel", "Bank Transfer", "Murree stay", 21]
  ];

  expenses = demo.map(([title, amount, category, payment, note, daysAgo]) => {
    const date = new Date();
    date.setDate(today.getDate() - daysAgo);
    return {
      id: createId(),
      title,
      amount,
      category,
      payment,
      note,
      date: date.toISOString().slice(0, 10)
    };
  });

  saveExpenses();
  render();
}

function sum(list) {
  return list.reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

function getTopCategory(list) {
  const totals = {};
  list.forEach((expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
  });

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  return top ? { name: top[0], total: top[1] } : { name: "None", total: 0 };
}

function getCategoryClass(category) {
  return category.toLowerCase().replace(/\s+/g, "-");
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `expense-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatMoney(amount) {
  return `PKR ${Math.round(amount).toLocaleString()}`;
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateString));
}

function formatMonth(monthString) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${monthString}-01`));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

expenses = expenses.map((expense) => ({
  id: expense.id || createId(),
  title: expense.title,
  amount: Number(expense.amount),
  category: expense.category || "Other",
  date: expense.date || today.toISOString().slice(0, 10),
  payment: expense.payment || "Cash",
  note: expense.note || ""
}));

saveExpenses();
render();
