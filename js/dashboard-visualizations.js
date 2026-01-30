/* ============================================
   iFi Dashboard - Animated Visualizations
   Billion-dollar fintech-grade UI components
============================================ */

// =============================
// API Base URL (update as needed)
const API_URL = 'http://localhost:3000';
// =============================
// Expense category icons mapping
// Add subscription to dashboard-selected list (global for HTML event handlers)
function addDashboardSubscription(name, cost) {
    // Prevent duplicates
    if (!dashboardSelectedSubscriptions.some(sub => sub.name === name)) {
        dashboardSelectedSubscriptions.push({ name, cost });
        updateDashboardSubscriptionList();
        // Hide and clear the search results so user must re-enter text to see more
        try {
            const searchInput = document.getElementById('dashboard-subscription-search');
            const resultsContainer = document.getElementById('dashboard-subscription-results');
            if (resultsContainer) resultsContainer.style.display = 'none';
            if (searchInput) {
                searchInput.value = '';
                // Return focus so user can type again if desired
                searchInput.focus();
            }
        } catch (e) {
            // ignore DOM errors
        }
    } else {
        showNotification('Subscription already added', 'info');
    }
}
const EXPENSE_ICONS = {
    housing: '🏠',
    utilities: '💡',
    food: '🍽️',
    transportation: '🚗',
    insurance: '🛡️',
    healthcare: '⚕️',
    entertainment: '🎬',
    shopping: '🛍️',
    debt: '💳',
    savings: '💰',
    other: '📦'
};

// Expense category colors for charts - enhanced for clear differentiation
const CATEGORY_COLORS = {
    housing: '#667eea',      // Purple-blue
    utilities: '#f59e0b',    // Orange
    food: '#10b981',         // Green
    transportation: '#3b82f6', // Blue
    insurance: '#8b5cf6',    // Purple
    healthcare: '#ef4444',   // Red
    entertainment: '#ec4899', // Pink
    shopping: '#14b8a6',     // Teal
    debt: '#f97316',         // Dark orange
    savings: '#06b6d4',      // Cyan
    other: '#94a3b8'         // Gray-blue
};

//
/**
 * Initialize all dashboard visualizations
 */
async function initializeVisualizations() {
    try {
        console.log('🎨 Initializing dashboard visualizations...');
        
        // Wait for data service
        const data = await ifiPageInit.loadPageData('Dashboard');
        if (!data) {
            console.warn('⚠️ No onboarding data - showing prompts');
            showAllMissingDataPrompts();
            return;
        }
        
        const onboardingData = data;
        console.log('📊 Onboarding data received:', onboardingData);
        console.log('📊 Monthly income:', onboardingData.monthly_takehome);
        console.log('📊 Expenses:', onboardingData.expenses);

        console.log('🎨 Rendering visualizations...');
        // Render each visualization
        renderIncomeBreakdown(onboardingData);
        renderCashFlowVisualization(onboardingData);
        renderMonthlyExpenses(onboardingData);
        renderDualPieCharts(onboardingData);
        renderSubscriptionsList(onboardingData);
        renderIncomeVsExpensesChart(onboardingData);
        renderFinancialHealthScore(onboardingData);
        renderPersonalizedRecommendations(onboardingData);
        
        console.log('✅ All visualizations rendered successfully');
        
    } catch (error) {
        console.error('❌ Error initializing visualizations:', error);
    }
}

/**
 * Refresh all visualizations with latest data
 * Call this after user updates any financial information
 */
async function refreshDashboardVisualizations() {
    console.log('🔄 Refreshing dashboard visualizations...');
    
    try {
        // Force reload from backend
        const response = await fetch(`${API_URL}/api/user/onboarding-data`, {
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch updated data');
        }
        
        const data = await response.json();
        console.log('📊 Updated data received:', data);
        
        // Re-render all visualizations
        renderIncomeBreakdown(data);
        renderCashFlowVisualization(data);
        renderMonthlyExpenses(data);
        renderDualPieCharts(data);
        renderSubscriptionsList(data);
        renderIncomeVsExpensesChart(data);
        renderFinancialHealthScore(data);
        renderPersonalizedRecommendations(data);
        
        console.log('✅ Dashboard refreshed successfully');
        
        // Show success notification if available
        if (typeof showNotification === 'function') {
            showNotification('Dashboard updated with your latest information', 'success');
        }
        
    } catch (error) {
        console.error('❌ Error refreshing dashboard:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error updating dashboard. Please refresh the page.', 'error');
        }
    }
}

// Make refresh function globally available
window.refreshDashboardVisualizations = refreshDashboardVisualizations;

/**
 * Fetch onboarding data from backend
 */
async function fetchOnboardingData() {
    try {
        // Fetch onboarding data from backend, no localStorage
        const response = await fetch(`${API_URL}/api/user/onboarding-data`, {
            credentials: 'include'
        });
        console.log('📡 Response status:', response.status);
        if (!response.ok) {
            console.error('❌ Response not OK:', response.status);
            throw new Error('Failed to fetch onboarding data');
        }
        const data = await response.json();
        console.log('✅ Received onboarding data:', data);
        return data;
        
    } catch (error) {
        console.error('Error fetching onboarding data:', error);
        return null;
    }
}

/**
 * Render Cash Flow Visualization with animated floating money
 */
function renderCashFlowVisualization(data) {
    console.log('💰 Rendering cash flow visualization with data:', data);
    const container = document.getElementById('cashFlowVisualContainer');
    
    // Check if required data exists
    if (!data.monthly_takehome || !data.expenses) {
        console.warn('⚠️ Missing required data for cash flow:', {
            monthly_takehome: data.monthly_takehome,
            expenses: data.expenses
        });
        container.innerHTML = createMissingDataPrompt(
            'Complete Your Financial Profile',
            'Add your income and expenses to see your cash flow visualization',
            3
        );
        return;
    }

    const income = parseFloat(data.monthly_takehome) || 0;
    const expenses = calculateTotalExpenses(data);
    const cashFlow = income - expenses;
    
    console.log('💰 Cash flow calculation:', { income, expenses, cashFlow });
    
    // Determine cash flow level (low, average, high)
    const cashFlowLevel = getCashFlowLevel(cashFlow, income);
    const dollarBillCount = getDollarBillCount(cashFlowLevel);
    
    container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Income</div>
                    <div style="color: #4ade80; font-size: 1.8rem; font-weight: 700;">$${income.toLocaleString()}</div>
                </div>
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Expenses</div>
                    <div style="color: #ef4444; font-size: 1.8rem; font-weight: 700;">$${expenses.toLocaleString()}</div>
                </div>
                <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 8px; padding: 1rem; text-align: center;">
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.5rem;">Net</div>
                    <div style="color: ${cashFlow >= 0 ? '#4ade80' : '#ef4444'}; font-size: 1.8rem; font-weight: 700;">
                        ${cashFlow >= 0 ? '+' : ''}$${cashFlow.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
        <div class="cash-flow-visual cash-flow-${cashFlowLevel}">
            ${generateFloatingDollarBills(dollarBillCount)}
            <div class="money-container">
                <div class="cash-flow-amount">${cashFlow >= 0 ? '+' : ''}$${Math.abs(cashFlow).toLocaleString()}</div>
            </div>
            ${generateDebtHand(expenses)}
        </div>
    `;
}

/**
 * Calculate total expenses from expense categories
 */
function calculateTotalExpenses(data) {
    let total = 0;
    
    // Sum expenses
    if (data && data.expenses) {
        try {
            const expenseObj = typeof data.expenses === 'string' ? JSON.parse(data.expenses) : data.expenses;
            total += Object.values(expenseObj).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        } catch (error) {
            console.error('Error parsing expenses:', error);
        }
    }
    
    // Sum subscriptions
    if (data && data.subscriptions) {
        try {
            const subs = typeof data.subscriptions === 'string' ? JSON.parse(data.subscriptions) : data.subscriptions;
            if (Array.isArray(subs)) {
                total += subs.reduce((sum, sub) => sum + (parseFloat(sub.cost || sub.amount) || 0), 0);
            }
        } catch (error) {
            console.error('Error parsing subscriptions:', error);
        }
    }
    
    return total;
}

/**
 * Determine cash flow level
 */
function getCashFlowLevel(cashFlow, income) {
    const ratio = cashFlow / income;
    if (ratio >= 0.3) return 'high';
    if (ratio >= 0.1) return 'average';
    return 'low';
}

/**
 * Get number of dollar bills based on cash flow level
 */
function getDollarBillCount(level) {
    switch(level) {
        case 'high': return 6;
        case 'average': return 4;
        case 'low': return 2;
        default: return 3;
    }
}

/**
 * Generate floating dollar bill elements
 */
function generateFloatingDollarBills(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="dollar-bill">💵</div>`;
    }
    return html;
}

/**
 * Generate animated debt hand
 */
function generateDebtHand(debtAmount) {
    return `
        <div class="debt-hand">
            <div class="debt-amount-label">-$${parseFloat(debtAmount).toLocaleString()}</div>
            <div class="debt-hand-icon">✋</div>
        </div>
    `;
}

/**
 * Render Income Breakdown
 */
function renderIncomeBreakdown(data) {
    const container = document.getElementById('incomeBreakdownContainer');
    if (!container) return;
    
    if (!data.monthly_takehome) {
        container.innerHTML = createMissingDataPrompt(
            'No Income Data',
            'Add your income information to see the breakdown',
            3
        );
        return;
    }

    const primaryIncome = parseFloat(data.monthly_takehome) || 0;
    let additionalIncome = [];
    
    // Parse additional income if it exists
    if (data.additional_income) {
        try {
            const parsed = typeof data.additional_income === 'string' 
                ? JSON.parse(data.additional_income) 
                : data.additional_income;
            additionalIncome = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing additional income:', e);
        }
    }

    const additionalTotal = additionalIncome.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalIncome = primaryIncome + additionalTotal;

    container.innerHTML = `
        <div class="income-breakdown">
            <div class="income-item primary">
                <div class="income-info">
                    <div class="income-icon">💼</div>
                    <div class="income-details">
                        <h4>${data.income_source || 'Primary Income'}</h4>
                        <span class="income-label">Monthly Salary</span>
                    </div>
                </div>
                <div class="income-amount">$${primaryIncome.toLocaleString()}</div>
            </div>
            ${additionalIncome.length > 0 ? additionalIncome.map(item => `
                <div class="income-item additional">
                    <div class="income-info">
                        <div class="income-icon">💰</div>
                        <div class="income-details">
                            <h4>${item.source || 'Additional Income'}</h4>
                            <span class="income-label">Monthly</span>
                        </div>
                    </div>
                    <div class="income-amount">$${parseFloat(item.amount).toLocaleString()}</div>
                </div>
            `).join('') : ''}
            <div class="income-total">
                <div class="income-info">
                    <h4>Total Monthly Income</h4>
                </div>
                <div class="income-amount total">$${totalIncome.toLocaleString()}</div>
            </div>
        </div>
    `;
}

// Global variables for chart management
let incomeExpensesChartInstance = null;
let monthlyFinancialData = [];
let currentChartPeriod = 'year';

/**
 * Render Interactive Income vs Expenses Line Chart
 */
async function renderIncomeVsExpensesChart(data) {
    const container = document.getElementById('incomeVsExpensesChart');
    if (!container) return;
    
    if (!data.monthly_takehome || !data.expenses) {
        container.innerHTML = createMissingDataPrompt(
            'No Financial Data',
            'Complete your financial profile to see income vs expenses trend',
            3
        );
        return;
    }

    const baseIncome = parseFloat(data.monthly_takehome) || 0;
    const baseExpenses = calculateTotalExpenses(data);
    
    // Load historical adjustments from backend
    await loadMonthlyFinancials();
    
    // Generate data based on current period (year or month)
    const { labels, incomeData, expenseData } = generateChartData(baseIncome, baseExpenses);
    
    // Create canvas for chart
    container.innerHTML = `<canvas id="incomeExpenseLineChart" style="height: 100%;"></canvas>`;
    
    const canvas = document.getElementById('incomeExpenseLineChart');
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (incomeExpensesChartInstance) {
        incomeExpensesChartInstance.destroy();
    }
    
    incomeExpensesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4ade80',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e8eef9',
                        font: { size: 12, weight: '600' },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(10, 14, 39, 0.95)',
                    titleColor: '#00d4ff',
                    bodyColor: '#e8eef9',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const hasAdjustment = checkIfMonthHasAdjustment(context.label);
                            const suffix = hasAdjustment ? ' (Adjusted)' : '';
                            return context.dataset.label + ': $' + context.parsed.y.toLocaleString() + suffix;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#b8c5d9', font: { size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { 
                        color: '#b8c5d9',
                        font: { size: 11 },
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Load monthly financial adjustments from backend
 */
async function loadMonthlyFinancials() {
    try {
        // Fetch monthly financials from backend, no localStorage
        const response = await fetch(`${API_URL}/api/user/monthly-financials`, {
            credentials: 'include'
        });
        if (response.ok) {
            const result = await response.json();
            monthlyFinancialData = result.data || [];
        }
    } catch (error) {
        console.error('Error loading monthly financials:', error);
        monthlyFinancialData = [];
    }
}

/**
 * Generate chart data with historical adjustments
 */
function generateChartData(baseIncome, baseExpenses) {
    const currentDate = new Date();
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    if (currentChartPeriod === 'year') {
        // Generate last 12 months
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            
            labels.push(monthName);
            
            // Check if this month has custom data
            const customData = monthlyFinancialData.find(d => d.month === month && d.year === year);
            
            if (customData) {
                incomeData.push(parseFloat(customData.income));
                expenseData.push(parseFloat(customData.expenses));
            } else {
                // Use base values with slight variation for realism
                incomeData.push(baseIncome);
                expenseData.push(baseExpenses * (0.95 + Math.random() * 0.1));
            }
        }
    } else {
        // Generate last 30 days
        const dailyIncome = baseIncome / 30;
        const dailyExpenses = baseExpenses / 30;
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - i);
            const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            labels.push(dayLabel);
            
            // Add realistic daily variations
            incomeData.push(dailyIncome * (0.8 + Math.random() * 0.4));
            expenseData.push(dailyExpenses * (0.85 + Math.random() * 0.3));
        }
    }
    
    return { labels, incomeData, expenseData };
}

/**
 * Check if a specific month has custom adjustments
 */
function checkIfMonthHasAdjustment(monthLabel) {
    const [monthName, yearShort] = monthLabel.split(' ');
    const monthMap = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
    const month = monthMap[monthName];
    const year = 2000 + parseInt(yearShort);
    
    return monthlyFinancialData.some(d => d.month === month && d.year === year);
}

/**
 * Render Monthly Expenses Breakdown
 */
function renderMonthlyExpenses(data) {
    const container = document.getElementById('expensesListContainer');
    
    if (!data.expenses) {
        container.innerHTML = createMissingDataPrompt(
            'No Expense Data',
            'Add your monthly expenses to see the breakdown',
            3,
            'expenses'
        );
        return;
    }

    try {
        const expenses = typeof data.expenses === 'string' ? JSON.parse(data.expenses) : data.expenses;
        const expenseEntries = Object.entries(expenses)
            .filter(([_, value]) => value > 0)
            .sort(([_, a], [__, b]) => b - a);

        if (expenseEntries.length === 0) {
            container.innerHTML = createMissingDataPrompt(
                'No Expense Data',
                'Add your monthly expenses to see the breakdown',
                3,
                'expenses'
            );
            return;
        }

        // Calculate subscription total
        let subscriptionTotal = 0;
        if (data.subscriptions) {
            try {
                const subscriptions = typeof data.subscriptions === 'string' 
                    ? JSON.parse(data.subscriptions) 
                    : data.subscriptions;
                if (Array.isArray(subscriptions)) {
                    subscriptionTotal = subscriptions.reduce((sum, sub) => sum + parseFloat(sub.cost || 0), 0);
                }
            } catch (e) {
                console.error('Error parsing subscriptions:', e);
            }
        }

        const totalExpenses = expenseEntries.reduce((sum, [_, amount]) => sum + parseFloat(amount), 0);
        const grandTotal = totalExpenses + subscriptionTotal;

        container.innerHTML = `
            <div class="expense-breakdown">
                ${expenseEntries.map(([category, amount]) => `
                    <div class="expense-item">
                        <div class="expense-info">
                            <div class="expense-icon">${EXPENSE_ICONS[category] || '📦'}</div>
                            <div class="expense-details">
                                <h4>${capitalize(category)}</h4>
                                <span class="expense-label">Monthly</span>
                            </div>
                        </div>
                        <div class="expense-amount">$${parseFloat(amount).toLocaleString()}</div>
                    </div>
                `).join('')}
                ${subscriptionTotal > 0 ? `
                    <div class="expense-item" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1rem; margin-top: 1rem;">
                        <div class="expense-info">
                            <div class="expense-icon">🔄</div>
                            <div class="expense-details">
                                <h4>Subscriptions</h4>
                                <span class="expense-label">Monthly Total</span>
                            </div>
                        </div>
                        <div class="expense-amount">$${subscriptionTotal.toLocaleString()}</div>
                    </div>
                ` : ''}
                <div class="expense-total">
                    <div class="expense-info">
                        <h4>Total Monthly Expenses</h4>
                    </div>
                    <div class="expense-amount total">$${grandTotal.toLocaleString()}</div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error rendering expenses:', error);
        container.innerHTML = '<p style="color: #ef4444;">Error loading expenses</p>';
    }
}

/**
 * Render Budget Pie Chart
 */
function renderBudgetPieChart(data) {
    const container = document.getElementById('budgetPieContainer');
    
    // Check if we have expenses data - if no budget, show expense pie chart instead
    if (!data.expenses) {
        container.innerHTML = createMissingDataPrompt(
            'No Expense Data',
            'Add your expenses to see spending breakdown',
            3,
            'expenses'
        );
        return;
    }

    try {
        const expenses = typeof data.expenses === 'string' ? JSON.parse(data.expenses) : data.expenses;
        
        // If no budget data, create a spending pie chart showing expense distribution
        if (!data.budget) {
            renderExpensePieChart(expenses, container);
            return;
        }
        
        const budget = typeof data.budget === 'string' ? JSON.parse(data.budget) : data.budget;

        // Create comparison data for categories that have both budget and expenses
        const comparisons = [];
        
        Object.keys(budget).forEach(category => {
            // Skip the investingSkipped flag
            if (category === 'investingSkipped') return;
            
            const budgetAmount = parseFloat(budget[category]) || 0;
            const expenseAmount = parseFloat(expenses[category]) || 0;
            
            if (budgetAmount > 0) {
                const percentage = budgetAmount > 0 ? (expenseAmount / budgetAmount) * 100 : 0;
                const isOverBudget = expenseAmount > budgetAmount;
                
                comparisons.push({
                    category,
                    budget: budgetAmount,
                    expenses: expenseAmount,
                    percentage: Math.min(percentage, 100),
                    isOverBudget,
                    color: isOverBudget ? '#ef4444' : '#4ade80'
                });
            }
        });

        if (comparisons.length === 0) {
            container.innerHTML = createMissingDataPrompt(
                'No Budget Comparisons',
                'Set budget limits and track expenses to see your progress',
                3,
                'budget'
            );
            return;
        }

        // Sort by budget amount (descending) and take top 3-4
        const topCategories = comparisons
            .sort((a, b) => b.budget - a.budget)
            .slice(0, 4);

        container.innerHTML = `
            <div class="budget-bars-container" style="display: flex; justify-content: space-around; align-items: flex-end; height: 200px; padding: 1rem; gap: 1.5rem;">
                ${topCategories.map(item => `
                    <div class="budget-bar-wrapper" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                        <div class="budget-bar-track" style="width: 100%; max-width: 60px; height: 150px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; position: relative; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <div class="budget-bar-fill" style="
                                position: absolute;
                                bottom: 0;
                                width: 100%;
                                --target-height: ${item.percentage}%;
                                height: 0;
                                background: ${item.color};
                                border-radius: 8px 8px 0 0;
                                transition: height 0.6s ease;
                                box-shadow: 0 0 20px ${item.color}40;
                            "></div>
                            ${item.isOverBudget ? `
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.5rem; animation: pulse 2s ease infinite;">⚠️</div>
                            ` : ''}
                        </div>
                        <div class="budget-bar-label" style="text-align: center;">
                            <div style="color: #00d4ff; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                ${EXPENSE_ICONS[item.category] || '📦'} ${capitalize(item.category)}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.75rem;">
                                $${item.expenses.toFixed(0)} / $${item.budget.toFixed(0)}
                            </div>
                            <div style="color: ${item.color}; font-weight: 700; font-size: 0.75rem; margin-top: 0.25rem;">
                                ${item.isOverBudget ? 'Over Budget' : item.percentage.toFixed(0) + '% Used'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <a href="budget.html" style="color: #00d4ff; text-decoration: none; font-weight: 600; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
                    <span>See More on Budget!</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        
        // Trigger animation after render
        setTimeout(() => {
            document.querySelectorAll('.budget-bar-fill').forEach(bar => {
                const targetHeight = bar.style.getPropertyValue('--target-height');
                bar.style.height = targetHeight;
            });
        }, 100);
        
    } catch (error) {
        console.error('Error rendering budget comparison:', error);
        container.innerHTML = '<p style="color: #ef4444;">Error loading budget comparison</p>';
    }
}

/**
 * Create SVG pie slice
 */
function createPieSlice(slice, cx, cy, radius) {
    const startAngle = slice.startAngle * (Math.PI / 180);
    const endAngle = slice.endAngle * (Math.PI / 180);
    
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    
    const largeArc = (slice.endAngle - slice.startAngle) > 180 ? 1 : 0;
    
    const pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z'
    ].join(' ');
    
    return `<path d="${pathData}" fill="${slice.color}" class="pie-slice" />`;
}

/**
 * Render Dual Pie Charts - Budget Plan vs Actual Expenses
 */
function renderDualPieCharts(data) {
    const budgetContainer = document.getElementById('budgetPlanPieContainer');
    const budgetLegendContainer = document.getElementById('budgetPlanLegend');
    const expensesContainer = document.getElementById('actualExpensesPieContainer');
    const expensesLegendContainer = document.getElementById('actualExpensesLegend');
    
    // Check if we have budget data
    let budget = {};
    if (data.budget) {
        try {
            budget = typeof data.budget === 'string' ? JSON.parse(data.budget) : data.budget;
        } catch (e) {
            console.error('Error parsing budget:', e);
        }
    }
    
    // Check if we have expenses data
    let expenses = {};
    if (data.expenses) {
        try {
            expenses = typeof data.expenses === 'string' ? JSON.parse(data.expenses) : data.expenses;
        } catch (e) {
            console.error('Error parsing expenses:', e);
        }
    }
    
    // Render Budget Plan Pie Chart
    if (Object.keys(budget).length > 0) {
        renderSinglePieChart(budget, budgetContainer, budgetLegendContainer, 'budget');
    } else {
        budgetContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 1.5rem;">No budget plan yet</p>
                <a href="onboarding.html?continue=true&step=3&section=budget" 
                   style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #00d4ff, #667eea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.2s ease;">
                    Complete Budget
                </a>
            </div>
        `;
        budgetLegendContainer.innerHTML = '';
    }
    
    // Render Actual Expenses Pie Chart
    if (Object.keys(expenses).length > 0) {
        renderSinglePieChart(expenses, expensesContainer, expensesLegendContainer, 'expenses');
    } else {
        expensesContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">💸</div>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 1.5rem;">No expense data yet</p>
                <a href="onboarding.html?continue=true&step=3&section=expenses" 
                   style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #00d4ff, #667eea); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: transform 0.2s ease;">
                    Add Expenses
                </a>
            </div>
        `;
        expensesLegendContainer.innerHTML = '';
    }
}

/**
 * Render a single pie chart with legend
 */
function renderSinglePieChart(data, container, legendContainer, type) {
    const filteredData = Object.entries(data)
        .filter(([key, value]) => key !== 'investingSkipped' && parseFloat(value) > 0)
        .map(([category, amount]) => ({
            category,
            amount: parseFloat(amount),
            color: CATEGORY_COLORS[category] || '#6b7280',
            icon: EXPENSE_ICONS[category] || '📦'
        }))
        .sort((a, b) => b.amount - a.amount);
    
    if (filteredData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6);">No data</p>';
        return;
    }
    
    const total = filteredData.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate pie slices
    let currentAngle = -90;
    const slices = filteredData.map(item => {
        const percentage = (item.amount / total) * 100;
        const angle = (percentage / 100) * 360;
        const slice = {
            ...item,
            percentage,
            startAngle: currentAngle,
            endAngle: currentAngle + angle
        };
        currentAngle += angle;
        return slice;
    });
    
    // Create SVG pie chart
    const svgSize = 250;
    const radius = 100;
    const cx = svgSize / 2;
    const cy = svgSize / 2;
    
    const svgPaths = slices.map(slice => createPieSlice(slice, cx, cy, radius)).join('');
    
    container.innerHTML = `
        <svg viewBox="0 0 ${svgSize} ${svgSize}" style="width: 100%; height: 100%;">
            ${svgPaths}
            <circle cx="${cx}" cy="${cy}" r="60" fill="rgba(10, 14, 39, 0.9)" />
            <text x="${cx}" y="${cy - 10}" text-anchor="middle" fill="#00d4ff" font-size="24" font-weight="700">$${Math.round(total).toLocaleString()}</text>
            <text x="${cx}" y="${cy + 15}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="12">Total</text>
        </svg>
    `;
    
    // Create legend
    legendContainer.innerHTML = slices.map(slice => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${slice.color};"></div>
            <span class="legend-label">${slice.icon} ${capitalize(slice.category)}</span>
            <span class="legend-value">$${slice.amount.toLocaleString()}</span>
        </div>
    `).join('');
}

/**
 * AI Brain Reveal Animation
 */
function revealAIRecommendations() {
    const button = document.querySelector('.ai-brain-reveal-btn');
    const content = document.getElementById('recommendationsContainer');
    
    if (!button || !content) return;
    
    // Add opening animation class
    button.classList.add('opening');
    
    // After animation, hide button and show content
    setTimeout(() => {
        button.style.display = 'none';
        content.classList.remove('hidden');
        content.classList.add('revealed');
        
        // Scroll to recommendations
        content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1200);
}

// Make function globally available
window.revealAIRecommendations = revealAIRecommendations;

/**
 * Render Expense Pie Chart - Shows spending distribution by category
 */
function renderExpensePieChart(expenses, container) {
    const expenseEntries = Object.entries(expenses)
        .filter(([_, value]) => parseFloat(value) > 0)
        .map(([category, amount]) => ({
            category,
            amount: parseFloat(amount),
            icon: EXPENSE_ICONS[category] || '📦',
            color: CATEGORY_COLORS[category] || '#6b7280'
        }))
        .sort((a, b) => b.amount - a.amount);
    
    if (expenseEntries.length === 0) {
        container.innerHTML = createMissingDataPrompt(
            'No Expense Data',
            'Add your expenses to see spending breakdown',
            3,
            'expenses'
        );
        return;
    }
    
    const total = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    container.innerHTML = `
        <div style="padding: 1rem;">
            <h4 style="color: #00d4ff; margin: 0 0 1.5rem 0; text-align: center;">
                <i class="fas fa-chart-pie"></i> Spending Breakdown
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center;">
                ${expenseEntries.map(entry => {
                    const percentage = (entry.amount / total * 100).toFixed(1);
                    return `
                        <div style="flex: 0 0 calc(50% - 0.5rem); background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.1); border-radius: 8px; padding: 1rem; text-align: center;">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${entry.icon}</div>
                            <div style="color: #00d4ff; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">
                                ${capitalize(entry.category)}
                            </div>
                            <div style="color: #fff; font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">
                                $${entry.amount.toLocaleString()}
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem;">
                                ${percentage}% of total
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div style="text-align: center; margin-top: 1.5rem; padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px;">
                <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.25rem;">
                    Total Monthly Spending
                </div>
                <div style="color: #00d4ff; font-size: 1.5rem; font-weight: 700;">
                    $${total.toLocaleString()}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Subscriptions List
 */
function renderSubscriptionsList(data) {
    const container = document.getElementById('subscriptionsContainer');
    
    let initialSubscriptions = [];
    try {
        if (data && data.subscriptions) {
            const parsed = typeof data.subscriptions === 'string' ? JSON.parse(data.subscriptions) : data.subscriptions;
            if (Array.isArray(parsed)) {
                initialSubscriptions = parsed.map(sub => ({
                    name: sub.name,
                    cost: parseFloat(sub.cost),
                    category: sub.category || ''
                }));
            }
        }
        dashboardSelectedSubscriptions = [...initialSubscriptions];
        container.innerHTML = createSubscriptionSearchWidget();
        updateDashboardSubscriptionList();
        // Ensure click-outside behavior is wired after widget is inserted
        setupSubscriptionDropdownBehavior();
    } catch (error) {
        console.error('Error rendering subscriptions:', error);
        container.innerHTML = '<p style="color: #ef4444;">Error loading subscriptions</p>';
    }
}

/**
 * Create subscription search widget for Active Subscriptions section
 */
function createSubscriptionSearchWidget() {
    return `
        <div style="padding: 1.5rem;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h4 style="color: #00d4ff; margin: 0 0 0.5rem 0;">Add Your Subscriptions</h4>
                <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin: 0;">
                    Track your recurring monthly subscriptions
                </p>
            </div>
            
            <div style="position: relative; margin-bottom: 1rem;">
                <input 
                    type="text" 
                    id="dashboard-subscription-search" 
                    placeholder="Search subscriptions (e.g., Netflix, Spotify)..."
                    style="width: 100%; padding: 0.75rem 1rem; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 8px; color: #fff; font-size: 0.95rem;"
                    autocomplete="off"
                    onkeyup="handleDashboardSubscriptionSearch(event)"
                />
                <div id="dashboard-subscription-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: rgba(20, 26, 46, 0.98); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 8px; margin-top: 0.5rem; max-height: 300px; overflow-y: auto; z-index: 1000;"></div>
            </div>
            
            <div id="dashboard-subscription-list" style="margin-bottom: 1rem;"></div>
            
            <div id="dashboard-subscription-total" style="text-align: center; padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; display: none;">
                <p style="color: rgba(255,255,255,0.7); font-size: 0.95rem; margin: 0;">
                    Total Monthly: <strong style="color: #00d4ff;" id="dashboard-subscription-total-amount">$0.00</strong>
                </p>
            </div>
            
            <button 
                onclick="saveDashboardSubscriptions()" 
                id="dashboard-save-subscriptions-btn"
                style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #00d4ff, #667eea); border: none; border-radius: 8px; color: #fff; font-weight: 600; cursor: pointer; margin-top: 1rem; display: none;"
            >
                Save Subscriptions
            </button>
        </div>
    `;
}

/**
 * Get first letter of subscription name for logo
 */
function getSubscriptionInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

// Store selected subscriptions temporarily
let dashboardSelectedSubscriptions = [];

/**
 * Handle subscription search on dashboard
 */
async function handleDashboardSubscriptionSearch(event) {
    const searchInput = document.getElementById('dashboard-subscription-search');
    const resultsContainer = document.getElementById('dashboard-subscription-results');
    
    if (!searchInput || !resultsContainer) return;
    
    const query = searchInput.value.trim().toLowerCase();
    
    // Hide results if query is empty
    if (query.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    try {
        // Fetch subscription data from backend
        const response = await fetch(`${API_URL}/api/user/subscriptions/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            // If API not available, use hardcoded list
            displayHardcodedSubscriptions(query, resultsContainer);
            return;
        }
        
        const subscriptions = await response.json();
        displaySubscriptionResults(subscriptions, resultsContainer);
        
    } catch (error) {
        console.error('Error searching subscriptions:', error);
        // Fallback to hardcoded list
        displayHardcodedSubscriptions(query, resultsContainer);
    }
}

/**
 * Setup click-outside and Escape-key behavior for subscription dropdown
 * Hides `#dashboard-subscription-results` when user clicks outside
 */
function setupSubscriptionDropdownBehavior() {
    const searchInput = document.getElementById('dashboard-subscription-search');
    const resultsContainer = document.getElementById('dashboard-subscription-results');
    if (!searchInput || !resultsContainer) return;

    // Avoid attaching multiple listeners
    if (searchInput._subscriptionDropdownHandlersAttached) return;

    const onDocumentClick = (e) => {
        // If results hidden, nothing to do
        if (!resultsContainer || resultsContainer.style.display === 'none') return;
        const target = e.target;
        // If click occurred inside the input or results, keep it open
        if (searchInput.contains(target) || resultsContainer.contains(target)) return;
        // Otherwise hide the results
        resultsContainer.style.display = 'none';
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            if (resultsContainer) resultsContainer.style.display = 'none';
        }
    };

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKeyDown);

    // Mark attached and store cleanup
    searchInput._subscriptionDropdownHandlersAttached = true;
    searchInput._subscriptionDropdownCleanup = () => {
        document.removeEventListener('click', onDocumentClick);
        document.removeEventListener('keydown', onKeyDown);
        delete searchInput._subscriptionDropdownHandlersAttached;
        delete searchInput._subscriptionDropdownCleanup;
    };
}

/**
 * Display hardcoded subscription results as fallback
 */
function displayHardcodedSubscriptions(query, container) {
    // Use the comprehensive subscriptions database if available
    const subscriptionsDB = typeof SUBSCRIPTIONS_DATABASE !== 'undefined' ? SUBSCRIPTIONS_DATABASE : [
        { name: 'Netflix', cost: 15.99, category: 'entertainment' },
        { name: 'Spotify Premium', cost: 10.99, category: 'entertainment' },
        { name: 'Amazon Prime', cost: 14.99, category: 'shopping' },
        { name: 'Apple Music', cost: 10.99, category: 'entertainment' },
        { name: 'Disney+', cost: 10.99, category: 'entertainment' },
        { name: 'Hulu', cost: 7.99, category: 'entertainment' },
        { name: 'HBO Max', cost: 15.99, category: 'entertainment' },
        { name: 'YouTube Premium', cost: 11.99, category: 'entertainment' }
    ];
    
    const filtered = subscriptionsDB.filter(sub => 
        sub.name.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results for better UX
    
    displaySubscriptionResults(filtered, container);
}

/**
 * Display subscription search results
 */
/**
 * Display subscription search results
 */
function displaySubscriptionResults(subscriptions, container) {
    if (!subscriptions || subscriptions.length === 0) {
        container.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: rgba(255,255,255,0.6);">
                No subscriptions found. Try a different search term.
            </div>
        `;
        container.style.display = 'block';
        return;
    }

    // Helper function to capitalize category
    const capitalizeCategory = (cat) => {
        if (!cat) return '';
        return cat.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    container.innerHTML = subscriptions.map(sub => `
        <div
            style="padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: background 0.2s;"
            onmouseover="this.style.background='rgba(0,212,255,0.1)'"
            onmouseout="this.style.background='transparent'"
            onclick="addDashboardSubscription('${sub.name.replace(/'/g, "\\'")}', ${sub.cost})"
        >
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="color: #fff; font-weight: 500;">${sub.name}</div>
                    ${sub.category ? `<div style="color: rgba(255,255,255,0.5); font-size: 0.85rem;">${capitalizeCategory(sub.category)}</div>` : ''}
                </div>
                <div style="color: #00d4ff; font-weight: 600;">$${sub.cost.toFixed(2)}/mo</div>
            </div>
        </div>
    `).join('');

    container.style.display = 'block';
}

/**
 * Update dashboard subscription list display
 */
function updateDashboardSubscriptionList() {
    const listContainer = document.getElementById('dashboard-subscription-list');
    const totalContainer = document.getElementById('dashboard-subscription-total');
    const totalAmount = document.getElementById('dashboard-subscription-total-amount');
    const saveBtn = document.getElementById('dashboard-save-subscriptions-btn');
    
    if (!listContainer) return;
    
    if (dashboardSelectedSubscriptions.length === 0) {
        listContainer.innerHTML = '';
        if (totalContainer) totalContainer.style.display = 'none';
        if (saveBtn) saveBtn.style.display = 'none';
        return;
    }
    
    const total = dashboardSelectedSubscriptions.reduce((sum, sub) => sum + sub.cost, 0);
    
    listContainer.innerHTML = dashboardSelectedSubscriptions.map((sub, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(0,0,0,0.3); border-radius: 8px; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: 0.95rem;">
                    ${getSubscriptionInitial(sub.name)}
                </div>
                <div>
                    <div style="color: #fff; font-weight: 500;">${sub.name}</div>
                    <div style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">$${sub.cost.toFixed(2)}/mo</div>
                </div>
            </div>
            <button 
                onclick="removeDashboardSubscription(${index})"
                style="background: rgba(255,0,0,0.2); border: none; color: #ff4444; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 1.1rem; line-height: 1;"
                title="Remove"
            >×</button>
        </div>
    `).join('');
    
    if (totalAmount) totalAmount.textContent = `$${total.toFixed(2)}`;
    if (totalContainer) totalContainer.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'block';
}

/**
 * Remove subscription from dashboard list
 */
function removeDashboardSubscription(index) {
    dashboardSelectedSubscriptions.splice(index, 1);
    updateDashboardSubscriptionList();
}

/**
 * Save dashboard subscriptions to database
 */
async function saveDashboardSubscriptions() {
    if (dashboardSelectedSubscriptions.length === 0) {
        showNotification('Please add at least one subscription', 'warning');
        return;
    }
    
    const saveBtn = document.getElementById('dashboard-save-subscriptions-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }
    
    try {
        // Convert to format expected by backend
        const subscriptions = dashboardSelectedSubscriptions.map(sub => ({
            name: sub.name,
            amount: sub.cost,
            billing_cycle: 'monthly'
        }));
        const response = await fetch(`${API_URL}/api/user/onboarding`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                subscriptions: subscriptions
            })
        });
        if (!response.ok) {
            throw new Error('Failed to save subscriptions');
        }
        showNotification('Subscriptions saved successfully!', 'success');
        dashboardSelectedSubscriptions = [];
        setTimeout(() => {
            location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('Error saving subscriptions:', error);
        showNotification('Failed to save subscriptions. Please try again.', 'error');
        
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Subscriptions';
        }
    }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'rgba(0, 212, 100, 0.95)' : type === 'error' ? 'rgba(255, 68, 68, 0.95)' : 'rgba(0, 212, 255, 0.95)'};
        color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Render Enhanced Financial Health Score
 */
function renderFinancialHealthScore(data) {
    const container = document.getElementById('healthScoreContainer');
    if (!container) return;
    
    if (!data || !data.monthly_takehome) {
        container.innerHTML = createMissingDataPrompt(
            'No Financial Data',
            'Complete onboarding to calculate your financial health score',
            3
        );
        return;
    }
    
    const score = calculateFinancialHealthScore(data);
    const factors = score.factors;
    
    container.innerHTML = `
        <div class="health-score-container">
            <div class="score-circle-animated">
                <div class="score-inner">
                    <div class="score-number">${score.total}</div>
                    <div class="score-max">/100</div>
                </div>
            </div>
            
            <div class="score-explanation">
                <h4 style="color: #fff; margin-bottom: 1rem; font-size: 1.1rem;">Score Breakdown</h4>
                <div class="score-factors">
                    ${factors.map(factor => `
                        <div class="factor-item">
                            <span class="factor-name">${factor.name}</span>
                            <div class="factor-bar">
                                <div class="factor-fill" style="width: ${factor.percentage}%;"></div>
                            </div>
                            <span class="factor-score">${factor.score}/${factor.max}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; border-left: 3px solid #00d4ff;">
                    <h5 style="color: #00d4ff; margin: 0 0 0.5rem 0; font-size: 0.95rem;">Why This Matters</h5>
                    <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 0.85rem; line-height: 1.5;">
                        ${getScoreExplanation(score.total)}
                    </p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Calculate comprehensive financial health score
 */
function calculateFinancialHealthScore(data) {
    const factors = [];
    
    // Income to Debt Ratio (25 points)
    const income = parseFloat(data.monthly_takehome) || 0;
    const debt = parseFloat(data.total_debt_amount) || 0;
    const debtRatio = debt > 0 ? Math.min((income / (debt / 12)) * 25, 25) : 25;
    factors.push({
        name: 'Income to Debt Ratio',
        score: Math.round(debtRatio),
        max: 25,
        percentage: (debtRatio / 25) * 100
    });
    
    // Savings Rate (25 points)
    const expenses = calculateTotalExpenses(data);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 25 : 0;
    factors.push({
        name: 'Savings Rate',
        score: Math.round(Math.max(0, savingsRate)),
        max: 25,
        percentage: Math.max(0, (savingsRate / 25) * 100)
    });
    
    // Expense Management (20 points)
    const expenseRatio = income > 0 ? (1 - (expenses / income)) * 20 : 0;
    factors.push({
        name: 'Expense Management',
        score: Math.round(Math.max(0, expenseRatio)),
        max: 20,
        percentage: Math.max(0, (expenseRatio / 20) * 100)
    });
    
    // Emergency Fund (15 points)
    const assets = parseFloat(data.total_assets_value) || 0;
    const emergencyFundMonths = expenses > 0 ? assets / expenses : 0;
    const emergencyScore = Math.min((emergencyFundMonths / 6) * 15, 15);
    factors.push({
        name: 'Emergency Fund',
        score: Math.round(emergencyScore),
        max: 15,
        percentage: (emergencyScore / 15) * 100
    });
    
    // Investment Portfolio (15 points)
    const portfolio = parseFloat(data.portfolio_value) || 0;
    const investmentScore = portfolio > 0 ? Math.min((portfolio / 10000) * 15, 15) : 0;
    factors.push({
        name: 'Investment Portfolio',
        score: Math.round(investmentScore),
        max: 15,
        percentage: (investmentScore / 15) * 100
    });
    
    const total = Math.round(factors.reduce((sum, f) => sum + f.score, 0));
    
    return { total, factors };
}

/**
 * Get explanation based on score
 */
function getScoreExplanation(score) {
    if (score >= 80) {
        return "Excellent! Your financial health is strong. You're managing money wisely with good savings and low debt. Keep up the great work and continue building your wealth.";
    } else if (score >= 60) {
        return "Good progress! You're on the right track but have room for improvement. Focus on increasing savings, reducing debt, and building an emergency fund.";
    } else if (score >= 40) {
        return "Fair standing. There are areas that need attention. Consider creating a budget, reducing unnecessary expenses, and starting an emergency fund for financial stability.";
    } else {
        return "Needs improvement. Your financial health requires immediate attention. Focus on reducing debt, cutting expenses, and building an emergency fund. Consider consulting with a financial advisor.";
    }
}

/**
 * Open modal to edit monthly financial data
 */
function openMonthEditModal() {
    const modal = document.getElementById('monthEditModal');
    if (!modal) {
        createMonthEditModal();
    }
    
    populateMonthYearOptions();
    document.getElementById('monthEditModal').style.display = 'flex';
}

/**
 * Close the edit modal
 */
function closeMonthEditModal() {
    document.getElementById('monthEditModal').style.display = 'none';
    clearModalForm();
}

/**
 * Create the month edit modal HTML
 */
function createMonthEditModal() {
    const modalHTML = `
        <div id="monthEditModal" class="month-edit-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-edit"></i> Edit Monthly Financial Data</h3>
                    <button class="modal-close" onclick="closeMonthEditModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="month-selector-section">
                        <h4>Select Month & Year</h4>
                        <div class="date-selectors">
                            <div class="form-group">
                                <label for="editMonth">Month</label>
                                <select id="editMonth" class="form-control">
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editYear">Year</label>
                                <select id="editYear" class="form-control"></select>
                            </div>
                        </div>
                        <button class="load-month-btn" onclick="loadMonthData()">
                            <i class="fas fa-download"></i> Load Data for This Month
                        </button>
                    </div>
                    
                    <div class="financial-inputs-section">
                        <h4>Financial Data</h4>
                        <div class="form-group">
                            <label for="editIncome">
                                <i class="fas fa-dollar-sign" style="color: #4ade80;"></i> 
                                Income
                            </label>
                            <input type="number" id="editIncome" class="form-control" 
                                   placeholder="Enter income amount" step="0.01" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="editExpenses">
                                <i class="fas fa-credit-card" style="color: #ef4444;"></i> 
                                Expenses
                            </label>
                            <input type="number" id="editExpenses" class="form-control" 
                                   placeholder="Enter expenses amount" step="0.01" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="editNotes">
                                <i class="fas fa-sticky-note"></i> 
                                Notes (Optional)
                            </label>
                            <textarea id="editNotes" class="form-control" rows="3" 
                                      placeholder="Add notes about this month's finances..."></textarea>
                        </div>
                        
                        <div class="net-flow-preview">
                            <span>Net Cash Flow: </span>
                            <span id="netFlowAmount" class="net-amount">$0.00</span>
                        </div>
                    </div>
                    
                    <div class="existing-adjustments-section">
                        <h4>Your Adjustments</h4>
                        <div id="adjustmentsList" class="adjustments-list">
                            <p class="no-data">No adjustments yet. Add your first adjustment above.</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeMonthEditModal()">Cancel</button>
                    <button class="btn-danger" onclick="deleteCurrentMonth()" id="deleteMonthBtn" style="display: none;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn-primary" onclick="saveMonthlyData()">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners for real-time net flow calculation
    document.getElementById('editIncome').addEventListener('input', updateNetFlow);
    document.getElementById('editExpenses').addEventListener('input', updateNetFlow);
    
    // Load existing adjustments
    displayExistingAdjustments();
}

/**
 * Populate year options in the selector
 */
function populateMonthYearOptions() {
    const currentDate = new Date();
    const yearSelect = document.getElementById('editYear');
    
    if (!yearSelect) return;
    
    yearSelect.innerHTML = '';
    
    // Add last 2 years, current year, and next year
    for (let i = 2; i >= -1; i--) {
        const year = currentDate.getFullYear() - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (i === 0) option.selected = true;
        yearSelect.appendChild(option);
    }
    
    // Set current month
    document.getElementById('editMonth').value = currentDate.getMonth() + 1;
}

/**
 * Load existing data for selected month
 */
function loadMonthData() {
    const month = parseInt(document.getElementById('editMonth').value);
    const year = parseInt(document.getElementById('editYear').value);
    
    const existing = monthlyFinancialData.find(d => d.month === month && d.year === year);
    
    if (existing) {
        document.getElementById('editIncome').value = existing.income;
        document.getElementById('editExpenses').value = existing.expenses;
        document.getElementById('editNotes').value = existing.notes || '';
        document.getElementById('deleteMonthBtn').style.display = 'inline-block';
        updateNetFlow();
    } else {
        // Load base values from onboarding data
        const userData = JSON.parse(localStorage.getItem('ifi_user') || '{}');
        const onboardingData = userData.onboarding_data || {};
        
        document.getElementById('editIncome').value = onboardingData.monthly_takehome || '';
        document.getElementById('editExpenses').value = calculateTotalExpenses(onboardingData) || '';
        document.getElementById('editNotes').value = '';
        document.getElementById('deleteMonthBtn').style.display = 'none';
        updateNetFlow();
    }
}

/**
 * Update net flow preview
 */
function updateNetFlow() {
    const income = parseFloat(document.getElementById('editIncome').value) || 0;
    const expenses = parseFloat(document.getElementById('editExpenses').value) || 0;
    const netFlow = income - expenses;
    
    const netElement = document.getElementById('netFlowAmount');
    netElement.textContent = '$' + netFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    netElement.className = 'net-amount ' + (netFlow >= 0 ? 'positive' : 'negative');
}

/**
 * Save monthly financial data
 */
async function saveMonthlyData() {
    const month = parseInt(document.getElementById('editMonth').value);
    const year = parseInt(document.getElementById('editYear').value);
    const income = parseFloat(document.getElementById('editIncome').value) || 0;
    const expenses = parseFloat(document.getElementById('editExpenses').value) || 0;
    const notes = document.getElementById('editNotes').value.trim();
    
    if (!income && !expenses) {
        alert('Please enter at least income or expenses amount');
        return;
    }
    
    try {
        const token = localStorage.getItem('ifi_access_token');
        const response = await fetch(`${API_URL}/api/user/monthly-financials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ month, year, income, expenses, notes })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Reload data and refresh all affected visualizations
            await loadMonthlyFinancials();
            
            // Fetch latest onboarding data to update all visualizations
            const response = await fetch(`${API_URL}/api/user/onboarding-data`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const freshData = await response.json();
                // Refresh all visualizations that use income/expense data
                await renderIncomeVsExpensesChart(freshData);
                renderCashFlowVisualization(freshData);
                renderPersonalizedRecommendations(freshData);
            }
            
            displayExistingAdjustments();
            clearModalForm();
            
            showSuccessNotification('Monthly data saved successfully!');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error saving monthly data:', error);
        alert('Failed to save monthly data. Please try again.');
    }
}

/**
 * Delete current month data
 */
async function deleteCurrentMonth() {
    const month = parseInt(document.getElementById('editMonth').value);
    const year = parseInt(document.getElementById('editYear').value);
    
    if (!confirm(`Delete data for ${getMonthName(month)} ${year}?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('ifi_access_token');
        const response = await fetch(`/api/user/monthly-financials/${month}/${year}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadMonthlyFinancials();
            await refreshIncomeVsExpensesChart();
            displayExistingAdjustments();
            clearModalForm();
            document.getElementById('deleteMonthBtn').style.display = 'none';
            
            showSuccessNotification('Monthly data deleted successfully!');
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error deleting monthly data:', error);
        alert('Failed to delete monthly data. Please try again.');
    }
}

/**
 * Clear modal form
 */
function clearModalForm() {
    document.getElementById('editIncome').value = '';
    document.getElementById('editExpenses').value = '';
    document.getElementById('editNotes').value = '';
    updateNetFlow();
}

/**
 * Display existing adjustments list
 */
function displayExistingAdjustments() {
    const container = document.getElementById('adjustmentsList');
    if (!container) return;
    
    if (monthlyFinancialData.length === 0) {
        container.innerHTML = '<p class="no-data">No adjustments yet. Add your first adjustment above.</p>';
        return;
    }
    
    const sortedData = [...monthlyFinancialData].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });
    
    container.innerHTML = sortedData.map(data => {
        const netFlow = parseFloat(data.income) - parseFloat(data.expenses);
        return `
            <div class="adjustment-item" onclick="loadSpecificMonth(${data.month}, ${data.year})">
                <div class="adjustment-date">
                    <i class="fas fa-calendar"></i>
                    ${getMonthName(data.month)} ${data.year}
                </div>
                <div class="adjustment-values">
                    <span class="income-value">
                        <i class="fas fa-arrow-up"></i> $${parseFloat(data.income).toLocaleString()}
                    </span>
                    <span class="expense-value">
                        <i class="fas fa-arrow-down"></i> $${parseFloat(data.expenses).toLocaleString()}
                    </span>
                    <span class="net-value ${netFlow >= 0 ? 'positive' : 'negative'}">
                        Net: $${netFlow.toLocaleString()}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Load specific month into form
 */
function loadSpecificMonth(month, year) {
    document.getElementById('editMonth').value = month;
    document.getElementById('editYear').value = year;
    loadMonthData();
}

/**
 * Get month name from number
 */
function getMonthName(monthNum) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
}

/**
 * Refresh the income vs expenses chart with latest data
 */
async function refreshIncomeVsExpensesChart() {
    try {
        // Fetch fresh data from backend
        const response = await fetch(`${API_URL}/api/user/onboarding-data`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const onboardingData = await response.json();
            await renderIncomeVsExpensesChart(onboardingData);
        } else {
            console.error('Failed to fetch data for chart refresh');
        }
    } catch (error) {
        console.error('Error refreshing income vs expenses chart:', error);
    }
}

/**
 * Switch chart period between year and month view
 */
async function switchChartPeriod(period) {
    currentChartPeriod = period;
    
    // Update button states
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });
    
    // Refresh chart with new period
    await refreshIncomeVsExpensesChart();
}

/**
 * Show success notification
 */
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Render Cash Flow Chart
 */
function renderCashFlowChart(data) {
    const container = document.getElementById('cashFlowChartContainer');
    
    if (!data.monthly_takehome || !data.expenses) {
        container.innerHTML = createMissingDataPrompt(
            'Incomplete Data',
            'Add income and expenses to view your cash flow trends',
            'onboarding.html?step=3'
        );
        return;
    }

    const income = parseFloat(data.monthly_takehome) || 0;
    const expenses = calculateTotalExpenses(data);
    
    // Generate sample data for last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const maxValue = Math.max(income, expenses);
    
    container.innerHTML = `
        <div class="cash-flow-chart">
            <div class="chart-bars">
                ${months.map((month, index) => {
                    // Vary the values slightly for visualization
                    const variation = 0.9 + (Math.random() * 0.2);
                    const monthIncome = income * variation;
                    const monthExpenses = expenses * variation;
                    const heightIncome = (monthIncome / maxValue) * 100;
                    const heightExpenses = (monthExpenses / maxValue) * 100;
                    
                    return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                            <div class="chart-bar" style="height: ${heightIncome}%; background: linear-gradient(to top, #4ade80, #10b981);">
                                <span class="bar-value">$${Math.round(monthIncome).toLocaleString()}</span>
                            </div>
                            <div class="chart-bar" style="height: ${heightExpenses}%; background: linear-gradient(to top, #ef4444, #dc2626);">
                                <span class="bar-value">-$${Math.round(monthExpenses).toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="chart-labels">
                ${months.map(month => `<div class="chart-label">${month}</div>`).join('')}
            </div>
        </div>
        <div style="display: flex; justify-content: center; gap: 2rem; margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 20px; height: 20px; background: linear-gradient(to right, #4ade80, #10b981); border-radius: 4px;"></div>
                <span style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Income</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 20px; height: 20px; background: linear-gradient(to right, #ef4444, #dc2626); border-radius: 4px;"></div>
                <span style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Expenses</span>
            </div>
        </div>
    `;
}

/**
 * Create missing data prompt with step and section-specific navigation
 * @param {string} title - Prompt title
 * @param {string} description - Prompt description
 * @param {number} step - Step number (default: 3)
 * @param {string} section - Optional section name within step
 */
function createMissingDataPrompt(title, description, step = 3, section = null) {
    const onclickHandler = section 
        ? `continueOnboarding(${step}, '${section}')`
        : `continueOnboarding(${step})`;
    
    return `
        <div class="missing-data-cta">
            <div class="missing-icon">📊</div>
            <h4 class="missing-title">${title}</h4>
            <p class="missing-description">${description}</p>
            <button class="complete-onboarding-btn" onclick="${onclickHandler}">
                <i class="fas fa-edit"></i>
                Complete This Section
            </button>
        </div>
    `;
}

/**
 * Render Personalized Recommendations
 */
function renderPersonalizedRecommendations(data) {
    const container = document.getElementById('recommendationsContainer');
    if (!container) return;
    
    // Check if we have any financial data at all
    if (!data || !data.monthly_takehome) {
        container.innerHTML = createMissingDataPrompt(
            'No Recommendations Yet',
            'Complete your financial profile to get personalized recommendations',
            3
        );
        return;
    }

    const recommendations = generateRecommendationsFromData(data);
    
    // Store recommendations but don't show them yet (user will click the AI brain button)
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                <h4 style="color: #4ade80; margin: 0 0 0.5rem 0;">Great Job!</h4>
                <p style="color: rgba(255,255,255,0.7); margin: 0;">You're managing your finances well. Keep it up!</p>
            </div>
        `;
        // Auto-reveal if no recommendations
        const button = document.querySelector('.ai-brain-reveal-btn');
        if (button) button.style.display = 'none';
        container.classList.remove('hidden');
        container.classList.add('revealed');
        return;
    }
    
    container.innerHTML = `
        <div class="recommendations-list">
            ${recommendations.map((rec, index) => `
                <div class="recommendation-card priority-${rec.priority}" style="animation-delay: ${index * 0.1}s">
                    <div class="recommendation-header">
                        <div class="recommendation-icon">
                            <i class="fas ${rec.icon}"></i>
                        </div>
                        <div class="recommendation-title-section">
                            <h4 class="recommendation-title">${rec.title}</h4>
                            <span class="recommendation-category">${rec.category}</span>
                        </div>
                        <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                    </div>
                    <p class="recommendation-description">${rec.description}</p>
                    <p class="recommendation-action"><strong>Action:</strong> ${rec.action}</p>
                    ${rec.potential ? `<div class="recommendation-savings">💰 ${rec.potential}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Generate recommendations based on financial data
 */
function generateRecommendationsFromData(data) {
    const recommendations = [];
    const monthlyIncome = parseFloat(data.monthly_takehome) || 0;
    
    // Parse expenses safely
    let expenses = {};
    try {
        expenses = (data.expenses && typeof data.expenses === 'string') ? JSON.parse(data.expenses) : (data.expenses || {});
    } catch (e) {
        console.error('Error parsing expenses for recommendations:', e);
        expenses = {};
    }
    
    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const netCashFlow = monthlyIncome - totalExpenses;
    
    // If no income data, suggest completing profile
    if (monthlyIncome === 0) {
        recommendations.push({
            category: 'Getting Started',
            priority: 'high',
            icon: 'fa-rocket',
            title: 'Complete Your Financial Profile',
            description: 'Add your income and expenses to get personalized financial insights.',
            action: 'Go to Settings → Onboarding to complete your financial profile.'
        });
        return recommendations;
    }
    
    // If no expense data, suggest adding it
    if (totalExpenses === 0) {
        recommendations.push({
            category: 'Track Expenses',
            priority: 'medium',
            icon: 'fa-receipt',
            title: 'Start Tracking Your Expenses',
            description: 'Add your monthly expenses to see where your money is going.',
            action: 'Complete the expenses section in your onboarding to get detailed insights.'
        });
    }
    
    // Housing cost analysis (only if we have expense data)
    if (expenses.housing && parseFloat(expenses.housing) > 0) {
        const housingPercent = (parseFloat(expenses.housing) / monthlyIncome) * 100;
        if (housingPercent > 30) {
            recommendations.push({
                category: 'Housing',
                priority: 'high',
                icon: 'fa-home',
                title: 'Housing Costs Too High',
                description: `Your housing costs (${housingPercent.toFixed(1)}%) exceed the recommended 30% of income.`,
                action: 'Consider refinancing, downsizing, or finding a roommate to reduce costs.',
                potential: `Could save $${Math.round(expenses.housing - (monthlyIncome * 0.30))}/month`
            });
        }
    }
    
    // Savings recommendation (only if we have expense data)
    if (totalExpenses > 0) {
        if (netCashFlow > 0 && netCashFlow < monthlyIncome * 0.20) {
            recommendations.push({
                category: 'Savings',
                priority: 'medium',
                icon: 'fa-piggy-bank',
                title: 'Increase Savings Rate',
                description: `You're saving ${((netCashFlow/monthlyIncome)*100).toFixed(1)}% of income. Aim for 20% or more.`,
                action: 'Review your discretionary spending and automate savings transfers.',
                potential: `Target: $${Math.round(monthlyIncome * 0.20)}/month`
            });
        }
        
        // Negative cash flow
        if (netCashFlow < 0) {
            recommendations.push({
                category: 'Budget',
                priority: 'high',
                icon: 'fa-exclamation-triangle',
                title: 'Spending Exceeds Income',
                description: `You're spending $${Math.abs(Math.round(netCashFlow))} more than you earn each month.`,
                action: 'Review all expenses and identify areas to cut back immediately.',
                potential: `Need to reduce spending by $${Math.abs(Math.round(netCashFlow))}/month`
            });
        }
    }
    
    // If user has good cash flow, give positive feedback
    if (totalExpenses > 0 && netCashFlow >= monthlyIncome * 0.20) {
        recommendations.push({
            category: 'Great Work',
            priority: 'low',
            icon: 'fa-star',
            title: 'Excellent Savings Rate!',
            description: `You're saving ${((netCashFlow/monthlyIncome)*100).toFixed(1)}% of your income - that's fantastic!`,
            action: 'Keep up the great work and consider increasing your investment contributions.'
        });
    }
    
    return recommendations;
}

/**
 * Continue onboarding from specific step and section
 * @param {number} step - The step number (1-5)
 * @param {string} section - Optional section name within step (e.g., 'income', 'expenses', 'subscriptions')
 */
function continueOnboarding(step, section = null) {
    // Save the target step and section in sessionStorage
    sessionStorage.setItem('ifi_onboarding_continue_step', step);
    if (section) {
        sessionStorage.setItem('ifi_onboarding_continue_section', section);
    }
    
    let url = 'onboarding.html?continue=true&step=' + step;
    if (section) {
        url += '&section=' + section;
    }
    
    window.location.href = url;
}

/**
 * Show all missing data prompts when no onboarding data
 */
function showAllMissingDataPrompts() {
    const containers = [
        { id: 'incomeBreakdownContainer', step: 3, section: 'income', title: 'No Income Data', message: 'Add your income information to see the breakdown' },
        { id: 'cashFlowVisualContainer', step: 3, section: 'income', title: 'No Cash Flow Data', message: 'Complete your financial profile to see cash flow visualization' },
        { id: 'expensesListContainer', step: 3, section: 'expenses', title: 'No Expense Data', message: 'Add your monthly expenses to see the breakdown' },
        { id: 'budgetPieContainer', step: 3, section: 'expenses', title: 'No Budget Data', message: 'Complete your expense information to see budget distribution' },
        { id: 'subscriptionsContainer', step: 3, section: 'subscriptions', title: 'No Subscription Data', message: 'Add your subscriptions to track recurring expenses' },
        { id: 'incomeVsExpensesChart', step: 3, title: 'No Income Data', message: 'Complete onboarding to see income vs expenses analysis' },
        { id: 'healthScoreContainer', step: 3, title: 'No Financial Data', message: 'Complete onboarding to see your financial health score' },
        { id: 'recommendationsContainer', step: 3, title: 'No Data for Recommendations', message: 'Complete onboarding to get personalized recommendations' }
    ];
    
    containers.forEach(({id, step, title, message}) => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = createMissingDataPrompt(
                title,
                message,
                step
            );
        }
    });
}

/**
 * Utility: Capitalize first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeVisualizations();
});
