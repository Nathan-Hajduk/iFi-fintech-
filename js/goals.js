/**
 * Goals Page - Financial Goal Tracking & Achievement Planning
 * Comprehensive goal management with progress tracking and timeline projections
 */

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const hasData = await checkPageData('goals');
        if (!hasData) {
            showCompleteOnboardingMessage('goals', '', 'Set clear financial goals and track your progress toward achieving them.');
            return;
        }
        await loadGoalsData();
    } catch (error) {
        console.error('Goals page error:', error);
    }
});

async function loadGoalsData() {
    const data = await fetchOnboardingDataFromBackend();
    if (!data) return;
    
    // Parse goals array from onboarding
    let goals = [];
    if (data.goals) {
        try {
            goals = typeof data.goals === 'string' ? JSON.parse(data.goals) : data.goals;
            if (!Array.isArray(goals)) goals = [];
        } catch (e) {
            console.error('Error parsing goals:', e);
            goals = [];
        }
    }
    
    const primaryGoal = data.goals_primary;
    const monthlySavings = parseFloat(data.monthly_savings_goal) || 0;
    const monthlyIncome = parseFloat(data.monthly_takehome) || 0;
    
    if (goals.length === 0 && !primaryGoal && monthlySavings === 0) {
        showCompleteOnboardingMessage('goals', '', 'Define your financial goals and start your journey!');
        return;
    }
    
    // Add primary goal to goals array if it exists
    if (primaryGoal && !goals.some(g => g.name === primaryGoal)) {
        goals.unshift({
            name: primaryGoal,
            targetAmount: monthlySavings * 12, // Estimate
            currentAmount: monthlySavings * 2, // Estimate 2 months progress
            priority: 'high',
            deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
    }
    
    // Calculate summary metrics
    const totalTarget = goals.reduce((sum, g) => sum + (parseFloat(g.targetAmount) || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + (parseFloat(g.currentAmount) || 0), 0);
    const totalRemaining = totalTarget - totalSaved;
    const avgProgress = goals.length > 0 ? (totalSaved / totalTarget * 100) : 0;
    
    // Update summary cards
    updateSummaryCards(goals.length, totalTarget, totalSaved, avgProgress);
    
    // Render primary goal spotlight
    if (goals.length > 0) {
        renderPrimaryGoalSpotlight(goals[0], monthlySavings);
    }
    
    // Render goals list
    renderGoalsList(goals, monthlySavings);
    
    // Render goals progress chart
    renderGoalsChart(goals);
    
    // Render timeline projection
    renderTimelineProjection(goals, monthlySavings, monthlyIncome);
    
    console.log('Goals data loaded:', goals);
}

function updateSummaryCards(goalCount, totalTarget, totalSaved, avgProgress) {
    // Active Goals
    const countCard = document.querySelector('.summary-card:nth-child(1) .big-number');
    if (countCard) countCard.textContent = goalCount;
    
    // Total Target
    const targetCard = document.querySelector('.summary-card:nth-child(2) .big-number');
    if (targetCard) targetCard.textContent = formatCurrency(totalTarget);
    
    // Total Saved
    const savedCard = document.querySelector('.summary-card:nth-child(3) .big-number');
    if (savedCard) savedCard.textContent = formatCurrency(totalSaved);
    
    // Average Progress
    const progressCard = document.querySelector('.summary-card:nth-child(4) .big-number');
    if (progressCard) progressCard.textContent = avgProgress.toFixed(0) + '%';
}

function renderPrimaryGoalSpotlight(goal, monthlySavings) {
    const container = document.getElementById('primaryGoalSpotlight');
    if (!container) return;
    
    const target = parseFloat(goal.targetAmount) || 0;
    const current = parseFloat(goal.currentAmount) || 0;
    const remaining = target - current;
    const progress = target > 0 ? (current / target * 100) : 0;
    const monthsToGoal = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : 0;
    
    const deadline = goal.deadline ? new Date(goal.deadline) : new Date(Date.now() + monthsToGoal * 30 * 24 * 60 * 60 * 1000);
    const daysRemaining = Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));
    
    const html = `
        <div class="primary-goal-card">
            <div class="goal-spotlight-header">
                <div class="goal-title">
                    <i class="fas fa-star"></i>
                    <h2>${goal.name || 'Primary Goal'}</h2>
                    <span class="priority-badge ${goal.priority || 'high'}">${(goal.priority || 'high').toUpperCase()}</span>
                </div>
                <div class="goal-amount">${formatCurrency(target)}</div>
            </div>
            
            <div class="goal-progress-section">
                <div class="progress-bar-large">
                    <div class="progress-fill-large" style="width: ${Math.min(100, progress)}%">
                        <span class="progress-percentage">${progress.toFixed(0)}%</span>
                    </div>
                </div>
                <div class="progress-stats">
                    <div class="stat">
                        <span class="stat-label">Saved</span>
                        <span class="stat-value">${formatCurrency(current)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Remaining</span>
                        <span class="stat-value">${formatCurrency(remaining)}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Target Date</span>
                        <span class="stat-value">${deadline.toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="goal-projection">
                <div class="projection-item">
                    <i class="fas fa-calendar-check"></i>
                    <div class="projection-content">
                        <h4>Estimated Completion</h4>
                        <p>${monthsToGoal} months (${daysRemaining} days remaining)</p>
                    </div>
                </div>
                <div class="projection-item">
                    <i class="fas fa-piggy-bank"></i>
                    <div class="projection-content">
                        <h4>Monthly Savings Needed</h4>
                        <p>${formatCurrency(monthlySavings)} per month</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderGoalsList(goals, monthlySavings) {
    const container = document.getElementById('goalsListContainer');
    if (!container) return;
    
    // Sort by priority and progress
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const sortedGoals = [...goals].sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
        if (priorityDiff !== 0) return priorityDiff;
        
        const progressA = parseFloat(a.currentAmount) / parseFloat(a.targetAmount);
        const progressB = parseFloat(b.currentAmount) / parseFloat(b.targetAmount);
        return progressB - progressA;
    });
    
    const html = sortedGoals.map((goal, index) => {
        const target = parseFloat(goal.targetAmount) || 0;
        const current = parseFloat(goal.currentAmount) || 0;
        const remaining = target - current;
        const progress = target > 0 ? (current / target * 100) : 0;
        const monthsToGoal = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : 0;
        
        return `
            <div class="goal-card">
                <div class="goal-card-header">
                    <div class="goal-info">
                        <h3>${goal.name || `Goal ${index + 1}`}</h3>
                        <span class="priority-badge ${goal.priority || 'medium'}">${(goal.priority || 'medium').toUpperCase()}</span>
                    </div>
                    <div class="goal-target">${formatCurrency(target)}</div>
                </div>
                
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, progress)}%"></div>
                    </div>
                    <div class="progress-label">${progress.toFixed(1)}% Complete</div>
                </div>
                
                <div class="goal-stats">
                    <div class="stat-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Saved: ${formatCurrency(current)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-bullseye"></i>
                        <span>Remaining: ${formatCurrency(remaining)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <span>${monthsToGoal} months to goal</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function renderGoalsChart(goals) {
    const canvas = document.getElementById('goalsProgressChart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (window.goalsChartInstance) {
        window.goalsChartInstance.destroy();
    }
    
    const labels = goals.map(g => g.name || 'Unnamed Goal');
    const currentAmounts = goals.map(g => parseFloat(g.currentAmount) || 0);
    const targetAmounts = goals.map(g => parseFloat(g.targetAmount) || 0);
    
    window.goalsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Current Progress',
                    data: currentAmounts,
                    backgroundColor: '#00d4ff',
                    borderColor: '#00d4ff',
                    borderWidth: 1
                },
                {
                    label: 'Target Amount',
                    data: targetAmounts,
                    backgroundColor: '#1e3a8a',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e8eef9',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: { color: '#1e293b' }
                },
                x: {
                    ticks: { color: '#e8eef9' },
                    grid: { color: '#1e293b' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#e8eef9', padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

function renderTimelineProjection(goals, monthlySavings, monthlyIncome) {
    const container = document.getElementById('timelineProjection');
    if (!container) return;
    
    // Calculate total months to complete all goals
    const totalRemaining = goals.reduce((sum, g) => {
        const remaining = (parseFloat(g.targetAmount) || 0) - (parseFloat(g.currentAmount) || 0);
        return sum + remaining;
    }, 0);
    
    const monthsToComplete = monthlySavings > 0 ? Math.ceil(totalRemaining / monthlySavings) : 0;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome * 100) : 0;
    
    const html = `
        <div class="timeline-card">
            <h3><i class="fas fa-chart-line"></i> Your Goals Timeline</h3>
            <div class="timeline-stats">
                <div class="timeline-stat">
                    <span class="stat-label">Total Time to Complete All Goals</span>
                    <span class="stat-value">${monthsToComplete} months (${(monthsToComplete / 12).toFixed(1)} years)</span>
                </div>
                <div class="timeline-stat">
                    <span class="stat-label">Your Savings Rate</span>
                    <span class="stat-value">${savingsRate.toFixed(1)}% of income</span>
                </div>
                <div class="timeline-stat">
                    <span class="stat-label">Total Remaining</span>
                    <span class="stat-value">${formatCurrency(totalRemaining)}</span>
                </div>
            </div>
            
            <div class="timeline-recommendation">
                <i class="fas fa-lightbulb"></i>
                <div class="recommendation-content">
                    <h4>💡 Optimization Tip</h4>
                    <p>${getGoalsRecommendation(savingsRate, goals.length)}</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function getGoalsRecommendation(savingsRate, goalCount) {
    if (savingsRate >= 20) {
        return `Excellent! You're saving ${savingsRate.toFixed(0)}% of your income. At this rate, you'll achieve your ${goalCount} goal${goalCount > 1 ? 's' : ''} ahead of schedule. Consider increasing investment contributions for long-term wealth building.`;
    } else if (savingsRate >= 10) {
        return `Good progress! You're saving ${savingsRate.toFixed(0)}% of your income. Try to increase your savings rate to 20% by reducing discretionary spending. Even small increases compound significantly over time.`;
    } else if (savingsRate > 0) {
        return `You're making progress with a ${savingsRate.toFixed(0)}% savings rate. Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Review your budget to find areas to cut back and boost your savings.`;
    } else {
        return `Set a monthly savings goal to start building toward your financial goals. Even starting with 5% of your income can make a big difference over time.`;
    }
}

function formatCurrency(amt) {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0}).format(amt);
}

// Disclaimer
console.log('%c🎯 Goals Tracking Disclaimer', 'color: #00d4ff; font-size: 14px; font-weight: bold;');
console.log('Goal projections are estimates based on your current savings rate and may not account for unexpected expenses, income changes, or market conditions. Regularly review and adjust your goals as your financial situation evolves.');
