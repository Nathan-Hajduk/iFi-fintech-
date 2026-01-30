/**
 * iFi Financial Tip System
 * Expert financial advice for dashboard widgets
 */

const FINANCIAL_TIPS = {
    income: {
        title: '💰 Income Optimization Tips',
        content: `
            <div class="tip-category">
                <h4><i class="fas fa-arrow-trend-up"></i> Maximize Your Earning Potential</h4>
                <p><strong>Salary Negotiation:</strong> If you've been in your current role for 18+ months without a raise, you're likely leaving 10-15% on the table. Research shows that 70% of people who ask for a raise receive one, yet only 37% actually ask.</p>
                <p><strong>Side Income Streams:</strong> Consider developing a side income that leverages your existing skills. Even $500/month extra equals $6,000 annually - that's a significant boost to savings or investments.</p>
                <p><strong>Tax Optimization:</strong> Are you maximizing tax-advantaged accounts? Contributing to a 401(k), HSA, or IRA can reduce your taxable income while building wealth.</p>
            </div>
            
            <div class="tip-highlight">
                <strong>Pro Tip:</strong> Track your income growth rate annually. A healthy career trajectory should show 3-5% annual income increases minimum, with job changes often yielding 10-20% jumps.
            </div>
            
            <div class="tip-action-items">
                <h4><i class="fas fa-check-circle"></i> Action Steps</h4>
                <ul>
                    <li>Schedule a salary review conversation with your manager within the next 30 days</li>
                    <li>Research your market rate using Glassdoor, Levels.fyi, or PayScale</li>
                    <li>Document your achievements and value add from the past year</li>
                    <li>Increase 401(k) contribution by 1% - you likely won't notice the difference</li>
                    <li>Explore passive income opportunities that align with your skills</li>
                </ul>
            </div>
        `
    },
    
    expenses: {
        title: '💸 Expense Reduction Strategies',
        content: `
            <div class="tip-category">
                <h4><i class="fas fa-scissors"></i> Cut Costs Without Sacrificing Quality of Life</h4>
                <p><strong>The 30-Day Rule:</strong> For any non-essential purchase over $50, wait 30 days. You'll find 40% of these "must-haves" lose their appeal, saving you thousands annually.</p>
                <p><strong>Subscription Audit:</strong> The average American spends $273/month on subscriptions but only actively uses 20% of them. That's over $2,600/year wasted on forgotten services.</p>
                <p><strong>Negotiate Everything:</strong> Insurance, internet, phone bills - all negotiable. A 10-minute call can save $50-100/month ($600-1,200/year).</p>
            </div>
            
            <div class="tip-highlight">
                <strong>80/20 Rule:</strong> Focus on your top 3 expense categories. Reducing these by just 10% often yields more savings than eliminating several small expenses.
            </div>
            
            <div class="tip-action-items">
                <h4><i class="fas fa-check-circle"></i> Action Steps</h4>
                <ul>
                    <li>Review last month's credit card statements - highlight 3 surprise expenses</li>
                    <li>List all active subscriptions and cancel anything unused in 60+ days</li>
                    <li>Call your insurance company - ask "What discounts am I not receiving?"</li>
                    <li>Implement the 24-hour rule for impulse purchases under $50</li>
                    <li>Switch to the cash envelope system for your weakest spending category</li>
                </ul>
            </div>
        `
    },
    
    cashflow: {
        title: '🌊 Cash Flow Management',
        content: `
            <div class="tip-category">
                <h4><i class="fas fa-water"></i> Master Your Financial Flow</h4>
                <p><strong>Positive Cash Flow is Wealth:</strong> It's not about how much you earn - it's about how much you keep. A $100K earner with $2K monthly positive cash flow is wealthier than a $200K earner spending $201K.</p>
                <p><strong>The Cash Flow Acceleration System:</strong> Allocate positive cash flow before it hits your checking account: 20% investments, 10% savings, 5% education/growth, 65% expenses.</p>
                <p><strong>Emergency Cash Buffer:</strong> Maintain 1 month of expenses in checking always. This prevents overdrafts and reduces financial stress by 73% according to behavioral finance studies.</p>
            </div>
            
            <div class="tip-highlight">
                <strong>Wealth Formula:</strong> Consistent positive cash flow + time + compound growth = financial independence. Even $500/month invested at 8% annual returns becomes $370K in 20 years.
            </div>
            
            <div class="tip-action-items">
                <h4><i class="fas fa-check-circle"></i> Action Steps</h4>
                <ul>
                    <li>Set up automatic transfers on payday: 20% to investments, 10% to savings</li>
                    <li>Create separate checking accounts for fixed vs. variable expenses</li>
                    <li>Build a 1-month expense buffer in checking over next 3 months</li>
                    <li>Review cash flow weekly for first month, then monthly thereafter</li>
                    <li>Celebrate positive cash flow milestones - behavior reinforcement works</li>
                </ul>
            </div>
        `
    },
    
    budget: {
        title: '📊 Budget Mastery',
        content: `
            <div class="tip-category">
                <h4><i class="fas fa-chart-pie"></i> Budget Like a Financial Pro</h4>
                <p><strong>The 50/30/20 Framework:</strong> 50% needs (housing, food, utilities), 30% wants (dining out, entertainment), 20% savings/investments. This simple split beats complex budgets 9 times out of 10.</p>
                <p><strong>Budget vs. Actual Analysis:</strong> The gap between planned and actual spending reveals your true financial personality. Most people underestimate dining and entertainment by 40%.</p>
                <p><strong>Zero-Based Budgeting:</strong> Give every dollar a job before the month begins. This doesn't mean spending it all - it means intentionally allocating to expenses, savings, or investments.</p>
            </div>
            
            <div class="tip-highlight">
                <strong>Budget Flexibility:</strong> Build in 5-10% "buffer" for unexpected expenses. A budget that's too rigid leads to failure. Think of it like giving yourself an allowance for life's surprises.
            </div>
            
            <div class="tip-action-items">
                <h4><i class="fas fa-check-circle"></i> Action Steps</h4>
                <ul>
                    <li>Calculate your current needs/wants/savings split - compare to 50/30/20</li>
                    <li>Identify your biggest budget variance - address root cause this month</li>
                    <li>Set up separate savings accounts for each major category (vacation, car, etc.)</li>
                    <li>Review and adjust budget monthly based on actual spending patterns</li>
                    <li>Reward yourself when hitting budget goals - positive reinforcement works</li>
                </ul>
            </div>
        `
    }
};

/**
 * Show tip modal for specific category
 */
function showTip(category) {
    const modal = document.getElementById('tipModal');
    const titleElement = document.getElementById('tipModalTitle');
    const contentElement = document.getElementById('tipModalContent');
    
    const tip = FINANCIAL_TIPS[category];
    if (!tip) {
        console.error('No tip found for category:', category);
        return;
    }
    
    titleElement.textContent = tip.title;
    contentElement.innerHTML = tip.content;
    
    // Show modal with animation
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

/**
 * Close tip modal
 */
function closeTipModal() {
    const modal = document.getElementById('tipModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal when clicking outside of it
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('tipModal');
    const modalContent = modal?.querySelector('.tip-modal');
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTipModal();
            }
        });
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeTipModal();
        }
    });
});
