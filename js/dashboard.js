// ============ Dashboard Initialization ============
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupUserMenu();
    setupPeriodToggle();
    loadOnboardingData();
    generatePersonalizedContent();
});

// ============ User Menu Dropdown ============
function toggleUserMenu() {
    const userMenu = document.querySelector('.user-menu');
    userMenu.classList.toggle('active');
}

function setupUserMenu() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        if (userMenu && !userMenu.contains(e.target)) {
            userMenu.classList.remove('active');
        }
    });
}

// ============ Period Toggle ============
let selectedPeriod = localStorage.getItem('ifi_period') || 'monthly';

function setupPeriodToggle() {
    const buttons = document.querySelectorAll('.period-btn');
    if (!buttons || buttons.length === 0) return;
    // Normalize initial active state
    buttons.forEach(b => b.classList.remove('active'));
    buttons.forEach(btn => {
        if (btn.dataset.period === selectedPeriod) btn.classList.add('active');
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPeriod = btn.dataset.period;
            localStorage.setItem('ifi_period', selectedPeriod);
            // Re-render content sensitive to period
            generateMetrics();
            generateHealthScore();
            generateCashFlow();
            generateInsights();
        });
    });
}

// ============ Initialize Dashboard ============
function initializeDashboard() {
    // Load user info
    const currentUser = JSON.parse(localStorage.getItem('ifi_current_user'));
    if (currentUser) {
        const firstName = currentUser.firstName || currentUser.name?.split(' ')[0] || 'User';
        document.getElementById('user-first-name').textContent = firstName;
        document.getElementById('user-name-header').textContent = firstName;
    }
}

// ============ Load Onboarding Data ============
let onboardingData = null;

function loadOnboardingData() {
    const dataStr = localStorage.getItem('ifi_onboarding_data');
    if (dataStr) {
        try {
            onboardingData = JSON.parse(dataStr);
        } catch (e) {
            console.error('Failed to parse onboarding data:', e);
        }
    }
}

// ============ Generate Personalized Content ============
function generatePersonalizedContent() {
    if (!onboardingData) {
        generateDefaultContent();
        return;
    }

    // Update welcome subtitle based on purpose
    updateWelcomeMessage();
    
    // Generate key metrics (business-aware)
    generateMetrics();
    
    // Generate health score
    generateHealthScore();
    
    // Generate cash flow summary
    generateCashFlow();
    
    // Purpose-specific widgets
    if (onboardingData.purpose === 'business') {
        renderBusinessWidgets();
    } else {
        // Generate budget widget (personal default)
        if (onboardingData.purpose === 'personal' || onboardingData.purpose === 'investing' || onboardingData.purpose === 'debt') {
            generateBudgetWidget();
        }
    }
    
    // Generate investment widget (if has investments)
    if (onboardingData.investments && onboardingData.investments.length > 0) {
        generateInvestmentWidget();
    }
    
    // Generate insights
    generateInsights();
}

function updateWelcomeMessage() {
    const subtitleEl = document.getElementById('welcome-subtitle');
    const purposeMessages = {
        personal: "Here's your personal finance overview",
        business: "Here's your business financial overview",
        investing: "Here's your investment portfolio overview",
        debt: "Here's your debt management overview"
    };
    subtitleEl.textContent = purposeMessages[onboardingData.purpose] || "Here's your financial overview";
}

// ============ Generate Metrics Cards ============
function generateMetrics() {
    const metricsGrid = document.getElementById('metricsGrid');
    if (!metricsGrid) return;

    const monthlyIncome = getMonthlyIncome();
    const totalExpenses = getMonthlyExpenses();
    const netCashFlow = monthlyIncome - totalExpenses;
    
    let metrics = [];
    if (onboardingData.purpose === 'business') {
        const revenue = monthlyIncome;
        const expenses = totalExpenses;
        const profit = netCashFlow;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        metrics = [
            { icon: 'fa-store', iconClass: 'income', label: selectedPeriod === 'annual' ? 'Annual Revenue' : 'Monthly Revenue', value: formatCurrency(selectedPeriod === 'annual' ? revenue * 12 : revenue), change: null },
            { icon: 'fa-file-invoice-dollar', iconClass: 'expense', label: selectedPeriod === 'annual' ? 'Annual Expenses' : 'Monthly Expenses', value: formatCurrency(selectedPeriod === 'annual' ? expenses * 12 : expenses), change: null },
            { icon: 'fa-wallet', iconClass: 'balance', label: selectedPeriod === 'annual' ? 'Annual Profit' : 'Net Profit', value: formatCurrency(selectedPeriod === 'annual' ? profit * 12 : profit), change: { value: (margin>=0?'+':'') + margin.toFixed(1) + '%', positive: margin>=0 } },
            { icon: 'fa-percent', iconClass: 'portfolio', label: 'Profit Margin', value: margin.toFixed(1) + '%', change: null }
        ];
    } else {
        metrics = [
            {
                icon: 'fa-arrow-down',
                iconClass: 'income',
                label: selectedPeriod === 'annual' ? 'Annual Income' : 'Monthly Income',
                value: formatCurrency(selectedPeriod === 'annual' ? monthlyIncome * 12 : monthlyIncome),
                change: null
            },
            {
                icon: 'fa-arrow-up',
                iconClass: 'expense',
                label: selectedPeriod === 'annual' ? 'Annual Expenses' : 'Monthly Expenses',
                value: formatCurrency(selectedPeriod === 'annual' ? totalExpenses * 12 : totalExpenses),
                change: null
            },
            {
                icon: 'fa-wallet',
                iconClass: 'balance',
                label: selectedPeriod === 'annual' ? 'Annual Net Cash' : 'Net Cash Flow',
                value: formatCurrency(selectedPeriod === 'annual' ? netCashFlow * 12 : netCashFlow),
                change: {
                    value: netCashFlow > 0 ? '+' + ((netCashFlow / monthlyIncome) * 100).toFixed(1) + '%' : '-' + Math.abs((netCashFlow / monthlyIncome) * 100).toFixed(1) + '%',
                    positive: netCashFlow > 0
                }
            }
        ];
    }

    // Add portfolio metric if applicable
    if (onboardingData.portfolioValue && onboardingData.portfolioValue > 0) {
        metrics.push({
            icon: 'fa-chart-line',
            iconClass: 'portfolio',
            label: 'Portfolio Value',
            value: formatCurrency(onboardingData.portfolioValue),
            change: { value: '+5.2%', positive: true } // Simulated
        });
    }

    // Add total debt metric for debt purpose
    if (onboardingData.purpose === 'debt' && onboardingData.debts) {
        const d = onboardingData.debts;
        const totalDebt = (d.credit||0)+(d.student||0)+(d.auto||0)+(d.other||0);
        metrics.push({
            icon: 'fa-credit-card',
            iconClass: 'debt',
            label: 'Total Debt',
            value: formatCurrency(totalDebt),
            change: null
        });
    }

    metricsGrid.innerHTML = metrics.map(metric => `
        <div class="metric-card">
            <div class="metric-header">
                <div class="metric-icon ${metric.iconClass}">
                    <i class="fas ${metric.icon}"></i>
                </div>
                <span class="metric-label">${metric.label}</span>
            </div>
            <div class="metric-value">${metric.value}</div>
            ${metric.change ? `
                <div class="metric-change ${metric.change.positive ? 'positive' : 'negative'}">
                    <i class="fas fa-${metric.change.positive ? 'arrow-up' : 'arrow-down'}"></i>
                    <span>${metric.change.value}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// ============ Business Widgets ============
function renderBusinessWidgets() {
    const grid = document.querySelector('.content-grid');
    if (!grid) return;

    // Remove existing business sections before re-render
    grid.querySelectorAll('.assets-overview, .liabilities-overview, .net-worth, .business-kpis').forEach(el => el.remove());

    const assets = onboardingData.business?.assets || {};
    const liabilities = onboardingData.business?.liabilities || {};
    const assetsTotal = getTotal(assets);
    const liabilitiesTotal = getTotal(liabilities);
    const netWorth = assetsTotal - liabilitiesTotal;

    // KPI row
    const kpiWrap = document.createElement('div');
    kpiWrap.className = 'widget business-kpis';
    kpiWrap.innerHTML = `
        ${businessKpiCard('Working Capital', formatCurrency((assets.cash || 0) - (liabilities.payables || 0)), 'Cash - Payables')}
        ${businessKpiCard('Asset/Liability Ratio', ratioDisplay(assetsTotal, liabilitiesTotal), 'Higher is better')}
        ${businessKpiCard('Inventory Value', formatCurrency(assets.inventory || 0), 'Current inventory recorded')}
        ${businessKpiCard('Debt Load', formatCurrency((liabilities.loan||0)+(liabilities.credit||0)), 'Loans + Credit')}
    `;
    grid.prepend(kpiWrap);

    // Assets widget
    const assetsEl = document.createElement('div');
    assetsEl.className = 'widget assets-overview';
    assetsEl.innerHTML = `
        <div class="widget-header"><h3><i class="fas fa-coins"></i> Assets Overview</h3></div>
        <div class="widget-body">
            <div class="balance-list">
                ${balanceItem('Cash', assets.cash)}
                ${balanceItem('Inventory', assets.inventory)}
                ${balanceItem('Equipment', assets.equipment)}
                ${balanceItem('Property', assets.property)}
                ${balanceItem('Other', assets.other)}
            </div>
            <div class="total-row"><span class="total-label">Total Assets</span><span class="total-value">${formatCurrency(assetsTotal)}</span></div>
            ${assetsTotal === 0 ? `<div class="empty-state"><i class='fas fa-circle-info'></i><p>Add your asset balances to see totals.</p><button class='btn-small' onclick="window.location.href='../html/settings.html'">Update Profile</button></div>` : ''}
        </div>
    `;
    grid.appendChild(assetsEl);

    // Liabilities widget
    const liabEl = document.createElement('div');
    liabEl.className = 'widget liabilities-overview';
    liabEl.innerHTML = `
        <div class="widget-header"><h3><i class="fas fa-scale-balanced"></i> Liabilities Overview</h3></div>
        <div class="widget-body">
            <div class="balance-list">
                ${balanceItem('Loans', liabilities.loan)}
                ${balanceItem('Payables', liabilities.payables)}
                ${balanceItem('Credit', liabilities.credit)}
                ${balanceItem('Other', liabilities.other)}
            </div>
            <div class="total-row"><span class="total-label">Total Liabilities</span><span class="total-value">${formatCurrency(liabilitiesTotal)}</span></div>
            ${liabilitiesTotal === 0 ? `<div class="empty-state"><i class='fas fa-circle-info'></i><p>Add your liabilities to see totals.</p><button class='btn-small' onclick="window.location.href='../html/settings.html'">Update Profile</button></div>` : ''}
        </div>
    `;
    grid.appendChild(liabEl);

    // Net Worth widget
    const nwEl = document.createElement('div');
    nwEl.className = 'widget net-worth';
    nwEl.innerHTML = `
        <div class="widget-header"><h3><i class="fas fa-chart-area"></i> Business Net Worth</h3></div>
        <div class="widget-body">
            <div class="cash-flow-summary">
                <div class="cash-flow-item"><div class="cash-flow-item-label">Assets</div><div class="cash-flow-item-value income">${formatCurrency(assetsTotal)}</div></div>
                <div class="cash-flow-item"><div class="cash-flow-item-label">Liabilities</div><div class="cash-flow-item-value expense">${formatCurrency(liabilitiesTotal)}</div></div>
                <div class="cash-flow-item"><div class="cash-flow-item-label">Net Worth</div><div class="cash-flow-item-value net">${formatCurrency(netWorth)}</div></div>
            </div>
        </div>
    `;
    grid.appendChild(nwEl);
}

function businessKpiCard(label, value, sub) {
    return `<div class="business-kpi-card"><div class="business-kpi-label">${label}</div><div class="business-kpi-value">${value}</div><div class="business-kpi-sub">${sub}</div></div>`;
}

function balanceItem(name, value) {
    const v = value || 0;
    return `<div class="balance-item"><span class="balance-name">${name}</span><span class="balance-value">${formatCurrency(v)}</span></div>`;
}

function getTotal(obj) {
    return Object.values(obj || {}).reduce((s, v) => s + (v || 0), 0);
}

function ratioDisplay(a, b) {
    if (!a && !b) return '—';
    if (b === 0) return '∞';
    const r = a / b;
    return r.toFixed(2) + 'x';
}

// ============ Generate Health Score ============
function generateHealthScore() {
    const monthlyIncome = getMonthlyIncome();
    const totalExpenses = getMonthlyExpenses();
    const netCashFlow = monthlyIncome - totalExpenses;
    
    // Calculate health score (0-100)
    let score = 50; // Base score
    
    // Income vs Expenses (up to 30 points)
    const expenseRatio = totalExpenses / monthlyIncome;
    if (expenseRatio < 0.5) score += 30;
    else if (expenseRatio < 0.7) score += 20;
    else if (expenseRatio < 0.9) score += 10;
    
    // Has investments (20 points)
    if (onboardingData.investments && onboardingData.investments.length > 0) {
        score += 20;
    }
    
    // Positive cash flow (20 points)
    if (netCashFlow > 0) {
        score += 20;
    }

    // Business-specific: asset/liability ratio (up to 20 points)
    if (onboardingData.purpose === 'business') {
        const a = getTotal(onboardingData.business?.assets || {});
        const l = getTotal(onboardingData.business?.liabilities || {});
        const ratio = l === 0 ? 3 : a / l; // cap contribution
        if (ratio >= 2.0) score += 20;
        else if (ratio >= 1.5) score += 15;
        else if (ratio >= 1.0) score += 10;
        else if (ratio > 0) score += 5;
    }
    
    score = Math.min(100, Math.max(0, score));
    
    // Update UI
    const scoreElement = document.querySelector('#healthScore .score-value');
    if (scoreElement) {
        scoreElement.textContent = score;
    }
    
    // Generate breakdown
    const breakdownEl = document.getElementById('scoreBreakdown');
    if (breakdownEl) {
        const items = [];
        items.push(`<div class="score-item"><span class="score-item-label">Cash Flow</span><span class="score-item-value">${netCashFlow > 0 ? 'Good' : 'Needs Attention'}</span></div>`);
        items.push(`<div class="score-item"><span class="score-item-label">Expense Ratio</span><span class="score-item-value">${(expenseRatio * 100).toFixed(0)}%</span></div>`);
        items.push(`<div class="score-item"><span class="score-item-label">Investments</span><span class="score-item-value">${onboardingData.investments?.length || 0} types</span></div>`);
        if (onboardingData.purpose === 'business') {
            const a = getTotal(onboardingData.business?.assets || {});
            const l = getTotal(onboardingData.business?.liabilities || {});
            const ratio = l === 0 ? '∞' : (a / l).toFixed(2) + 'x';
            items.push(`<div class="score-item"><span class="score-item-label">Asset/Liability</span><span class="score-item-value">${ratio}</span></div>`);
        }
        breakdownEl.innerHTML = items.join('');
    }
}

// ============ Generate Cash Flow ============
function generateCashFlow() {
    const monthlyIncome = getMonthlyIncome();
    const totalExpenses = getMonthlyExpenses();
    const netCashFlow = monthlyIncome - totalExpenses;
    
    const summaryEl = document.getElementById('cashFlowSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="cash-flow-item">
                <div class="cash-flow-item-label">${selectedPeriod === 'annual' ? 'Annual Income' : 'Income'}</div>
                <div class="cash-flow-item-value income">${formatCurrency(selectedPeriod === 'annual' ? monthlyIncome * 12 : monthlyIncome)}</div>
            </div>
            <div class="cash-flow-item">
                <div class="cash-flow-item-label">${selectedPeriod === 'annual' ? 'Annual Expenses' : 'Expenses'}</div>
                <div class="cash-flow-item-value expense">${formatCurrency(selectedPeriod === 'annual' ? totalExpenses * 12 : totalExpenses)}</div>
            </div>
            <div class="cash-flow-item">
                <div class="cash-flow-item-label">${selectedPeriod === 'annual' ? 'Annual Net' : 'Net'}</div>
                <div class="cash-flow-item-value net">${formatCurrency(selectedPeriod === 'annual' ? netCashFlow * 12 : netCashFlow)}</div>
            </div>
        `;
    }
    
    const chartEl = document.getElementById('cashFlowChart');
    if (chartEl) {
        chartEl.innerHTML = '<i class="fas fa-chart-bar" style="font-size: 3rem; opacity: 0.3;"></i><p style="margin-top: 1rem; opacity: 0.7;">Chart visualization coming soon</p>';
    }
}

// ============ Generate Budget Widget ============
function generateBudgetWidget() {
    const budgetWidget = document.getElementById('budgetWidget');
    if (!budgetWidget || !onboardingData.expenses) return;
    
    budgetWidget.style.display = 'block';
    
    const monthlyIncome = getMonthlyIncome();
    const categoriesEl = document.getElementById('budgetCategories');
    
    const categories = Object.entries(onboardingData.expenses).filter(([_, value]) => value > 0);
    
    categoriesEl.innerHTML = categories.map(([category, amount]) => {
        const budgetAmount = monthlyIncome * 0.15; // Simplified: assume 15% budget per category
        const percentage = (amount / budgetAmount) * 100;
        const isOverBudget = percentage > 100;
        
        return `
            <div class="budget-category">
                <div class="budget-category-header">
                    <span class="budget-category-name">${capitalizeFirst(category)}</span>
                    <span class="budget-category-values">
                        <span class="spent">${formatCurrency(amount)}</span> / ${formatCurrency(budgetAmount)}
                    </span>
                </div>
                <div class="budget-bar">
                    <div class="budget-bar-fill ${isOverBudget ? 'over-budget' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

// ============ Generate Investment Widget ============
function generateInvestmentWidget() {
    const investmentWidget = document.getElementById('investmentWidget');
    if (!investmentWidget) return;
    
    // Show for investing purpose even if no assets yet
    if (onboardingData.purpose === 'investing') {
        investmentWidget.style.display = 'block';
    } else if (!(onboardingData.investments && onboardingData.investments.length > 0)) {
        investmentWidget.style.display = 'none';
        return;
    } else {
        investmentWidget.style.display = 'block';
    }
    
    const portfolioValue = onboardingData.portfolioValue || 50000; // Default if not specified
    const portfolioSummary = document.getElementById('portfolioSummary');
    
    // Simulate allocation percentages
    const allocationMap = {
        stocks: 35,
        etf: 25,
        crypto: 10,
        bonds: 15,
        'real-estate': 10,
        retirement: 5
    };
    
    const assets = onboardingData.investments.map(inv => ({
        name: capitalizeFirst(inv.replace('-', ' ')),
        value: portfolioValue * (allocationMap[inv] || 10) / 100
    }));
    
    portfolioSummary.innerHTML = `
        <div class="portfolio-total">
            <div class="portfolio-total-label">Total Portfolio Value</div>
            <div class="portfolio-total-value">${formatCurrency(portfolioValue)}</div>
            <div class="portfolio-change positive">
                <i class="fas fa-arrow-up"></i>
                <span>+8.5% this month</span>
            </div>
        </div>
        <div class="asset-allocation">
            ${assets.map(asset => `
                <div class="asset-item">
                    <span class="asset-name">${asset.name}</span>
                    <span class="asset-value">${formatCurrency(asset.value)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ============ Generate Insights ============
function generateInsights() {
    const insightList = document.getElementById('insightList');
    if (!insightList) return;
    
    const monthlyIncome = getMonthlyIncome();
    const totalExpenses = getMonthlyExpenses();
    const netCashFlow = monthlyIncome - totalExpenses;
    const savingsRate = (netCashFlow / monthlyIncome) * 100;
    
    const insights = [];
    
    // Savings rate insight
    if (savingsRate > 20) {
        insights.push({
            type: 'success',
            title: 'Great Savings Rate!',
            text: `You're saving ${savingsRate.toFixed(1)}% of your income. Keep up the excellent work!`
        });
    } else if (savingsRate > 0) {
        insights.push({
            type: 'warning',
            title: 'Improve Your Savings',
            text: `You're currently saving ${savingsRate.toFixed(1)}% of your income. Try to aim for 20% or more.`
        });
    } else {
        insights.push({
            type: 'warning',
            title: 'Spending Exceeds Income',
            text: 'Your expenses are higher than your income. Consider reviewing your budget to identify areas to cut back.'
        });
    }
    
    // Investment insight
    if (onboardingData.investments && onboardingData.investments.length > 0) {
        insights.push({
            type: 'success',
            title: 'Diversified Portfolio',
            text: `You're invested in ${onboardingData.investments.length} different asset types. Diversification helps manage risk.`
        });
    } else {
        insights.push({
            type: 'primary',
            title: 'Consider Investing',
            text: 'Start building wealth by investing in stocks, ETFs, or retirement accounts. Even small amounts can grow over time.'
        });
    }
    
    // Purpose-specific insights
    if (onboardingData.purpose === 'debt') {
        insights.push({
            type: 'primary',
            title: 'Debt Management Strategy',
            text: 'Focus on paying off high-interest debt first while making minimum payments on other debts.'
        });
        if (onboardingData.debtStrategy) {
            insights.push({ type: 'primary', title: 'Selected Strategy', text: `You chose ${capitalizeFirst(onboardingData.debtStrategy)}. We\'ll tailor reminders and goals accordingly.` });
        }
    } else if (onboardingData.purpose === 'business') {
        insights.push({ type: 'primary', title: 'Track Cash Flow', text: 'Monitor monthly revenue vs. expenses to optimize profitability.' });
    } else if (onboardingData.purpose === 'investing') {
        const risk = onboardingData.investorProfile?.riskTolerance || 'balanced';
        insights.push({ type: 'primary', title: 'Investment Profile', text: `Your risk profile is ${risk}. We\'ll emphasize matching strategies and assets.` });
    }
    
    insightList.innerHTML = insights.map(insight => `
        <div class="insight-item ${insight.type}">
            <div class="insight-title">
                <i class="fas fa-lightbulb"></i>
                ${insight.title}
            </div>
            <div class="insight-text">${insight.text}</div>
        </div>
    `).join('');
}

// ============ Default Content (No Onboarding Data) ============
function generateDefaultContent() {
    document.getElementById('welcome-subtitle').textContent = "Complete your onboarding to see personalized insights";
    
    // Show empty states or prompts to complete onboarding
    const metricsGrid = document.getElementById('metricsGrid');
    if (metricsGrid) {
        metricsGrid.innerHTML = `
            <div class="metric-card" style="grid-column: 1 / -1;">
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>Complete your onboarding to see personalized financial metrics</p>
                    <button onclick="window.location.href='../html/onboarding.html'" class="btn-small">
                        Complete Onboarding
                    </button>
                </div>
            </div>
        `;
    }
}

// ============ Utility Functions ============
function calculateTotalExpenses() {
    if (!onboardingData || !onboardingData.expenses) return 0;
    return Object.values(onboardingData.expenses).reduce((sum, val) => sum + (val || 0), 0);
}

function getMonthlyIncome() {
    if (!onboardingData) return 0;
    // Prefer business monthly revenue if business purpose else personal annual
    if (onboardingData.purpose === 'business' && onboardingData.business?.revenue != null) {
        return onboardingData.business.revenue || 0;
    }
    const annual = onboardingData.annualIncome || 0;
    return annual / 12;
}

function getMonthlyExpenses() {
    // For now, expenses are captured monthly in onboardingData.expenses
    return calculateTotalExpenses();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============ Logout Function ============
function logout() {
    localStorage.removeItem('ifi_current_user');
    localStorage.removeItem('ifi_onboarding_complete');
    localStorage.removeItem('ifi_onboarding_data');
    window.location.href = '../html/Login.html';
}
