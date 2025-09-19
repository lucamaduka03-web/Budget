document.addEventListener("DOMContentLoaded", function () {
  // Category colors
 const CATEGORY_COLORS = [
    '#e74c3c', // red
    '#27ae60', // green
    '#f1c40f', // yellow
    '#6aa8ff', // blue
    '#8e44ad', // purple
    '#ff9800', // orange
    '#00bcd4', // teal
    '#cddc39', // lime
    '#ff4081', // pink
    '#34495e', // dark blue
    '#7f8c8d', // gray
  ];

  // Month navigation
  const monthLabel = document.getElementById("report-month-label");
  const prevBtn = document.getElementById("report-prev-btn");
  const nextBtn = document.getElementById("report-next-btn");

  // Tabs and content
  const tabButtons = document.querySelectorAll(".report-tab-btn");
  const reportList = document.getElementById("report-list");
  const reportSummary = document.getElementById("report-summary");
  const ctx = document.getElementById("report-chart").getContext("2d");
  let chart;

  // State
  let currentDate = new Date();
  let currentType = "expense";

  function getTransactions() {
    return JSON.parse(localStorage.getItem("transactions") || "[]");
  }

  function formatMonthYear(date) {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  }

  function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function renderReport(type, date) {
    // Set month label
    monthLabel.textContent = formatMonthYear(date);

    // Filter transactions by type and month
    const monthKey = getMonthKey(date);
    const transactions = getTransactions().filter(
      tx => tx.type === type && tx.date && tx.date.startsWith(monthKey)
    );

    if (transactions.length === 0) {
      reportList.innerHTML = `<li>No ${type} records for this month.</li>`;
      reportSummary.innerHTML = '';
      if (chart) chart.destroy();
      return;
    }

    // Group by category
    const categoryTotals = {};
    transactions.forEach((tx) => {
      if (!categoryTotals[tx.category]) categoryTotals[tx.category] = 0;
      categoryTotals[tx.category] += parseFloat(tx.amount) || 0;
    });

    // Sort categories by amount (descending)
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    // Find max value for bar scaling
    const maxValue = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

    // Find category with max total
    let maxCategory = '';
    let maxCatValue = 0;
    if (sortedCategories.length > 0) {
      maxCategory = sortedCategories[0][0];
      maxCatValue = sortedCategories[0][1];
    }

    // Render summary
    reportSummary.innerHTML = `
      <div class="summary-label">
        Most ${type === 'expense' ? 'Spent' : 'Received'}:
      </div>
      <div class="summary-category">${maxCategory}</div>
      <div class="summary-amount" style="color:${type === 'expense' ? '#e74c3c' : '#27ae60'};">
        $${maxCatValue.toFixed(2)}
      </div>
    `;

    // Render grouped category list with bars and colors
    reportList.innerHTML = `<ul class="category-list"></ul>`;
    const catList = reportList.querySelector('.category-list');
    sortedCategories.forEach(([cat, amt], idx) => {
      const percent = maxValue ? (amt / maxValue) * 100 : 0;
      const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
      const li = document.createElement('li');
      li.className = `category-row ${type}`;
      li.innerHTML = `
        <span class="category-label" style="color:${color};">${cat}</span>
        <div class="category-bar-container">
          <div class="category-bar" style="width:${percent}%;background:${color};"></div>
        </div>
        <span class="category-amount" style="color:${color};">$${amt.toFixed(2)}</span>
      `;
      catList.appendChild(li);
    });

    // Pie chart with same colors
    const data = {
      labels: sortedCategories.map(([cat]) => cat),
      datasets: [{
        data: sortedCategories.map(([_, amt]) => amt),
        backgroundColor: sortedCategories.map((_, idx) => CATEGORY_COLORS[idx % CATEGORY_COLORS.length]),
      }]
    };
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // Tab switching
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      renderReport(currentType, currentDate);
    });
  });

  // Month navigation
  prevBtn.addEventListener('click', function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderReport(currentType, currentDate);
  });
  nextBtn.addEventListener('click', function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderReport(currentType, currentDate);
  });

  // Initial render
  renderReport(currentType, currentDate);
});