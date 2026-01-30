/**
 * Debt Manager - Strategic Debt Payoff Planning
 * Comprehensive debt tracking with avalanche/snowball comparison
 */

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const hasData = await checkPageData('debt');
        if (!hasData) {
            showCompleteOnboardingMessage('debt', 'debt', 'Take control of your debt with strategic payoff planning and visualizations.');
            return;
        }
        await loadDebtData();
    } catch (error) {
        console.error('Debt page error:', error);
    }
});

async function loadDebtData() {
    const data = await fetchOnboardingDataFromBackend();
    if (!data) return;
    
    let debts = [];
    if (data.debts) {
        try {
            debts = typeof data.debts === 'string' ? JSON.parse(data.debts) : data.debts;
            if (!Array.isArray(debts)) debts = [];
        } catch (e) { 
            console.error('Error parsing debts:', e);
            debts = []; 
        }
    }
    
    if (debts.length === 0) {
        showCompleteOnboardingMessage('debt', 'debt', 'Add your debts to start tracking and get payoff strategies!');
        return;
    }
    
    // Calculate metrics
    const totalDebt = debts.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + (parseFloat(d.minPayment) || 0), 0);
    const avgInterestRate = debts.reduce((sum, d) => sum + (parseFloat(d.interestRate) || 0), 0) / debts.length;
    
    // Update summary cards
    updateSummaryCards(totalDebt, debts.length, totalMinPayment, avgInterestRate);
    
    // Render debt list
    renderDebtList(debts);
    
    // Calculate and display payoff strategies
    calculatePayoffStrategies(debts, data.monthly_takehome || 0);
    
    // Render debt breakdown chart
    renderDebtChart(debts);
    
    console.log('Debt data loaded:', debts);
}

function updateSummaryCards(totalDebt, debtCount, totalMinPayment, avgRate) {
    // Total Debt
    const totalCard = document.querySelector('.summary-card:nth-child(1) .big-number');
    if (totalCard) totalCard.textContent = formatCurrency(totalDebt);
    
    // Number of Debts
    const countCard = document.querySelector('.summary-card:nth-child(2) .big-number');
    if (countCard) countCard.textContent = debtCount;
    
    // Monthly Minimum
    const minCard = document.querySelector('.summary-card:nth-child(3) .big-number');
    if (minCard) minCard.textContent = formatCurrency(totalMinPayment);
    
    // Average Interest Rate
    const rateCard = document.querySelector('.summary-card:nth-child(4) .big-number');
    if (rateCard) rateCard.textContent = avgRate.toFixed(2) + '%';
}

function renderDebtList(debts) {
    const container = document.getElementById('debtListContainer');
    if (!container) return;
    
    // Sort by balance (highest first)
    const sortedDebts = [...debts].sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
    
    const html = sortedDebts.map(debt => {
        const balance = parseFloat(debt.balance) || 0;
        const rate = parseFloat(debt.interestRate) || 0;
        const minPayment = parseFloat(debt.minPayment) || 0;
        
        return `
            <div class="debt-card">
                <div class="debt-header">
                    <div class="debt-type">
                        <i class="fas ${getDebtIcon(debt.type)}"></i>
                        <h3>${debt.name || debt.type}</h3>
                    </div>
                    <div class="debt-balance">${formatCurrency(balance)}</div>
                </div>
                <div class="debt-details">
                    <div class="debt-stat">
                        <span class="stat-label">Interest Rate</span>
                        <span class="stat-value">${rate.toFixed(2)}%</span>
                    </div>
                    <div class="debt-stat">
                        <span class="stat-label">Min Payment</span>
                        <span class="stat-value">${formatCurrency(minPayment)}</span>
                    </div>
                    <div class="debt-stat">
                        <span class="stat-label">Monthly Interest</span>
                        <span class="stat-value">${formatCurrency(balance * (rate / 100 / 12))}</span>
                    </div>
                </div>
                <div class="debt-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (minPayment / balance * 100) * 12)}%"></div>
                    </div>
                    <span class="progress-label">Payment to balance ratio</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function calculatePayoffStrategies(debts, monthlyIncome) {
    const container = document.getElementById('payoffStrategiesContainer');
    if (!container) return;
    
    const totalMinPayment = debts.reduce((sum, d) => sum + (parseFloat(d.minPayment) || 0), 0);
    const extraPayment = Math.max(0, (monthlyIncome * 0.1) - totalMinPayment); // Assume 10% of income for debt
    
    // Avalanche Method (highest interest first)
    const avalancheDebts = [...debts].sort((a, b) => parseFloat(b.interestRate) - parseFloat(a.interestRate));
    const avalancheResult = calculatePayoffTimeline(avalancheDebts, extraPayment);
    
    // Snowball Method (smallest balance first)
    const snowballDebts = [...debts].sort((a, b) => parseFloat(a.balance) - parseFloat(b.balance));
    const snowballResult = calculatePayoffTimeline(snowballDebts, extraPayment);
    
    const html = `
        <div class="strategies-comparison">
            <div class="strategy-card avalanche">
                <div class="strategy-header">
                    <i class="fas fa-mountain"></i>
                    <h3>Avalanche Method</h3>
                    <span class="badge recommended">Lowest Cost</span>
                </div>
                <p class="strategy-description">Pay off highest interest rate debts first. Saves the most money.</p>
                <div class="strategy-stats">
                    <div class="stat">
                        <span class="stat-label">Time to Debt-Free</span>
                        <span class="stat-value">${avalancheResult.months} months</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Interest Paid</span>
                        <span class="stat-value">${formatCurrency(avalancheResult.totalInterest)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Cost</span>
                        <span class="stat-value">${formatCurrency(avalancheResult.totalPaid)}</span>
                    </div>
                </div>
            </div>
            
            <div class="strategy-card snowball">
                <div class="strategy-header">
                    <i class="fas fa-snowflake"></i>
                    <h3>Snowball Method</h3>
                    <span class="badge">Motivational</span>
                </div>
                <p class="strategy-description">Pay off smallest balances first. Builds momentum with quick wins.</p>
                <div class="strategy-stats">
                    <div class="stat">
                        <span class="stat-label">Time to Debt-Free</span>
                        <span class="stat-value">${snowballResult.months} months</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Interest Paid</span>
                        <span class="stat-value">${formatCurrency(snowballResult.totalInterest)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Total Cost</span>
                        <span class="stat-value">${formatCurrency(snowballResult.totalPaid)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="savings-comparison">
            <div class="savings-card">
                <i class="fas fa-piggy-bank"></i>
                <div class="savings-content">
                    <h4>Potential Savings with Avalanche</h4>
                    <p class="savings-amount">${formatCurrency(snowballResult.totalInterest - avalancheResult.totalInterest)}</p>
                    <p class="savings-description">Save this amount in interest by choosing avalanche over snowball</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function calculatePayoffTimeline(debts, extraPayment) {
    let remainingDebts = debts.map(d => ({
        balance: parseFloat(d.balance),
        rate: parseFloat(d.interestRate) / 100 / 12,
        minPayment: parseFloat(d.minPayment)
    }));
    
    let months = 0;
    let totalInterest = 0;
    let totalPaid = 0;
    const maxMonths = 360; // 30-year cap
    
    while (remainingDebts.length > 0 && months < maxMonths) {
        months++;
        let availableExtra = extraPayment;
        
        // Apply minimum payments to all debts
        remainingDebts = remainingDebts.map(debt => {
            const interest = debt.balance * debt.rate;
            const principal = Math.min(debt.minPayment - interest, debt.balance);
            
            totalInterest += interest;
            totalPaid += debt.minPayment;
            
            return {
                ...debt,
                balance: Math.max(0, debt.balance - principal)
            };
        });
        
        // Apply extra payment to first debt (already sorted by strategy)
        if (remainingDebts.length > 0 && availableExtra > 0) {
            const extraToPrincipal = Math.min(availableExtra, remainingDebts[0].balance);
            remainingDebts[0].balance -= extraToPrincipal;
            totalPaid += extraToPrincipal;
        }
        
        // Remove paid-off debts
        remainingDebts = remainingDebts.filter(d => d.balance > 0.01);
    }
    
    return { months, totalInterest, totalPaid };
}

function renderDebtChart(debts) {
    const canvas = document.getElementById('debtBreakdownChart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (window.debtChartInstance) {
        window.debtChartInstance.destroy();
    }
    
    const labels = debts.map(d => d.name || d.type);
    const data = debts.map(d => parseFloat(d.balance) || 0);
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308',
        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
    ];
    
    window.debtChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#0a0e27',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#e8eef9',
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function getDebtIcon(type) {
    const icons = {
        'credit-card': 'fa-credit-card',
        'student-loan': 'fa-graduation-cap',
        'mortgage': 'fa-home',
        'auto-loan': 'fa-car',
        'personal-loan': 'fa-hand-holding-usd',
        'medical': 'fa-hospital',
        'other': 'fa-file-invoice-dollar'
    };
    return icons[type] || 'fa-file-invoice-dollar';
}

function formatCurrency(amt) {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0}).format(amt);
}

// Disclaimer
console.log('%c💡 Debt Payoff Disclaimer', 'color: #00d4ff; font-size: 14px; font-weight: bold;');
console.log('Payoff calculations are estimates based on your input data. Actual results may vary based on interest rate changes, additional charges, and payment consistency. Consult a financial advisor for personalized debt management strategies.');
