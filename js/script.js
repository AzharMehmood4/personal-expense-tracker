const form = document.getElementById("expenseForm");
const tableBody = document.getElementById("expenseTableBody");
const totalElement = document.getElementById("total");
const filterCategory = document.getElementById("filterCategory");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editIndex = null;

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;

  document.getElementById("titleError").textContent = "";
  document.getElementById("amountError").textContent = "";
  document.getElementById("categoryError").textContent = "";

  let valid = true;

  if (!title) {
    document.getElementById("titleError").textContent = "Title required";
    valid = false;
  }

  if (!amount || amount <= 0) {
    document.getElementById("amountError").textContent = "Invalid amount";
    valid = false;
  }

  if (!category) {
    document.getElementById("categoryError").textContent = "Select category";
    valid = false;
  }

  if (!valid) return;

  const expense = {
    title,
    amount: Number(amount),
    category
  };

  if (editIndex === null) {
    expenses.push(expense);
  } else {
    expenses[editIndex] = expense;
    editIndex = null;
    form.querySelector("button").textContent = "Add Expense";
  }

  save();
  form.reset();
  render();
});

function save() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function render() {
  tableBody.innerHTML = "";

  let selected = filterCategory.value;

  let list = selected === "All"
    ? expenses
    : expenses.filter(e => e.category === selected);

  list.forEach((e) => {
    const index = expenses.indexOf(e);

    tableBody.innerHTML += `
      <tr>
        <td>${e.title}</td>
        <td>PKR ${e.amount.toLocaleString()}</td>
        <td>${e.category}</td>
        <td>
         <div class="action-buttons">
           <button class="edit-btn" onclick="editExpense(${index})">
            Edit
           </button>

           <button class="delete-btn" onclick="deleteExpense(${index})">
           Delete
           </button>
         </div>
        </td>
      </tr>
    `;
  });

  let total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalElement.innerText = `PKR ${total.toLocaleString()}`;

  categorySummary();
}

function deleteExpense(i) {
  expenses.splice(i, 1);
  save();
  render();
}

function editExpense(i) {
  let e = expenses[i];

  document.getElementById("title").value = e.title;
  document.getElementById("amount").value = e.amount;
  document.getElementById("category").value = e.category;

  editIndex = i;
  form.querySelector("button").textContent = "Update Expense";
}

filterCategory.addEventListener("change", render);

document.getElementById("sortAsc").onclick = () => {
  expenses.sort((a,b)=>a.amount-b.amount);
  save(); render();
};

document.getElementById("sortDesc").onclick = () => {
  expenses.sort((a,b)=>b.amount-a.amount);
  save(); render();
};

function categorySummary() {
  let totals = {};

  expenses.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });

  let html = "<h3>Category Summary</h3>";

  for (let c in totals) {
    html += `<p>${c}: PKR ${totals[c].toLocaleString()}</p>`;
  }

  document.getElementById("categoryTotals").innerHTML = html;
}

render();