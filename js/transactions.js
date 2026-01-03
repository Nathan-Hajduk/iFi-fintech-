/**
 * Transactions Page - Expense & Income Tracking
 * Senior Developer Implementation for iFi Fintech
 */

// Initialize data
let transactions = JSON.parse(localStorage.getItem('ifi_transactions')) || [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadOnboardingTransactions();
});

async function loadOnboardingTransactions() {
    try {
        const expenses = await onboardingDataService.getExpenses();
        const subscriptions = await onboardingDataService.getSubscriptions();
        const income = await onboardingDataService.getMonthlyIncome();
        
        displayExpenseSummary(expenses, subscriptions, income);
    } catch (error) {
        console.error('❌ Error loading transaction data:', error);
    }
}

function displayExpenseSummary(expenses, subscriptions, income) {
    const container = document.querySelector('.summary-cards') || document.querySelector('main');
    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const subTotal = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.cost) || 0), 0);
    
    const summaryHTML = `
        <div class="expense-summary-section">
            <h2>💳 Monthly Financial Overview</h2>
            <div class="overview-metrics">
                <div class="metric-card income">
                    <div class="metric-icon">💵</div>
                    <div class="metric-value">$${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">Monthly Income</div>
                </div>
                <div class="metric-card expenses">
                    <div class="metric-icon">🛒</div>
                    <div class="metric-value">$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">Total Expenses</div>
                </div>
                <div class="metric-card subscriptions">
                    <div class="metric-icon">🔄</div>
                    <div class="metric-value">$${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">Subscriptions</div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('afterbegin', summaryHTML);
}

// DOM Elements
const modal = document.getElementById('transactionModal');
const addBtn = document.getElementById('addTransactionBtn');
const closeBtn = document.querySelector('.modal-close');
const form = document.getElementById('transactionForm');
const searchInput = document.getElementById('searchTransaction');
const categoryFilter = document.getElementById('categoryFilter');
const typeFilter = document.getElementById('typeFilter');
const periodFilter = document.getElementById('periodFilter');
const transactionsGrid = document.getElementById('transactionsGrid');
const transactionCount = document.getElementById('transactionCount');

// Modal Controls
addBtn.addEventListener('click', () => {
    modal.classList.add('active');
    form.reset();
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Form Submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: document.querySelector('input[name="transactionType"]:checked').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value
    };
    
    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
    updateSummary();
    
    modal.classList.remove('active');
    form.reset();
});

// Search and Filter
searchInput.addEventListener('input', renderTransactions);
categoryFilter.addEventListener('change', renderTransactions);
typeFilter.addEventListener('change', renderTransactions);
periodFilter.addEventListener('change', renderTransactions);

// Save to localStorage
function saveTransactions() {
    localStorage.setItem('ifi_transactions', JSON.stringify(transactions));
}

// Filter transactions
function getFilteredTransactions() {
    let filtered = [...transactions];
    
    // Search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(searchTerm) ||
            t.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Category filter
    const category = categoryFilter.value;
    if (category !== 'all') {
        filtered = filtered.filter(t => t.category === category);
    }
    
    // Type filter
    const type = typeFilter.value;
    if (type !== 'all') {
        filtered = filtered.filter(t => t.type === type);
    }
    
    // Period filter
    const period = periodFilter.value;
    const now = new Date();
    if (period !== 'all') {
        filtered = filtered.filter(t => {
            const transactionDate = new Date(t.date);
            const daysDiff = Math.floor((now - transactionDate) / (1000 * 60 * 60 * 24));
            
            switch(period) {
                case 'today': return daysDiff === 0;
                case 'week': return daysDiff <= 7;
                case 'month': return daysDiff <= 30;
                case 'year': return daysDiff <= 365;
                default: return true;
            }
        });
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Render transactions
function renderTransactions() {
    const filtered = getFilteredTransactions();
    transactionCount.textContent = `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`;
    
    if (filtered.length === 0) {
        transactionsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }
    
    transactionsGrid.innerHTML = filtered.map(t => `
        <div class="transaction-item">
            <div class="transaction-icon ${t.type}">
                <i class="fas fa-${t.type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-description">${t.description}</div>
                <div class="transaction-category">${t.category}</div>
            </div>
            <div class="transaction-date">${formatDate(t.date)}</div>
            <div class="transaction-amount ${t.type}">
                ${t.type === 'income' ? '+' : '-'}$${t.amount.toFixed(2)}
            </div>
            <div class="transaction-actions">
                <button class="btn-action" onclick="editTransaction(${t.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" onclick="deleteTransaction(${t.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Update summary cards
function updateSummary() {
    const period = periodFilter.value;
    const filtered = getFilteredTransactions();
    
    const income = filtered
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filtered
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    document.getElementById('totalIncome').textContent = `$${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${expenses.toFixed(2)}`;
    document.getElementById('netCashFlow').textContent = `$${balance.toFixed(2)}`;
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        renderTransactions();
        updateSummary();
    }
}

// Edit transaction (simplified - reuses add modal)
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Populate form
    document.querySelector(`input[value="${transaction.type}"]`).checked = true;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('date').value = transaction.date;
    document.getElementById('description').value = transaction.description;
    document.getElementById('category').value = transaction.category;
    
    // Delete old and add updated on save
    deleteTransaction(id);
    
    modal.classList.add('active');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Initialize page
function init() {
    renderTransactions();
    updateSummary();
    
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
