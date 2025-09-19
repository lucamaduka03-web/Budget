document.addEventListener("DOMContentLoaded", function () {
  // --- Home Page Logic (index.html) ---
  const transactionList = document.getElementById("transaction-list");
  const expenseTotal = document.getElementById("expense-total");
  const incomeTotal = document.getElementById("income-total");
  const balance = document.getElementById("balance");
  const walletDate = document.getElementById("wallet-date");
  const prevBtn = document.getElementById("previous-btn");
  const nextBtn = document.getElementById("next-btn");

  function getTransactions() {
    return JSON.parse(localStorage.getItem("transactions") || "[]");
  }

  // Helper: format month/year for display
  function formatMonthYear(date) {
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  }

  // Helper: get YYYY-MM from Date
  function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  // State: currently displayed month
  let currentDate = new Date();

  // Render transactions for the current month
  function renderTransactionsForMonth(date) {
    if (!transactionList || !expenseTotal || !incomeTotal || !balance || !walletDate) return;

    // Set header date
    if (walletDate.querySelector("span")) {
      walletDate.querySelector("span").textContent = formatMonthYear(date);
    }

    const monthKey = getMonthKey(date);
    const transactions = getTransactions().filter(tx => {
      if (!tx.date) return false;
      return tx.date.startsWith(monthKey);
    });

    let totalExpense = 0;
    let totalIncome = 0;

    if (transactions.length === 0) {
      transactionList.innerHTML = "<li>No transactions for this month.</li>";
      expenseTotal.textContent = "$0.00";
      incomeTotal.textContent = "$0.00";
      balance.textContent = "$0.00";
      return;
    }

    transactionList.innerHTML = "";
    transactions.forEach(function (tx, idx) {
      const li = document.createElement("li");
      li.className = "transaction-item";
      li.innerHTML = `
        <div class="transaction-main">
          <span class="transaction-type ${tx.type}">${tx.type === "expense" ? "−" : "+"}</span>
          <span class="transaction-amount">${tx.type === "expense" ? "-" : "+"}$${parseFloat(tx.amount).toFixed(2)}</span>
          <span class="transaction-category">${tx.category}</span>
          <span class="transaction-date">${tx.date ? tx.date : ""}</span>
          <span class="transaction-note">${tx.note ? tx.note : ""}</span>
        </div>
        <div class="transaction-actions">
          <button class="edit-btn" data-idx="${idx}" title="Edit">&#9998;</button>
          <button class="delete-btn" data-idx="${idx}" title="Delete">&#128465;</button>
        </div>
      `;
      transactionList.appendChild(li);

      if (tx.type === "expense") {
        totalExpense += parseFloat(tx.amount) || 0;
      } else if (tx.type === "income") {
        totalIncome += parseFloat(tx.amount) || 0;
      }
    });

    expenseTotal.textContent = `-$${totalExpense.toFixed(2)}`;
    incomeTotal.textContent = `+$${totalIncome.toFixed(2)}`;
    balance.textContent = `$${(totalIncome - totalExpense).toFixed(2)}`;

    // Add event listeners for delete and edit
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        deleteTransaction(idx, monthKey);
      });
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-idx'));
        editTransaction(idx, monthKey);
      });
    });
  }

  // Helper: delete transaction
  function deleteTransaction(idx, monthKey) {
    let allTransactions = getTransactions();
    // Find the index in allTransactions for the given month
    let monthTransactions = allTransactions.filter(tx => tx.date && tx.date.startsWith(monthKey));
    const txToDelete = monthTransactions[idx];
    const globalIdx = allTransactions.findIndex(tx =>
      tx.type === txToDelete.type &&
      tx.amount === txToDelete.amount &&
      tx.category === txToDelete.category &&
      tx.date === txToDelete.date &&
      tx.note === txToDelete.note
    );
    if (globalIdx > -1) {
      allTransactions.splice(globalIdx, 1);
      localStorage.setItem("transactions", JSON.stringify(allTransactions));
      renderTransactionsForMonth(currentDate);
    }
  }

  // Helper: edit transaction (redirect to add page with query params)
  function editTransaction(idx, monthKey) {
    let allTransactions = getTransactions();
    let monthTransactions = allTransactions.filter(tx => tx.date && tx.date.startsWith(monthKey));
    const txToEdit = monthTransactions[idx];
    // Pass transaction data via query string for editing
    const params = new URLSearchParams(txToEdit).toString();
    window.location.href = `index1.html?edit=1&${params}`;
  }

  // Month navigation
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderTransactionsForMonth(currentDate);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderTransactionsForMonth(currentDate);
    });
  }

  // Initial render
  renderTransactionsForMonth(currentDate);
  // --- Add Transaction Page Logic (index1.html) ---
const expenseTab = document.querySelector(".expense-tab");
const incomeTab = document.querySelector(".income-tab");
const expenseForm = document.getElementById("expense-form");
const incomeForm = document.getElementById("income-form");
const cancelButtons = document.querySelectorAll(".cancel-button");

// Tab switching logic
if (expenseTab && incomeTab && expenseForm && incomeForm) {
  expenseTab.addEventListener("click", function () {
    expenseTab.classList.add("active");
    incomeTab.classList.remove("active");
    expenseForm.classList.remove("hidden");
    incomeForm.classList.add("hidden");
  });

  incomeTab.addEventListener("click", function () {
    incomeTab.classList.add("active");
    expenseTab.classList.remove("active");
    incomeForm.classList.remove("hidden");
    expenseForm.classList.add("hidden");
  });

  // Save Expense
  expenseForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const amount = document.getElementById("expense-input-amount").value;
    const category = document.getElementById("expense-category").value;
    const date = document.getElementById("expense-date").value;
    const note = document.getElementById("expense-note").value;
    const transaction = { type: "expense", amount, category, date, note };
    saveTransaction(transaction);
    window.location.href = "index.html";
  });

  // Save Income
  incomeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const amount = document.getElementById("income-input-amount").value;
    const category = document.getElementById("income-category").value;
    const date = document.getElementById("income-date").value;
    const note = document.getElementById("income-note").value;
    const transaction = { type: "income", amount, category, date, note };
    saveTransaction(transaction);
    window.location.href = "index.html";
  });
}

// Cancel button logic
if (cancelButtons.length > 0) {
  cancelButtons.forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (expenseForm) expenseForm.reset();
      if (incomeForm) incomeForm.reset();
      window.location.href = "index.html";
    });
  });
}

// Helper function for saving
function saveTransaction(transaction) {
  let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
}
});