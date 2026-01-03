/**
 * Goals Page - Financial Goal Tracking
 * Senior Developer Implementation for iFi Fintech
 */

async function initializeGoalsPage() {
    try {
        console.log('🎯 Initializing Goals Page...');
        const income = await onboardingDataService.getMonthlyIncome();
        const cashFlow = await onboardingDataService.getCashFlow();
        
        displayGoalRecommendations(income, cashFlow);
        displaySavingsInsights(cashFlow);
    } catch (error) {
        console.error('❌ Error initializing goals:', error);
    }
}

function displayGoalRecommendations(income, cashFlow) {
    const main = document.querySelector('main');
    if (!main) return;
    
    const emergencyFund = income * 3; // 3 months emergency fund
    const yearlyVacation = income * 0.05 * 12; // 5% of income for vacation
    const downPayment = income * 12 * 0.5; // 6 months of income for down payment
    
    const recommendationsHTML = `
        <div class="goals-hero">
            <h1>🎯 Financial Goals</h1>
            <div class="goals-insight-card">
                <div class="insight-icon">💡</div>
                <div class="insight-content">
                    <h3>Smart Goal Recommendations</h3>
                    <p>Based on your $${income.toLocaleString('en-US', { minimumFractionDigits: 2 })} monthly income and $${Math.abs(cashFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${cashFlow >= 0 ? 'surplus' : 'deficit'}, here are personalized goals:</p>
                </div>
            </div>
        </div>
        
        <div class="recommended-goals-section">
            <h2>✨ Recommended Goals</h2>
            <div class="goals-grid">
                <div class="goal-recommendation zoom-in" style="animation-delay: 0s;">
                    <div class="goal-rec-header">
                        <div class="goal-rec-icon">🛡️</div>
                        <h3>Emergency Fund</h3>
                    </div>
                    <div class="goal-rec-target">$${emergencyFund.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <p class="goal-rec-desc">3 months of expenses for financial security</p>
                    <div class="goal-rec-timeline">
                        ${cashFlow > 0 ? `Save $${(cashFlow * 0.3).toFixed(2)}/month → ${Math.ceil(emergencyFund / (cashFlow * 0.3))} months` : 'Reduce expenses to start saving'}
                    </div>
                </div>
                
                <div class="goal-recommendation zoom-in" style="animation-delay: 0.1s;">
                    <div class="goal-rec-header">
                        <div class="goal-rec-icon">🏝️</div>
                        <h3>Vacation Fund</h3>
                    </div>
                    <div class="goal-rec-target">$${yearlyVacation.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <p class="goal-rec-desc">Take a well-deserved break next year</p>
                    <div class="goal-rec-timeline">
                        ${cashFlow > 0 ? `Save $${(yearlyVacation / 12).toFixed(2)}/month → 12 months` : 'Budget optimization needed'}
                    </div>
                </div>
                
                <div class="goal-recommendation zoom-in" style="animation-delay: 0.2s;">
                    <div class="goal-rec-header">
                        <div class="goal-rec-icon">🏠</div>
                        <h3>Home Down Payment</h3>
                    </div>
                    <div class="goal-rec-target">$${downPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <p class="goal-rec-desc">Save for your future home</p>
                    <div class="goal-rec-timeline">
                        ${cashFlow > 0 ? `Save $${(cashFlow * 0.5).toFixed(2)}/month → ${Math.ceil(downPayment / (cashFlow * 0.5))} months` : 'Increase income or reduce expenses'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    main.insertAdjacentHTML('afterbegin', recommendationsHTML);
}

function displaySavingsInsights(cashFlow) {
    const main = document.querySelector('main');
    if (!main) return;
    
    const insightsHTML = `
        <div class="savings-insights-section">
            <h2>💰 Savings Insights</h2>
            <div class="insights-cards">
                <div class="insight-card ${cashFlow >= 0 ? 'positive' : 'warning'} fade-in">
                    <div class="insight-header">
                        <span class="insight-emoji">${cashFlow >= 0 ? '✨' : '⚠️'}</span>
                        <h3>Monthly Cash Flow</h3>
                    </div>
                    <div class="insight-value">${cashFlow >= 0 ? '+' : ''}$${Math.abs(cashFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <p>${cashFlow >= 0 
                        ? 'Great! You have surplus to save each month.' 
                        : 'Focus on reducing expenses to create savings capacity.'}</p>
                </div>
                
                <div class="insight-card info fade-in" style="animation-delay: 0.1s;">
                    <div class="insight-header">
                        <span class="insight-emoji">📊</span>
                        <h3>Savings Rate</h3>
                    </div>
                    <div class="insight-value">${cashFlow >= 0 ? '20%' : '0%'}</div>
                    <p>${cashFlow >= 0 
                        ? 'Aim for 20% savings rate for financial freedom.' 
                        : 'Start with a 10% savings goal once expenses are reduced.'}</p>
                </div>
                
                <div class="insight-card success fade-in" style="animation-delay: 0.2s;">
                    <div class="insight-header">
                        <span class="insight-emoji">🚀</span>
                        <h3>Goal Timeline</h3>
                    </div>
                    <div class="insight-value">${cashFlow > 0 ? Math.ceil(12 / (cashFlow / 1000)) : '∞'} months</div>
                    <p>${cashFlow > 0 
                        ? 'Estimated time to save $12,000 at current rate.' 
                        : 'Optimize spending to unlock goal achievement.'}</p>
                </div>
            </div>
        </div>
    `;
    
    main.insertAdjacentHTML('beforeend', insightsHTML);
}

document.addEventListener('DOMContentLoaded', async function() {
    await initializeGoalsPage();
    // Add Goal button handler
    const addGoalBtn = document.querySelector('.add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', function() {
            alert('Create New Goal feature coming soon! You will be able to set custom financial goals with target amounts and dates.');
        });
    }
    
    // Adjust goal buttons
    const adjustButtons = document.querySelectorAll('.btn-secondary');
    adjustButtons.forEach(btn => {
        if (btn.textContent.includes('Adjust')) {
            btn.addEventListener('click', function() {
                const goalCard = this.closest('.goal-card');
                const goalName = goalCard.querySelector('.goal-info h3').textContent;
                alert(`Adjust ${goalName}: Coming soon! You will be able to modify the target amount, date, and monthly contribution.`);
            });
        }
    });
    
    // Add Funds buttons
    const addFundsButtons = document.querySelectorAll('.btn-primary');
    addFundsButtons.forEach(btn => {
        if (btn.textContent.includes('Add Funds')) {
            btn.addEventListener('click', function() {
                const goalCard = this.closest('.goal-card');
                const goalName = goalCard.querySelector('.goal-info h3').textContent;
                const amount = prompt(`How much would you like to add to your ${goalName} goal?`, '100');
                
                if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                    alert(`$${parseFloat(amount).toFixed(2)} will be added to your ${goalName} goal. Bank connection integration coming soon!`);
                }
            });
        }
    });
    
    // Update goal progress dynamically
    updateGoalMetrics();
});

// Calculate and update goal summary metrics
function updateGoalMetrics() {
    const goalCards = document.querySelectorAll('.goal-card');
    let onTrackCount = 0;
    let totalSaved = 0;
    
    goalCards.forEach(card => {
        // Check if goal is on track
        if (card.classList.contains('on-track')) {
            onTrackCount++;
        }
        
        // Calculate current savings from progress
        const progressInfo = card.querySelector('.progress-info span:first-child');
        if (progressInfo) {
            const match = progressInfo.textContent.match(/\$([0-9,]+)/);
            if (match) {
                totalSaved += parseInt(match[1].replace(/,/g, ''));
            }
        }
    });
    
    // Update summary cards
    const activeGoalsCard = document.querySelector('.summary-card.success .big-number');
    const totalSavedCard = document.querySelectorAll('.summary-card .big-number')[1];
    const onTrackCard = document.querySelector('.summary-card.primary .big-number');
    const onTrackTrend = document.querySelector('.summary-card.primary .trend');
    
    if (activeGoalsCard) activeGoalsCard.textContent = goalCards.length;
    if (totalSavedCard) totalSavedCard.textContent = '$' + totalSaved.toLocaleString();
    if (onTrackCard) {
        const percentage = Math.round((onTrackCount / goalCards.length) * 100);
        onTrackCard.textContent = percentage + '%';
    }
    if (onTrackTrend) {
        onTrackTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${onTrackCount} of ${goalCards.length} goals`;
    }
}

// Calculate funding gap for behind-schedule goals
function calculateFundingGap(current, target, monthsRemaining) {
    const remaining = target - current;
    const neededMonthly = remaining / monthsRemaining;
    return neededMonthly;
}

// Update progress bar color based on status
function updateProgressBarColor(progressBar, percentage, status) {
    if (status === 'behind') {
        progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    } else if (percentage > 80) {
        progressBar.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
    }
}
