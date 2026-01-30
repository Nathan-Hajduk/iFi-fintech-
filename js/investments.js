/**
 * Investments Page - Portfolio Tracking & Asset Allocation Analysis
 * Comprehensive investment monitoring with diversification scoring
 */

document.addEventListener('DOMContentLoaded', async function() {
    try {
        const hasData = await checkPageData('investments');
        if (!hasData) {
            showCompleteOnboardingMessage('investments', '', 'Track your investment portfolio, analyze diversification, and monitor performance.');
            return;
        }
        await loadInvestmentsData();
    } catch (error) {
        console.error('Investments page error:', error);
    }
});

async function loadInvestmentsData() {
    const data = await fetchOnboardingDataFromBackend();
    if (!data) return;
    
    let investments = [];
    if (data.investments) {
        try {
            investments = typeof data.investments === 'string' ? JSON.parse(data.investments) : data.investments;
            if (!Array.isArray(investments)) investments = [];
        } catch (e) {
            console.error('Error parsing investments:', e);
            investments = [];
        }
    }
    
    if (investments.length === 0) {
        showCompleteOnboardingMessage('investments', '', 'Start tracking your investments and build a diversified portfolio!');
        return;
    }
    
    // Calculate metrics
    const totalValue = investments.reduce((sum, inv) => sum + (parseFloat(inv.value) || 0), 0);
    const totalGains = investments.reduce((sum, inv) => {
        const value = parseFloat(inv.value) || 0;
        const cost = parseFloat(inv.cost_basis) || value;
        return sum + (value - cost);
    }, 0);
    const totalReturn = totalValue > 0 ? (totalGains / (totalValue - totalGains) * 100) : 0;
    
    // Calculate diversification score
    const diversificationScore = calculateDiversificationScore(investments);
    
    // Update summary cards
    updateSummaryCards(totalValue, investments.length, totalReturn, diversificationScore);
    
    // Render portfolio summary
    renderPortfolioSummary(investments, totalValue, totalGains);
    
    // Render asset allocation chart
    renderAssetAllocationChart(investments);
    
    // Render holdings list
    renderHoldingsList(investments);
    
    // Render diversification analysis
    renderDiversificationAnalysis(investments, diversificationScore);
    
    console.log('Investments data loaded:', investments);
}

function updateSummaryCards(totalValue, holdingsCount, totalReturn, diversificationScore) {
    // Total Portfolio Value
    const valueCard = document.querySelector('.summary-card:nth-child(1) .big-number');
    if (valueCard) valueCard.textContent = formatCurrency(totalValue);
    
    // Number of Holdings
    const countCard = document.querySelector('.summary-card:nth-child(2) .big-number');
    if (countCard) countCard.textContent = holdingsCount;
    
    // Total Return
    const returnCard = document.querySelector('.summary-card:nth-child(3) .big-number');
    if (returnCard) {
        returnCard.textContent = (totalReturn >= 0 ? '+' : '') + totalReturn.toFixed(2) + '%';
        returnCard.style.color = totalReturn >= 0 ? '#22c55e' : '#ef4444';
    }
    
    // Diversification Score
    const diversificationCard = document.querySelector('.summary-card:nth-child(4) .big-number');
    if (diversificationCard) {
        diversificationCard.textContent = diversificationScore + '/100';
        diversificationCard.style.color = getDiversificationColor(diversificationScore);
    }
}

function renderPortfolioSummary(investments, totalValue, totalGains) {
    const container = document.getElementById('portfolioSummaryContainer');
    if (!container) return;
    
    // Group by asset class
    const assetClasses = {};
    investments.forEach(inv => {
        const assetClass = inv.asset_class || inv.type || 'Other';
        if (!assetClasses[assetClass]) {
            assetClasses[assetClass] = { value: 0, count: 0 };
        }
        assetClasses[assetClass].value += parseFloat(inv.value) || 0;
        assetClasses[assetClass].count++;
    });
    
    const returnPercentage = totalValue > 0 ? (totalGains / (totalValue - totalGains) * 100) : 0;
    const returnClass = totalGains >= 0 ? 'positive' : 'negative';
    
    const html = `
        <div class="portfolio-summary-card">
            <div class="summary-header">
                <h2>Portfolio Overview</h2>
                <div class="total-value">${formatCurrency(totalValue)}</div>
            </div>
            
            <div class="returns-section ${returnClass}">
                <div class="returns-item">
                    <span class="returns-label">Total Gains/Losses</span>
                    <span class="returns-value">${totalGains >= 0 ? '+' : ''}${formatCurrency(totalGains)}</span>
                </div>
                <div class="returns-item">
                    <span class="returns-label">Return Percentage</span>
                    <span class="returns-value">${returnPercentage >= 0 ? '+' : ''}${returnPercentage.toFixed(2)}%</span>
                </div>
            </div>
            
            <div class="allocation-breakdown">
                <h3>Asset Class Breakdown</h3>
                ${Object.entries(assetClasses).map(([assetClass, data]) => {
                    const percentage = (data.value / totalValue * 100).toFixed(1);
                    return `
                        <div class="allocation-item">
                            <div class="allocation-header">
                                <span class="asset-class-name">${assetClass}</span>
                                <span class="asset-class-value">${formatCurrency(data.value)}</span>
                            </div>
                            <div class="allocation-bar">
                                <div class="allocation-fill" style="width: ${percentage}%; background-color: ${getAssetClassColor(assetClass)}"></div>
                            </div>
                            <span class="allocation-percentage">${percentage}% (${data.count} holding${data.count > 1 ? 's' : ''})</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderAssetAllocationChart(investments) {
    const canvas = document.getElementById('assetAllocationChart');
    if (!canvas || !window.Chart) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (window.investmentChartInstance) {
        window.investmentChartInstance.destroy();
    }
    
    // Group by asset class
    const assetClasses = {};
    investments.forEach(inv => {
        const assetClass = inv.asset_class || inv.type || 'Other';
        if (!assetClasses[assetClass]) {
            assetClasses[assetClass] = 0;
        }
        assetClasses[assetClass] += parseFloat(inv.value) || 0;
    });
    
    const labels = Object.keys(assetClasses);
    const data = Object.values(assetClasses);
    const colors = labels.map(label => getAssetClassColor(label));
    
    window.investmentChartInstance = new Chart(ctx, {
        type: 'pie',
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

function renderHoldingsList(investments) {
    const container = document.getElementById('holdingsListContainer');
    if (!container) return;
    
    // Sort by value (highest first)
    const sortedInvestments = [...investments].sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
    
    const html = sortedInvestments.map(inv => {
        const value = parseFloat(inv.value) || 0;
        const costBasis = parseFloat(inv.cost_basis) || value;
        const gain = value - costBasis;
        const gainPercentage = costBasis > 0 ? (gain / costBasis * 100) : 0;
        const gainClass = gain >= 0 ? 'positive' : 'negative';
        
        return `
            <div class="holding-card">
                <div class="holding-header">
                    <div class="holding-info">
                        <i class="fas ${getAssetIcon(inv.asset_class || inv.type)}"></i>
                        <div class="holding-details">
                            <h3>${inv.name || 'Unnamed Investment'}</h3>
                            <span class="asset-type">${inv.asset_class || inv.type || 'Other'}</span>
                        </div>
                    </div>
                    <div class="holding-value">${formatCurrency(value)}</div>
                </div>
                
                <div class="holding-performance ${gainClass}">
                    <div class="performance-item">
                        <span class="performance-label">Gain/Loss</span>
                        <span class="performance-value">${gain >= 0 ? '+' : ''}${formatCurrency(gain)}</span>
                    </div>
                    <div class="performance-item">
                        <span class="performance-label">Return</span>
                        <span class="performance-value">${gainPercentage >= 0 ? '+' : ''}${gainPercentage.toFixed(2)}%</span>
                    </div>
                    <div class="performance-item">
                        <span class="performance-label">Cost Basis</span>
                        <span class="performance-value">${formatCurrency(costBasis)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function renderDiversificationAnalysis(investments, score) {
    const container = document.getElementById('diversificationAnalysis');
    if (!container) return;
    
    // Count unique asset classes
    const uniqueAssetClasses = new Set(investments.map(inv => inv.asset_class || inv.type || 'Other')).size;
    
    // Calculate concentration risk (Herfindahl index)
    const totalValue = investments.reduce((sum, inv) => sum + (parseFloat(inv.value) || 0), 0);
    const concentrationIndex = investments.reduce((sum, inv) => {
        const share = (parseFloat(inv.value) || 0) / totalValue;
        return sum + (share * share);
    }, 0) * 100;
    
    const concentrationRisk = concentrationIndex > 25 ? 'High' : concentrationIndex > 15 ? 'Medium' : 'Low';
    
    const html = `
        <div class="diversification-card">
            <div class="diversification-header">
                <h3><i class="fas fa-chart-pie"></i> Diversification Analysis</h3>
                <div class="diversification-score" style="color: ${getDiversificationColor(score)}">
                    ${score}/100
                </div>
            </div>
            
            <div class="diversification-metrics">
                <div class="metric">
                    <i class="fas fa-layer-group"></i>
                    <div class="metric-content">
                        <span class="metric-label">Asset Classes</span>
                        <span class="metric-value">${uniqueAssetClasses}</span>
                    </div>
                </div>
                <div class="metric">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="metric-content">
                        <span class="metric-label">Concentration Risk</span>
                        <span class="metric-value ${concentrationRisk.toLowerCase()}-risk">${concentrationRisk}</span>
                    </div>
                </div>
                <div class="metric">
                    <i class="fas fa-briefcase"></i>
                    <div class="metric-content">
                        <span class="metric-label">Total Holdings</span>
                        <span class="metric-value">${investments.length}</span>
                    </div>
                </div>
            </div>
            
            <div class="diversification-recommendation">
                <i class="fas fa-lightbulb"></i>
                <div class="recommendation-content">
                    <h4>💡 Diversification Tip</h4>
                    <p>${getDiversificationRecommendation(score, uniqueAssetClasses, concentrationRisk)}</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function calculateDiversificationScore(investments) {
    if (investments.length === 0) return 0;
    
    const totalValue = investments.reduce((sum, inv) => sum + (parseFloat(inv.value) || 0), 0);
    
    // Factor 1: Number of unique asset classes (max 40 points)
    const uniqueAssetClasses = new Set(investments.map(inv => inv.asset_class || inv.type || 'Other')).size;
    const assetClassScore = Math.min(40, uniqueAssetClasses * 10);
    
    // Factor 2: Distribution across holdings (max 30 points)
    const concentrationIndex = investments.reduce((sum, inv) => {
        const share = (parseFloat(inv.value) || 0) / totalValue;
        return sum + (share * share);
    }, 0);
    const distributionScore = Math.max(0, 30 - (concentrationIndex * 30));
    
    // Factor 3: Number of holdings (max 30 points)
    const holdingsScore = Math.min(30, investments.length * 3);
    
    return Math.round(assetClassScore + distributionScore + holdingsScore);
}

function getDiversificationRecommendation(score, assetClasses, concentrationRisk) {
    if (score >= 80) {
        return `Excellent diversification! Your portfolio is well-balanced across ${assetClasses} asset classes with ${concentrationRisk.toLowerCase()} concentration risk. Continue monitoring and rebalancing periodically.`;
    } else if (score >= 60) {
        return `Good diversification foundation with ${assetClasses} asset classes. Consider expanding into additional sectors or asset types to reduce correlation risk and improve resilience.`;
    } else if (score >= 40) {
        return `Moderate diversification. Your ${concentrationRisk.toLowerCase()} concentration risk suggests adding more holdings across different asset classes. Aim for at least 5-7 different asset types.`;
    } else {
        return `Limited diversification detected. Consider significantly expanding your portfolio across multiple asset classes (stocks, bonds, real estate, commodities) to reduce risk. Concentration risk is ${concentrationRisk.toLowerCase()}.`;
    }
}

function getDiversificationColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
}

function getAssetClassColor(assetClass) {
    const colors = {
        'Stocks': '#3b82f6',
        'Bonds': '#22c55e',
        'Real Estate': '#f59e0b',
        'Commodities': '#eab308',
        'Cryptocurrency': '#8b5cf6',
        'Cash': '#06b6d4',
        'Other': '#64748b'
    };
    return colors[assetClass] || '#64748b';
}

function getAssetIcon(assetClass) {
    const icons = {
        'Stocks': 'fa-chart-line',
        'Bonds': 'fa-file-contract',
        'Real Estate': 'fa-building',
        'Commodities': 'fa-coins',
        'Cryptocurrency': 'fa-bitcoin-sign',
        'Cash': 'fa-money-bill',
        'Other': 'fa-briefcase'
    };
    return icons[assetClass] || 'fa-briefcase';
}

function formatCurrency(amt) {
    return new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0}).format(amt);
}

// Disclaimer
console.log('%c📈 Investment Disclaimer', 'color: #00d4ff; font-size: 14px; font-weight: bold;');
console.log('Investment performance data is for informational purposes only. Past performance does not guarantee future results. Portfolio analysis and diversification scores are educational tools and do not constitute investment advice. Consult with a licensed financial advisor before making investment decisions.');
