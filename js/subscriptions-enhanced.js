/**
 * Subscriptions Page - Enhanced with Onboarding Data
 * Senior Developer Implementation
 */

document.addEventListener('DOMContentLoaded', async function() {
    await initializeSubscriptionsPage();
});

async function initializeSubscriptionsPage() {
    try {
        console.log('🔄 Initializing Subscriptions Page...');
        
        const subscriptions = await onboardingDataService.getSubscriptions();
        const income = await onboardingDataService.getMonthlyIncome();
        
        if (subscriptions && subscriptions.length > 0) {
            displaySubscriptionsOverview(subscriptions, income);
            displaySubscriptionsList(subscriptions);
            displaySubscriptionInsights(subscriptions, income);
        }
        
    } catch (error) {
        console.error('❌ Error initializing subscriptions:', error);
    }
}

function displaySubscriptionsOverview(subscriptions, income) {
    const container = document.querySelector('.subscription-stats') || document.querySelector('main');
    
    const totalCost = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.cost) || 0), 0);
    const percentOfIncome = income > 0 ? (totalCost / income * 100).toFixed(1) : 0;
    const avgCost = totalCost / subscriptions.length;
    
    const overviewHTML = `
        <div class="subscriptions-overview fade-in">
            <h2>🔄 Your Subscriptions</h2>
            <div class="subscription-metrics">
                <div class="sub-metric-card pulse-animation">
                    <div class="metric-icon">💳</div>
                    <div class="metric-value">$${totalCost.toFixed(2)}</div>
                    <div class="metric-label">Total Monthly Cost</div>
                    <div class="metric-subtext">${percentOfIncome}% of income</div>
                </div>
                
                <div class="sub-metric-card">
                    <div class="metric-icon">📊</div>
                    <div class="metric-value">${subscriptions.length}</div>
                    <div class="metric-label">Active Subscriptions</div>
                    <div class="metric-subtext">Being tracked</div>
                </div>
                
                <div class="sub-metric-card">
                    <div class="metric-icon">💰</div>
                    <div class="metric-value">$${avgCost.toFixed(2)}</div>
                    <div class="metric-label">Average Cost</div>
                    <div class="metric-subtext">Per subscription</div>
                </div>
                
                <div class="sub-metric-card ${percentOfIncome > 10 ? 'warning' : 'success'}">
                    <div class="metric-icon">${percentOfIncome > 10 ? '⚠️' : '✅'}</div>
                    <div class="metric-value">${percentOfIncome}%</div>
                    <div class="metric-label">Of Income</div>
                    <div class="metric-subtext">${percentOfIncome > 10 ? 'Consider reducing' : 'Healthy level'}</div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('afterbegin', overviewHTML);
}

function displaySubscriptionsList(subscriptions) {
    const container = document.querySelector('.subscriptions-list') || createSubscriptionsListSection();
    
    const sortedSubs = [...subscriptions].sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost));
    
    container.innerHTML = `
        <h2>📋 Active Subscriptions</h2>
        <p class="section-description">All your recurring monthly expenses in one place</p>
        <div class="subscriptions-grid-enhanced">
            ${sortedSubs.map((sub, index) => {
                const cost = parseFloat(sub.cost) || 0;
                const yearlyTotal = cost * 12;
                
                return `
                    <div class="subscription-card-enhanced zoom-in" style="animation-delay: ${index * 0.05}s;">
                        <div class="sub-card-header">
                            <div class="sub-logo-circle">
                                ${sub.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="sub-info">
                                <h3>${sub.name}</h3>
                                <span class="sub-category">Subscription</span>
                            </div>
                        </div>
                        
                        <div class="sub-pricing">
                            <div class="monthly-cost">
                                <span class="cost-amount">$${cost.toFixed(2)}</span>
                                <span class="cost-period">/month</span>
                            </div>
                            <div class="yearly-cost">
                                $${yearlyTotal.toFixed(2)}/year
                            </div>
                        </div>
                        
                        <div class="sub-actions">
                            <button class="btn-cancel" onclick="alert('Cancel subscription feature coming soon!')">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                            <button class="btn-details" onclick="alert('Subscription details coming soon!')">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function displaySubscriptionInsights(subscriptions, income) {
    const container = document.querySelector('.subscription-insights') || createInsightsSection();
    
    const totalCost = subscriptions.reduce((sum, sub) => sum + (parseFloat(sub.cost) || 0), 0);
    const percentOfIncome = income > 0 ? (totalCost / income * 100) : 0;
    const yearlyTotal = totalCost * 12;
    
    const insights = [];
    
    // High subscription cost warning
    if (percentOfIncome > 10) {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'High Subscription Spending',
            message: `Your subscriptions cost ${percentOfIncome.toFixed(1)}% of income. Financial experts recommend keeping it under 10%. Consider canceling unused services.`
        });
    } else if (percentOfIncome > 5) {
        insights.push({
            type: 'info',
            icon: '💡',
            title: 'Moderate Subscription Usage',
            message: `You're spending ${percentOfIncome.toFixed(1)}% of income on subscriptions. This is reasonable, but review annually to avoid unused services.`
        });
    } else {
        insights.push({
            type: 'success',
            icon: '✅',
            title: 'Healthy Subscription Spending',
            message: `Great job! Your subscriptions are only ${percentOfIncome.toFixed(1)}% of income. You're managing recurring costs well.`
        });
    }
    
    // Yearly cost insight
    insights.push({
        type: 'info',
        icon: '📅',
        title: 'Annual Subscription Cost',
        message: `You'll spend $${yearlyTotal.toFixed(2)} on subscriptions this year. That's enough for ${Math.floor(yearlyTotal / 100)} nice dinners or ${Math.floor(yearlyTotal / 50)} movies!`
    });
    
    // Savings opportunity
    if (subscriptions.length >= 5) {
        const potentialSavings = totalCost * 0.3; // Assume 30% could be saved
        insights.push({
            type: 'success',
            icon: '💰',
            title: 'Savings Opportunity',
            message: `By canceling just 2-3 unused subscriptions, you could save approximately $${potentialSavings.toFixed(2)}/month ($${(potentialSavings * 12).toFixed(2)}/year)!`
        });
    }
    
    container.innerHTML = `
        <h2>💡 Subscription Insights</h2>
        <div class="insights-grid">
            ${insights.map((insight, i) => `
                <div class="insight-card ${insight.type} fade-in" style="animation-delay: ${i * 0.1}s;">
                    <div class="insight-icon">${insight.icon}</div>
                    <div class="insight-content">
                        <h3>${insight.title}</h3>
                        <p>${insight.message}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function createSubscriptionsListSection() {
    const section = document.createElement('div');
    section.className = 'subscriptions-list';
    document.querySelector('main').appendChild(section);
    return section;
}

function createInsightsSection() {
    const section = document.createElement('div');
    section.className = 'subscription-insights';
    document.querySelector('main').appendChild(section);
    return section;
}
