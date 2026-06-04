const form = document.getElementById("expenseForm");
const tableBody = document.getElementById("expenseTableBody");
const totalElement = document.getElementById("total");
const filterCategory = document.getElementById("filterCategory");

let expenses = [];
let total = 0;

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;

    document.getElementById("titleError").textContent = "";
    document.getElementById("amountError").textContent = "";
    document.getElementById("categoryError").textContent = "";

    let valid = true;

    if (title === "") {
        document.getElementById("titleError").textContent =
            "Title is required";
        valid = false;
    }

    if (amount === "" || amount <= 0) {
        document.getElementById("amountError").textContent =
            "Enter a positive amount";
        valid = false;
    }

    if (category === "") {
        document.getElementById("categoryError").textContent =
            "Please select a category";
        valid = false;
    }

    if (!valid) return;

    const expense = {
        title,
        amount: Number(amount),
        category
    };

    expenses.push(expense);

    renderExpenses();

    form.reset();
});

function renderExpenses() {
    tableBody.innerHTML = "";

    const selectedCategory = filterCategory.value;

    let filteredExpenses = expenses;

    if (selectedCategory !== "All") {
        filteredExpenses = expenses.filter(
            expense => expense.category === selectedCategory
        );
    }

    filteredExpenses.forEach((expense, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${expense.title}</td>
            <td>PKR ${expense.amount.toLocaleString()}</td>
            <td>${expense.category}</td>
            <td>
                <button class="delete-btn" onclick="deleteExpense(${expenses.indexOf(expense)})">
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    totalElement.textContent = `PKR ${total.toLocaleString()}`;
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    renderExpenses();
}

filterCategory.addEventListener("change", renderExpenses);