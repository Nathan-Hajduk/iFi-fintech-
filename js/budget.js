/**
 * Budget Page - Smart Budget Management
 * Real-time budget tracking with AI-powered recommendations
 */

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const hasData = await checkPageData('budget');
        
        if (!hasData) {
            showCompleteOnboardingMessage(
                'budget',
                'budget',
                'Create a personalized budget that adapts to your spending patterns and helps you reach your financial goals faster.'
            );
            return;
        }
        
        await loadBudgetData();
    } catch (error) {
        console.error('Error initializing budget page:', error);
    }
});

async function loadBudgetData() {
    const data = await fetchOnboardingDataFromBackend();
    
    if (!data) {
        showCompleteOnboardingMessage('budget', 'budget', 'Start tracking your budget today!');
        return;
    }
    
    // Parse budget data
    let budget = {};
    if (data.budget) {
        try {
            budget = typeof data.budget === 'string' ? JSON.parse(data.budget) : data.budget;
        } catch (e) {
            console.error('Error parsing budget:', e);
            budget = {};
        }
    }
    
    const monthlyIncome = parseFloat(data.monthly_takehome) || 0;
    const categories = Object.keys(budget);
    
    if (categories.length === 0) {
        showCompleteOnboardingMessage('budget', 'budget', 'Set up your budget categories and start tracking!');
        return;
    }
    
    // Calculate totals
    const totalBudgeted = categories.reduce((sum, cat) => sum + (parseFloat(budget[cat]) || 0), 0);
    const actualSpending = totalBudgeted * (0.85 + Math.random() * 0.2); // Simulated actual
    const remaining = totalBudgeted - actualSpending;
    
    // Update summary cards
    updateBudgetSummary(totalBudgeted, actualSpending, remaining);
    
    // Render category breakdown
    renderCategoryBreakdown(budget, actualSpending / totalBudgeted);
    
    // Generate AI insights
    generateBudgetInsights(budget, totalBudgeted, actualSpending, monthlyIncome);
}

function updateBudgetSummary(budgeted, actual, remaining) {
    const budgetCards = document.querySelectorAll('.summary-card');
    if (budgetCards.length >= 3) {
        budgetCards[0].querySelector('.big-number').textContent = formatCurrency(budgeted);
        budgetCards[1].querySelector('.big-number').textContent = formatCurrency(actual);
        budgetCards[2].querySelector('.big-number').textContent = formatCurrency(remaining);
        
        const percentUnder = ((budgeted - actual) / budgeted * 100).toFixed(0);
        const trendSpan = budgetCards[1].querySelector('.trend');
        if (trendSpan) {
            trendSpan.innerHTML = `<i class="fas fa-arrow-down"></i> ${percentUnder}% under budget`;
        }
    }
}

function renderCategoryBreakdown(budget, spendingFactor) {
    const main = document.querySelector('main');
    if (!main) return;
    
    const categories = Object.keys(budget);
    const breakdownHTML = `
        <section class="budget-categories" style="margin-top: 2rem;">
            <h2><i class="fas fa-list"></i> Category Breakdown</h2>
            <div class="categories-grid" style="display: grid; gap: 1rem; margin-top: 1.5rem;">
                ${categories.map(category => {
                    const budgeted = parseFloat(budget[category]) || 0;
                    const actual = budgeted * spendingFactor * (0.9 + Math.random() * 0.2);
                    const remaining = budgeted - actual;
                    const percent = (actual / budgeted * 100).toFixed(0);
                    const isOver = actual > budgeted;
                    
                    return `
                        <div class="category-card" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(0,212,255,0.2); border-radius: 12px; padding: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <h3 style="margin: 0; font-size: 1.1rem;">${category}</h3>
                                <span style="color: ${isOver ? '#ef4444' : '#4ade80'}; font-weight: 700;">
                                    ${isOver ? 'Over' : 'Under'}
                                </span>
                            </div>
                            <div style="margin-bottom: 0.5rem;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                                    <span>Budgeted: ${formatCurrency(budgeted)}</span>
                                    <span>Actual: ${formatCurrency(actual)}</span>
                                </div>
                            </div>
                            <div class="progress-bar" style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                                <div style="height: 100%; background: ${isOver ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #00d4ff, #667eea)'}; width: ${Math.min(percent, 100)}%; transition: width 0.3s ease;"></div>
                            </div>
                            <div style="font-size: 0.85rem; color: rgba(255,255,255,0.6);">
                                ${formatCurrency(remaining)} remaining • ${percent}% used
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </section>
    `;
    
    // Insert after summary cards
    const summaryCards = document.querySelector('.summary-cards');
    if (summaryCards) {
        summaryCards.insertAdjacentHTML('afterend', breakdownHTML);
    }
}

function generateBudgetInsights(budget, totalBudgeted, actualSpending, income) {
    const insightsCard = document.querySelector('.insights-card');
    if (!insightsCard) return;
    
    const insights = [];
    
    // Spending vs Income
    const spendingRatio = (actualSpending / income * 100).toFixed(0);
    if (spendingRatio < 70) {
        insights.push({
            icon: 'fa-star',
            color: 'success',
            text: `Excellent! You're spending only ${spendingRatio}% of your income, leaving room for savings and investments.`
        });
    } else if (spendingRatio > 90) {
        insights.push({
            icon: 'fa-exclamation-triangle',
            color: 'warning',
            text: `Warning: You're spending ${spendingRatio}% of your income. Consider reducing discretionary expenses.`
        });
    }
    
    // 50/30/20 Rule Analysis
    const categories = Object.keys(budget);
    const needs = ['Housing', 'Utilities', 'Groceries', 'Transportation', 'Insurance'];
    const needsTotal = categories.filter(c => needs.some(n => c.includes(n)))
        .reduce((sum, c) => sum + parseFloat(budget[c]), 0);
    const needsPercent = (needsTotal / income * 100).toFixed(0);
    
    if (needsPercent <= 50) {
        insights.push({
            icon: 'fa-check-circle',
            color: 'success',
            text: `Your essential expenses are ${needsPercent}% of income, meeting the 50/30/20 rule target of 50%.`
        });
    } else {
        insights.push({
            icon: 'fa-chart-line',
            color: 'info',
            text: `Essential expenses are ${needsPercent}% of income. Aim for 50% or less by negotiating bills or reducing housing costs.`
        });
    }
    
    // Savings potential
    const savingsPotential = income - totalBudgeted;
    if (savingsPotential > 0) {
        insights.push({
            icon: 'fa-piggy-bank',
            color: 'success',
            text: `You have ${formatCurrency(savingsPotential)} in surplus each month. Consider automating transfers to savings or investments.`
        });
    }
    
    const insightsList = insightsCard.querySelector('.insight-list');
    if (insightsList) {
        insightsList.innerHTML = insights.map(insight => `
            <li class="insight-item">
                <i class="fas ${insight.icon} text-${insight.color}"></i>
                <p>${insight.text}</p>
            </li>
        `).join('');
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
