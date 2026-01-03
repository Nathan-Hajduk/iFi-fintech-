/**
 * iFi AI - Personalized Financial Insights
 * Senior Developer Implementation
 */

document.addEventListener('DOMContentLoaded', async function() {
    await initializeIfiAI();
});

async function initializeIfiAI() {
    try {
        console.log('🤖 Initializing iFi AI with user data...');
        
        const data = await onboardingDataService.getData();
        const income = await onboardingDataService.getMonthlyIncome();
        const cashFlow = await onboardingDataService.getCashFlow();
        const netWorth = await onboardingDataService.getNetWorth();
        
        displayPersonalizedGreeting(data, income, cashFlow, netWorth);
        generateAIInsights(data, income, cashFlow, netWorth);
        
    } catch (error) {
        console.error('❌ Error initializing iFi AI:', error);
    }
}

function displayPersonalizedGreeting(data, income, cashFlow, netWorth) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const greeting = document.createElement('div');
    greeting.className = 'message ai-message fade-in';
    greeting.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <p><strong>Welcome back!</strong> I've analyzed your financial profile:</p>
            <div class="ai-insights-summary">
                <div class="insight-metric">
                    <span class="metric-icon">💰</span>
                    <span class="metric-text">Monthly Income: $${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="insight-metric">
                    <span class="metric-icon">${cashFlow >= 0 ? '✨' : '⚠️'}</span>
                    <span class="metric-text">Cash Flow: ${cashFlow >= 0 ? '+' : ''}$${Math.abs(cashFlow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="insight-metric">
                    <span class="metric-icon">${netWorth >= 0 ? '📈' : '📉'}</span>
                    <span class="metric-text">Net Worth: ${netWorth >= 0 ? '+' : ''}$${Math.abs(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
            <p>Based on this data, I can provide personalized advice. What would you like to know?</p>
        </div>
    `;
    
    chatMessages.appendChild(greeting);
}

function generateAIInsights(data, income, cashFlow, netWorth) {
    const container = document.getElementById('aiInsightsContainer') || createInsightsContainer();
    
    const insights = [];
    
    // Cash flow insight
    if (cashFlow < 0) {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Negative Cash Flow Alert',
            message: `You're spending $${Math.abs(cashFlow).toFixed(2)} more than you earn each month. Priority: reduce discretionary expenses or increase income.`,
            action: 'View Budget Optimization'
        });
    } else if (cashFlow > 0) {
        const savingsRate = (cashFlow / income * 100).toFixed(1);
        insights.push({
            type: 'success',
            icon: '✨',
            title: 'Positive Cash Flow',
            message: `Great! You're saving ${savingsRate}% of your income ($${cashFlow.toFixed(2)}/month). Consider investing this surplus.`,
            action: 'Explore Investment Options'
        });
    }
    
    // Net worth insight
    if (netWorth < 0) {
        const debtPayoffMonths = Math.ceil(Math.abs(netWorth) / Math.max(cashFlow, income * 0.1));
        insights.push({
            type: 'info',
            icon: '💪',
            title: 'Debt Elimination Strategy',
            message: `Focus on debt reduction. At current rates, you could be debt-free in ${debtPayoffMonths} months with aggressive payments.`,
            action: 'Create Debt Payoff Plan'
        });
    } else {
        insights.push({
            type: 'success',
            icon: '🎉',
            title: 'Positive Net Worth',
            message: `Excellent! Your assets exceed debts by $${netWorth.toLocaleString()}. Focus on growing this through strategic investments.`,
            action: 'Wealth Building Strategies'
        });
    }
    
    // Income-based recommendations
    if (income > 5000) {
        insights.push({
            type: 'info',
            icon: '📊',
            title: 'Investment Opportunity',
            message: `With your income level, consider maxing out tax-advantaged accounts (401k, IRA) for long-term wealth building.`,
            action: 'Learn About Tax Strategies'
        });
    }
    
    // Emergency fund check
    const expenses = Object.values(data.expenses || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const emergencyMonths = Math.floor((income - expenses) / expenses);
    if (emergencyMonths < 3) {
        insights.push({
            type: 'warning',
            icon: '🛡️',
            title: 'Emergency Fund Priority',
            message: `Build a 3-6 month emergency fund (target: $${(expenses * 3).toLocaleString()}) before aggressive investing.`,
            action: 'Set Up Emergency Fund Goal'
        });
    }
    
    container.innerHTML = `
        <div class="ai-insights-grid">
            <h2>🤖 AI-Powered Insights</h2>
            <div class="insights-list">
                ${insights.map((insight, i) => `
                    <div class="ai-insight-card ${insight.type} zoom-in" style="animation-delay: ${i * 0.1}s;">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-body">
                            <h3>${insight.title}</h3>
                            <p>${insight.message}</p>
                            <button class="insight-action-btn">${insight.action} →</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.querySelector('main').appendChild(container);
}

function createInsightsContainer() {
    const container = document.createElement('div');
    container.id = 'aiInsightsContainer';
    container.className = 'ai-insights-section';
    return container;
}

// Enhanced chat functionality with context awareness
const originalSendMessage = window.sendMessage;
window.sendMessage = async function() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;
    
    const userMessage = input.value.trim();
    input.value = '';
    
    // Display user message
    const chatMessages = document.getElementById('chatMessages');
    const userDiv = document.createElement('div');
    userDiv.className = 'message user-message slide-left';
    userDiv.innerHTML = `
        <div class="message-content">
            <p>${userMessage}</p>
        </div>
        <div class="message-avatar"><i class="fas fa-user"></i></div>
    `;
    chatMessages.appendChild(userDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Generate context-aware response
    setTimeout(async () => {
        const response = await generateContextualResponse(userMessage);
        const aiDiv = document.createElement('div');
        aiDiv.className = 'message ai-message fade-in';
        aiDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <p>${response}</p>
            </div>
        `;
        chatMessages.appendChild(aiDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
};

async function generateContextualResponse(question) {
    const data = await onboardingDataService.getData();
    const income = await onboardingDataService.getMonthlyIncome();
    const cashFlow = await onboardingDataService.getCashFlow();
    
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('budget') || lowerQ.includes('expense')) {
        return `Based on your $${income.toLocaleString()} monthly income, I recommend the 50/30/20 rule: 50% ($${(income * 0.5).toFixed(2)}) for needs, 30% ($${(income * 0.3).toFixed(2)}) for wants, and 20% ($${(income * 0.2).toFixed(2)}) for savings. You currently have a ${cashFlow >= 0 ? 'positive' : 'negative'} cash flow of $${Math.abs(cashFlow).toFixed(2)}/month.`;
    }
    
    if (lowerQ.includes('invest') || lowerQ.includes('stock') || lowerQ.includes('save')) {
        if (cashFlow > 0) {
            return `Great question! With your current surplus of $${cashFlow.toFixed(2)}/month, I recommend starting with low-cost index funds like VOO (S&P 500) or VTI (Total Market). Consider opening a Roth IRA if you haven't already - it offers tax-free growth for retirement.`;
        } else {
            return `Before investing, let's focus on optimizing your cash flow. You're currently spending $${Math.abs(cashFlow).toFixed(2)} more than you earn. Once you have positive cash flow and a 3-month emergency fund, we can explore investment options.`;
        }
    }
    
    if (lowerQ.includes('debt') || lowerQ.includes('loan') || lowerQ.includes('payoff')) {
        const debts = await onboardingDataService.getDebts();
        if (debts && debts.length > 0) {
            const totalDebt = debts.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);
            return `You have $${totalDebt.toLocaleString()} in total debt. I recommend the avalanche method: pay minimums on all debts, then put extra toward the highest interest rate first. This saves the most money long-term.`;
        }
        return `Great news! You don't have any recorded debts. Focus on building wealth through investing and maintaining this debt-free status.`;
    }
    
    if (lowerQ.includes('emergency') || lowerQ.includes('fund')) {
        const expenses = Object.values(data.expenses || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
        const targetFund = expenses * 6;
        return `Your monthly expenses are $${expenses.toFixed(2)}, so a 6-month emergency fund should be $${targetFund.toLocaleString()}. This protects you from job loss or unexpected expenses. Keep it in a high-yield savings account for easy access.`;
    }
    
    return `I'm here to help with your financial questions! Try asking about budgeting, investments, debt payoff, emergency funds, or specific financial goals. I have access to your financial data to provide personalized advice.`;
}
