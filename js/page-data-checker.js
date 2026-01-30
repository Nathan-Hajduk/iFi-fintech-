/**
 * Page Data Checker
 * Validates required data for specialized pages and redirects to onboarding if missing
 */

/**
 * Check if required data exists for a specific page
 * @param {string} pageName - Name of the page (networth, debt, goals, investments, budget)
 * @returns {Promise<boolean>} - True if data exists, false otherwise
 */
async function checkPageData(pageName) {
    try {
        const data = await fetchOnboardingDataFromBackend();
        
        if (!data) {
            return false;
        }
        
        switch(pageName) {
            case 'networth':
                // Check for assets or debts data
                const hasAssets = data.assets && (
                    (typeof data.assets === 'string' && data.assets !== '[]' && data.assets !== '') ||
                    (Array.isArray(data.assets) && data.assets.length > 0) ||
                    (typeof data.assets === 'object' && Object.keys(data.assets).length > 0)
                );
                const hasDebts = data.debts && (
                    (typeof data.debts === 'string' && data.debts !== '[]' && data.debts !== '') ||
                    (Array.isArray(data.debts) && data.debts.length > 0) ||
                    (typeof data.debts === 'object' && Object.keys(data.debts).length > 0)
                );
                return hasAssets || hasDebts || data.monthly_takehome;
                
            case 'debt':
                // Check for debts data
                const hasDebtData = data.debts && (
                    (typeof data.debts === 'string' && data.debts !== '[]' && data.debts !== '') ||
                    (Array.isArray(data.debts) && data.debts.length > 0)
                );
                return hasDebtData;
                
            case 'goals':
                // Check for goals-related responses in step 4
                return data.goals_primary || data.goals_timeline || data.monthly_savings_goal;
                
            case 'investments':
                // Check for investment data
                const hasInvestments = data.investments && (
                    (typeof data.investments === 'string' && data.investments !== '[]' && data.investments !== '') ||
                    (Array.isArray(data.investments) && data.investments.length > 0)
                );
                return hasInvestments || data.monthly_contributions;
                
            case 'budget':
                // Check for budget data
                const hasBudget = data.budget && (
                    (typeof data.budget === 'string' && data.budget !== '{}' && data.budget !== '') ||
                    (typeof data.budget === 'object' && Object.keys(data.budget).length > 0)
                );
                return hasBudget;
                
            default:
                return false;
        }
    } catch (error) {
        console.error('Error checking page data:', error);
        return false;
    }
}

/**
 * Show "Complete Onboarding" message with redirect
 * @param {string} pageName - Name of the page
 * @param {string} section - Onboarding section to redirect to
 * @param {string} message - Custom message to display
 */
function showCompleteOnboardingMessage(pageName, section, message) {
    const main = document.querySelector('main');
    if (!main) return;
    
    const iconMap = {
        'networth': '💎',
        'debt': '💳',
        'goals': '🎯',
        'investments': '📈',
        'budget': '📊'
    };
    
    const titleMap = {
        'networth': 'Net Worth Tracking',
        'debt': 'Debt Management',
        'goals': 'Financial Goals',
        'investments': 'Investment Portfolio',
        'budget': 'Budget Planning'
    };
    
    main.innerHTML = `
        <div class="no-data-container">
            <div class="no-data-content">
                <div class="no-data-icon">${iconMap[pageName] || '📋'}</div>
                <h1 class="no-data-title">Complete Your ${titleMap[pageName]} Profile</h1>
                <p class="no-data-message">${message || `Add your ${pageName} information to unlock powerful insights and tracking features.`}</p>
                
                <div class="feature-preview">
                    <h3>What you'll get:</h3>
                    <ul class="feature-list">
                        ${getFeatureList(pageName)}
                    </ul>
                </div>
                
                <div class="cta-buttons">
                    <a href="onboarding.html?continue=true&step=3&section=${section}" class="btn-complete-onboarding">
                        <i class="fas fa-plus-circle"></i>
                        Complete ${titleMap[pageName]}
                    </a>
                    <a href="dashboard.html" class="btn-back-dashboard">
                        <i class="fas fa-arrow-left"></i>
                        Back to Dashboard
                    </a>
                </div>
            </div>
        </div>
        
        <style>
            .no-data-container {
                min-height: 80vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
            .no-data-content {
                max-width: 600px;
                text-align: center;
                animation: fadeInUp 0.6s ease-out;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .no-data-icon {
                font-size: 5rem;
                margin-bottom: 1.5rem;
                animation: float 3s ease-in-out infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            
            .no-data-title {
                color: white;
                font-size: 2.5rem;
                margin-bottom: 1rem;
                font-weight: 700;
            }
            
            .no-data-message {
                color: rgba(255, 255, 255, 0.8);
                font-size: 1.25rem;
                line-height: 1.6;
                margin-bottom: 2.5rem;
            }
            
            .feature-preview {
                background: rgba(0, 212, 255, 0.05);
                border: 1px solid rgba(0, 212, 255, 0.2);
                border-radius: 16px;
                padding: 2rem;
                margin-bottom: 2.5rem;
                text-align: left;
            }
            
            .feature-preview h3 {
                color: #00d4ff;
                margin: 0 0 1rem 0;
                font-size: 1.25rem;
                text-align: center;
            }
            
            .feature-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .feature-list li {
                color: rgba(255, 255, 255, 0.9);
                padding: 0.75rem 0;
                padding-left: 2rem;
                position: relative;
                font-size: 1rem;
                line-height: 1.6;
            }
            
            .feature-list li:before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #4ade80;
                font-weight: bold;
                font-size: 1.25rem;
            }
            
            .cta-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .btn-complete-onboarding {
                padding: 1.25rem 2.5rem;
                background: linear-gradient(135deg, #00d4ff, #667eea);
                border: none;
                border-radius: 12px;
                color: white;
                font-weight: 700;
                font-size: 1.1rem;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                transition: all 0.3s ease;
                box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
            }
            
            .btn-complete-onboarding:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 40px rgba(0, 212, 255, 0.5);
            }
            
            .btn-back-dashboard {
                padding: 1.25rem 2rem;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(0, 212, 255, 0.3);
                border-radius: 12px;
                color: white;
                font-weight: 600;
                font-size: 1.1rem;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                transition: all 0.3s ease;
            }
            
            .btn-back-dashboard:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(0, 212, 255, 0.5);
                transform: translateY(-3px);
            }
            
            @media (max-width: 768px) {
                .no-data-title {
                    font-size: 2rem;
                }
                
                .cta-buttons {
                    flex-direction: column;
                }
                
                .btn-complete-onboarding,
                .btn-back-dashboard {
                    width: 100%;
                    justify-content: center;
                }
            }
        </style>
    `;
}

/**
 * Get feature list for each page type
 */
function getFeatureList(pageName) {
    const features = {
        'networth': [
            '<li>Track your total net worth with real-time calculations</li>',
            '<li>Visualize asset allocation with interactive charts</li>',
            '<li>Monitor wealth growth trends over time</li>',
            '<li>Get AI-powered insights on improving your financial position</li>',
            '<li>Debt-to-asset ratio analysis and benchmarking</li>'
        ],
        'debt': [
            '<li>Comprehensive debt payoff calculator</li>',
            '<li>Avalanche vs Snowball method comparison</li>',
            '<li>Visual payoff timeline and progress tracking</li>',
            '<li>Interest savings projections</li>',
            '<li>AI recommendations for accelerated payoff strategies</li>'
        ],
        'goals': [
            '<li>Set and track multiple financial goals</li>',
            '<li>Visual progress bars and milestone celebrations</li>',
            '<li>Timeline projections for goal achievement</li>',
            '<li>AI-optimized savings recommendations</li>',
            '<li>Emergency fund calculator and guidance</li>'
        ],
        'investments': [
            '<li>Portfolio performance tracking and analysis</li>',
            '<li>Asset allocation pie charts and diversification scores</li>',
            '<li>Real-time portfolio value updates</li>',
            '<li>AI-powered rebalancing suggestions</li>',
            '<li>Risk assessment and optimization recommendations</li>'
        ],
        'budget': [
            '<li>Dynamic budget vs actual spending comparison</li>',
            '<li>Category-wise spending breakdowns</li>',
            '<li>Overspending alerts and insights</li>',
            '<li>50/30/20 rule compliance checker</li>',
            '<li>AI-powered budget optimization tips</li>'
        ]
    };
    
    return features[pageName]?.join('') || '';
}

// Make functions globally available
window.checkPageData = checkPageData;
window.showCompleteOnboardingMessage = showCompleteOnboardingMessage;
