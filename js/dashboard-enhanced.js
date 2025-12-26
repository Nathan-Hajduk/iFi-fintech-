/**
 * Enhanced Dashboard Features
 * Adds animated visualizations, personalized recommendations, and insights
 */

// ============ Expense Pie Chart Visualization ============
function generateExpenseChart() {
    if (!onboardingData || !onboardingData.expenses) return;
    
    const expenses = onboardingData.expenses;
    const expenseData = [
        { label: 'Housing', value: expenses.housing || 0, color: '#3498db', icon: 'fa-home' },
        { label: 'Utilities', value: expenses.utilities || 0, color: '#9b59b6', icon: 'fa-bolt' },
        { label: 'Food', value: expenses.food || 0, color: '#e74c3c', icon: 'fa-utensils' },
        { label: 'Transportation', value: expenses.transportation || 0, color: '#f39c12', icon: 'fa-car' },
        { label: 'Insurance', value: expenses.insurance || 0, color: '#1abc9c', icon: 'fa-shield-alt' },
        { label: 'Other', value: expenses.other || 0, color: '#95a5a6', icon: 'fa-ellipsis-h' }
    ].filter(item => item.value > 0);
    
    const total = expenseData.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;
    
    // Calculate percentages and angles
    let currentAngle = -90; // Start from top
    expenseData.forEach(item => {
        item.percentage = (item.value / total) * 100;
        item.startAngle = currentAngle;
        item.endAngle = currentAngle + (item.percentage / 100) * 360;
        currentAngle = item.endAngle;
    });
    
    // Create SVG pie chart
    const chartContainer = document.getElementById('expenseChartContainer');
    if (!chartContainer) return;
    
    const size = 280;
    const center = size / 2;
    const radius = size / 2 - 20;
    
    let svgPaths = '';
    expenseData.forEach((item, index) => {
        const path = describeArc(center, center, radius, item.startAngle, item.endAngle);
        svgPaths += `
            <path 
                d="${path}" 
                fill="${item.color}" 
                class="pie-slice" 
                data-index="${index}"
                style="animation-delay: ${index * 0.1}s"
            />
        `;
    });
    
    chartContainer.innerHTML = `
        <svg viewBox="0 0 ${size} ${size}" class="expense-pie-chart">
            <g class="pie-segments">${svgPaths}</g>
        </svg>
        <div class="expense-legend">
            ${expenseData.map((item, index) => `
                <div class="legend-item" data-index="${index}">
                    <div class="legend-color" style="background: ${item.color}"></div>
                    <div class="legend-label">
                        <i class="fas ${item.icon}"></i>
                        <span>${item.label}</span>
                    </div>
                    <div class="legend-value">
                        <span class="amount">${formatCurrency(item.value)}</span>
                        <span class="percentage">${item.percentage.toFixed(1)}%</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add hover interactions
    setupChartInteractions(expenseData);
}

// Helper function to create SVG arc path
function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function setupChartInteractions(expenseData) {
    const slices = document.querySelectorAll('.pie-slice');
    const legendItems = document.querySelectorAll('.legend-item');
    
    slices.forEach((slice, index) => {
        slice.addEventListener('mouseenter', () => {
            slice.style.transform = 'scale(1.05)';
            slice.style.filter = 'brightness(1.2)';
            legendItems[index].classList.add('highlighted');
        });
        
        slice.addEventListener('mouseleave', () => {
            slice.style.transform = 'scale(1)';
            slice.style.filter = 'none';
            legendItems[index].classList.remove('highlighted');
        });
    });
    
    legendItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            slices[index].style.transform = 'scale(1.05)';
            slices[index].style.filter = 'brightness(1.2)';
            item.classList.add('highlighted');
        });
        
        item.addEventListener('mouseleave', () => {
            slices[index].style.transform = 'scale(1)';
            slices[index].style.filter = 'none';
            item.classList.remove('highlighted');
        });
    });
}

// ============ Enhanced Financial Recommendations ============
function generateEnhancedRecommendations() {
    if (!onboardingData) return;
    
    const recommendations = [];
    const monthlyIncome = getMonthlyIncome();
    const totalExpenses = getMonthlyExpenses();
    const netCashFlow = monthlyIncome - totalExpenses;
    const expenses = onboardingData.expenses || {};
    
    // Housing cost analysis
    if (expenses.housing) {
        const housingPercent = (expenses.housing / monthlyIncome) * 100;
        if (housingPercent > 30) {
            recommendations.push({
                category: 'Housing',
                priority: 'high',
                icon: 'fa-home',
                title: 'Housing Costs Too High',
                description: `Your housing costs (${housingPercent.toFixed(1)}%) exceed the recommended 30% of income.`,
                action: 'Consider refinancing, downsizing, or finding a roommate to reduce costs.',
                potential: `Could save ${formatCurrency(expenses.housing - (monthlyIncome * 0.30))}/month`
            });
        }
    }
    
    // Transportation analysis
    if (expenses.transportation) {
        const transportPercent = (expenses.transportation / monthlyIncome) * 100;
        if (transportPercent > 15) {
            recommendations.push({
                category: 'Transportation',
                priority: 'medium',
                icon: 'fa-car',
                title: 'High Transportation Costs',
                description: `Transportation is ${transportPercent.toFixed(1)}% of your income.`,
                action: 'Explore carpooling, public transit, or refinancing your auto loan.',
                potential: `Could save ${formatCurrency(expenses.transportation * 0.25)}/month`
            });
        }
    }
    
    // Food spending analysis
    if (expenses.food) {
        const foodPercent = (expenses.food / monthlyIncome) * 100;
        if (foodPercent > 15) {
            recommendations.push({
                category: 'Food',
                priority: 'medium',
                icon: 'fa-utensils',
                title: 'Food Budget Optimization',
                description: `Food expenses are ${foodPercent.toFixed(1)}% of income.`,
                action: 'Meal planning and cooking at home can reduce dining costs by 30-40%.',
                potential: `Could save ${formatCurrency(expenses.food * 0.35)}/month`
            });
        }
    }
    
    // Emergency fund recommendation
    const emergencyFund = onboardingData.assets?.cash || 0;
    const emergencyFundTarget = totalExpenses * 6;
    if (emergencyFund < emergencyFundTarget) {
        recommendations.push({
            category: 'Savings',
            priority: netCashFlow > 0 ? 'high' : 'medium',
            icon: 'fa-piggy-bank',
            title: 'Build Emergency Fund',
            description: `You have ${formatCurrency(emergencyFund)} in emergency savings. Target: ${formatCurrency(emergencyFundTarget)} (6 months expenses).`,
            action: `Set aside ${formatCurrency(Math.min(netCashFlow * 0.2, (emergencyFundTarget - emergencyFund) / 12))}/month until funded.`,
            potential: `Reach goal in ${Math.ceil((emergencyFundTarget - emergencyFund) / (netCashFlow * 0.2))} months`
        });
    }
    
    // Investment recommendation
    if (!onboardingData.investments || onboardingData.investments.length === 0) {
        if (netCashFlow > 500) {
            recommendations.push({
                category: 'Investing',
                priority: 'medium',
                icon: 'fa-chart-line',
                title: 'Start Investing',
                description: 'You have positive cash flow but no investments yet.',
                action: 'Start with low-cost index funds or a retirement account (401k/IRA).',
                potential: `Investing $${Math.round(netCashFlow * 0.15)}/month could grow to ${formatCurrency(Math.round(netCashFlow * 0.15) * 12 * 10 * 1.07)} in 10 years`
            });
        }
    }
    
    // Debt payoff strategy
    if (onboardingData.debts) {
        const d = onboardingData.debts;
        const totalDebt = (d.credit || 0) + (d.student || 0) + (d.auto || 0) + (d.other || 0);
        if (totalDebt > 0 && netCashFlow > 0) {
            const extraPayment = netCashFlow * 0.3;
            recommendations.push({
                category: 'Debt',
                priority: 'high',
                icon: 'fa-credit-card',
                title: 'Accelerate Debt Payoff',
                description: `You have ${formatCurrency(totalDebt)} in debt.`,
                action: `Apply ${formatCurrency(extraPayment)}/month extra to your highest-interest debt first (avalanche method).`,
                potential: `Could save thousands in interest and be debt-free faster`
            });
        }
    }
    
    // Income optimization
    if (selectedPeriod === 'annual' && monthlyIncome < 5000) {
        recommendations.push({
            category: 'Income',
            priority: 'medium',
            icon: 'fa-arrow-trend-up',
            title: 'Grow Your Income',
            description: 'Your income is below the national median.',
            action: 'Consider asking for a raise, switching jobs, or starting a side hustle.',
            potential: 'A 10% raise would add ' + formatCurrency(monthlyIncome * 12 * 0.1) + ' annually'
        });
    }
    
    return recommendations;
}

function renderRecommendations() {
    const container = document.getElementById('recommendationsContainer');
    if (!container) return;
    
    const recommendations = generateEnhancedRecommendations();
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>You're doing great! No urgent recommendations at this time.</p>
            </div>
        `;
        return;
    }
    
    // Sort by priority
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    container.innerHTML = recommendations.map((rec, index) => `
        <div class="recommendation-card ${rec.priority}" style="animation-delay: ${index * 0.1}s">
            <div class="rec-header">
                <div class="rec-icon">
                    <i class="fas ${rec.icon}"></i>
                </div>
                <div class="rec-title-section">
                    <h4>${rec.title}</h4>
                    <span class="rec-priority priority-${rec.priority}">${rec.priority} priority</span>
                </div>
            </div>
            <p class="rec-description">${rec.description}</p>
            <div class="rec-action">
                <i class="fas fa-lightbulb"></i>
                <span>${rec.action}</span>
            </div>
            ${rec.potential ? `
                <div class="rec-potential">
                    <i class="fas fa-chart-line"></i>
                    <span>${rec.potential}</span>
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Add slide-in animation
    const cards = container.querySelectorAll('.recommendation-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('visible');
        }, index * 100);
    });
}

// ============ Financial Health Details ============
function renderHealthBreakdown() {
    if (!onboardingData) return;
    
    const monthlyIncome = getMonthlyIncome();
    const totalExpenses = getMonthlyExpenses();
    const netCashFlow = monthlyIncome - totalExpenses;
    const savingsRate = monthlyIncome > 0 ? (netCashFlow / monthlyIncome) * 100 : 0;
    
    const expenses = onboardingData.expenses || {};
    const totalDebt = onboardingData.debts ? 
        (onboardingData.debts.credit || 0) + 
        (onboardingData.debts.student || 0) + 
        (onboardingData.debts.auto || 0) + 
        (onboardingData.debts.other || 0) : 0;
    
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0;
    
    // Calculate scores for each category
    const scores = {
        savings: calculateSavingsScore(savingsRate),
        spending: calculateSpendingScore(expenses, monthlyIncome),
        debt: calculateDebtScore(debtToIncomeRatio),
        investment: calculateInvestmentScore()
    };
    
    const overallScore = Math.round((scores.savings + scores.spending + scores.debt + scores.investment) / 4);
    
    const scoreBreakdown = document.getElementById('scoreBreakdown');
    if (scoreBreakdown) {
        scoreBreakdown.innerHTML = `
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-piggy-bank"></i>
                    <span>Savings Rate</span>
                </div>
                <div class="score-bar-container">
                    <div class="score-bar" style="width: ${scores.savings}%; background: ${getScoreColor(scores.savings)}"></div>
                </div>
                <span class="score-number">${scores.savings}/100</span>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-receipt"></i>
                    <span>Spending Control</span>
                </div>
                <div class="score-bar-container">
                    <div class="score-bar" style="width: ${scores.spending}%; background: ${getScoreColor(scores.spending)}"></div>
                </div>
                <span class="score-number">${scores.spending}/100</span>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-credit-card"></i>
                    <span>Debt Management</span>
                </div>
                <div class="score-bar-container">
                    <div class="score-bar" style="width: ${scores.debt}%; background: ${getScoreColor(scores.debt)}"></div>
                </div>
                <span class="score-number">${scores.debt}/100</span>
            </div>
            <div class="score-item">
                <div class="score-label">
                    <i class="fas fa-chart-line"></i>
                    <span>Investment Activity</span>
                </div>
                <div class="score-bar-container">
                    <div class="score-bar" style="width: ${scores.investment}%; background: ${getScoreColor(scores.investment)}"></div>
                </div>
                <span class="score-number">${scores.investment}/100</span>
            </div>
        `;
        
        // Animate score bars
        setTimeout(() => {
            document.querySelectorAll('.score-bar').forEach(bar => {
                bar.style.transition = 'width 1s ease-out';
            });
        }, 100);
    }
    
    // Update overall score display
    const scoreValue = document.querySelector('.score-value');
    if (scoreValue) {
        animateNumber(scoreValue, 0, overallScore, 1500);
        
        const scoreCircle = document.getElementById('healthScore');
        if (scoreCircle) {
            scoreCircle.style.setProperty('--score-color', getScoreColor(overallScore));
            scoreCircle.style.setProperty('--score-percent', overallScore + '%');
        }
    }
}

function calculateSavingsScore(savingsRate) {
    if (savingsRate >= 20) return 100;
    if (savingsRate >= 15) return 85;
    if (savingsRate >= 10) return 70;
    if (savingsRate >= 5) return 50;
    if (savingsRate > 0) return 30;
    return 10;
}

function calculateSpendingScore(expenses, income) {
    if (income === 0) return 50;
    const housingRatio = (expenses.housing || 0) / income;
    let score = 100;
    if (housingRatio > 0.30) score -= 20;
    if (housingRatio > 0.40) score -= 20;
    if ((expenses.food || 0) / income > 0.15) score -= 15;
    if ((expenses.transportation || 0) / income > 0.15) score -= 15;
    return Math.max(score, 0);
}

function calculateDebtScore(debtToIncomeRatio) {
    if (debtToIncomeRatio === 0) return 100;
    if (debtToIncomeRatio < 20) return 90;
    if (debtToIncomeRatio < 36) return 75;
    if (debtToIncomeRatio < 50) return 50;
    return 25;
}

function calculateInvestmentScore() {
    if (!onboardingData) return 50;
    if (onboardingData.investments && onboardingData.investments.length > 0) {
        return 80 + (Math.min(onboardingData.investments.length, 5) * 4);
    }
    if (onboardingData.portfolioValue && onboardingData.portfolioValue > 0) {
        return 70;
    }
    return 30;
}

function getScoreColor(score) {
    if (score >= 80) return '#1abc9c';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
}

function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ============ Initialize Enhanced Features ============
function initializeEnhancedDashboard() {
    // Wait for onboarding data to load
    setTimeout(() => {
        generateExpenseChart();
        renderRecommendations();
        renderHealthBreakdown();
    }, 300);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedDashboard);
} else {
    initializeEnhancedDashboard();
}
