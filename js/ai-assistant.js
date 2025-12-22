// AI Assistant conversation data and functionality

const conversations = {
    investing: {
        question: "How do I start investing?",
        answer: "Great question! Starting to invest is easier than you think. Here's my personalized roadmap for you:\n\nStep 1: Build Your Foundation\n• Create an emergency fund (3-6 months of expenses)\n• Pay off high-interest debt (credit cards)\n• Understand your risk tolerance\n\nStep 2: Choose Your Investment Vehicle\n• 401(k) - Start here if your employer offers matching (free money!)\n• IRA (Traditional or Roth) - Tax-advantaged retirement accounts\n• Taxable brokerage - For flexible long-term investing\n\nStep 3: Select Your Investments\n• Index Funds/ETFs - Best for beginners (S&P 500, Total Market)\n• Target-Date Funds - Automatic diversification based on retirement year\n• Start with $50-100 - Fractional shares make it accessible\n\nStep 4: Automate & Stay Consistent\n• Set up automatic monthly contributions\n• Use dollar-cost averaging to reduce timing risk\n• Invest for the long term (10+ years)\n\nPro Tip: Time in the market beats timing the market. Starting with $200/month at age 25 can grow to over $1 million by retirement!"
    },
    stocks: {
        question: "What are stocks and how do they work?",
        answer: "Stocks represent ownership in a company. When you buy shares, you become a partial owner of that business!\n\nHow Stocks Make You Money:\n\n1. Capital Appreciation\n   • Buy low, sell high\n   • Stock price increases as company grows\n   • Historical average: ~10% annual return (S&P 500)\n\n2. Dividends\n   • Quarterly cash payments from company profits\n   • Can be reinvested for compound growth\n   • Typical yield: 1-3% annually\n\nHow Stock Prices Work:\n• Determined by supply and demand\n• Influenced by company performance, news, and market sentiment\n• Trade on exchanges (NYSE, NASDAQ) during market hours\n\nTypes of Stocks:\n• Growth stocks - High potential, higher risk (Tesla, Amazon)\n• Value stocks - Undervalued, steady growth (Coca-Cola, Walmart)\n• Dividend stocks - Regular income (Johnson & Johnson, AT&T)\n• Blue-chip stocks - Large, stable companies (Apple, Microsoft)\n\nRisk vs. Reward:\nStocks are riskier than bonds but offer higher long-term returns. Diversification across many stocks reduces risk—that's why index funds are so popular!"
    },
    retirement: {
        question: "How should I plan for retirement?",
        answer: "Smart retirement planning starts now! Here's your comprehensive roadmap:\n\nStep 1: Understand Your Retirement Accounts\n\n401(k) - Employer-Sponsored\n• Contribute enough to get full employer match\n• 2024 limit: $23,000/year ($30,500 if 50+)\n• Pre-tax contributions reduce current taxes\n\nIRA - Individual Retirement Account\n• Traditional IRA: Tax deduction now, taxed later\n• Roth IRA: Pay taxes now, tax-free withdrawals\n• 2024 limit: $7,000/year ($8,000 if 50+)\n\nStep 2: How Much Do You Need?\n• Rule of thumb: 70-80% of pre-retirement income\n• Use the 4% rule: Retire with 25x annual expenses\n• Example: Need $60k/year → Save $1.5 million\n\nStep 3: Create Your Savings Plan\n• Save 15-20% of gross income\n• Max employer match first (free money!)\n• Then max Roth IRA\n• Then increase 401(k) contributions\n\nStep 4: Investment Strategy\n• Young (20s-30s): 90% stocks, 10% bonds\n• Mid-career (40s-50s): 70% stocks, 30% bonds\n• Near retirement (60s): 50% stocks, 50% bonds\n\nThe Power of Starting Early:\n• Start at 25 with $500/month → $1.8M at 65\n• Start at 35 with $500/month → $745K at 65\n• Start at 45 with $500/month → $308K at 65\n\nEvery year you wait costs you thousands!"
    },
    crypto: {
        question: "Should I invest in cryptocurrency?",
        answer: "Cryptocurrency is the Wild West of investing. Here's my honest assessment:\n\nWhat Is Cryptocurrency?\n• Digital currency using blockchain technology\n• Decentralized (no banks or governments)\n• Secured by cryptography\n• Bitcoin, Ethereum, and 20,000+ other coins\n\nThe Case FOR Crypto:\n✓ Massive growth potential (Bitcoin: $0.08 → $60,000+)\n✓ Hedge against traditional finance\n✓ Innovation in DeFi, NFTs, smart contracts\n✓ Limited supply (Bitcoin capped at 21M coins)\n✓ Increasing institutional adoption\n\nThe Case AGAINST Crypto:\n✗ Extreme volatility (50%+ swings in weeks)\n✗ No intrinsic value or cash flow\n✗ Regulatory uncertainty\n✗ Security risks (hacks, scams)\n✗ Environmental concerns (energy use)\n✗ Many projects fail or are fraudulent\n\nMy Professional Recommendation:\n\nIf you're risk-tolerant:\n• Allocate 5-10% of portfolio maximum\n• Stick to established coins (Bitcoin, Ethereum)\n• Use reputable exchanges (Coinbase, Kraken)\n• Store in secure wallets\n• Only invest what you can afford to lose\n\nIf you're conservative:\n• Focus on traditional investments first\n• Consider crypto exposure through Bitcoin ETFs\n• Wait for clearer regulations\n\nBottom Line: Crypto is speculative, not a retirement plan. Treat it like a high-risk bet, not your financial foundation."
    }
};

function showConversation(topic) {
    const conversation = conversations[topic];
    const container = document.getElementById('conversationContainer');
    const userQuestion = document.getElementById('userQuestion');
    const aiResponse = document.getElementById('aiResponse');

    // Insert content
    userQuestion.innerHTML = conversation.question;
    aiResponse.innerHTML = conversation.answer.replace(/\n/g, '<br>');

    // Show conversation
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showUpgradeModal() {
    const modal = document.createElement('div');
    modal.className = 'upgrade-modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🚀 Unlock Full AI Access</h3>
            <p>Continue the conversation with unlimited AI questions, personalized advice, and real-time portfolio analysis.</p>
            <p style="font-size: 1.3rem; font-weight: 700; color: var(--primary-color); margin: 1.5rem 0;">
                <span style="text-decoration: line-through; opacity: 0.6;">$49.99</span> 
                <span style="color: var(--success-color);">$24.99/month</span>
            </p>
            <div class="modal-buttons">
                <a href="signup.html" class="modal-btn primary">Start Free Trial</a>
                <button class="modal-btn secondary" onclick="this.closest('.upgrade-modal').remove()">Maybe Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function switchCategory(category) {
    // Update tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update content
    document.querySelectorAll('.category-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(category).classList.add('active');
}

// Allow Enter key to send message
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});
