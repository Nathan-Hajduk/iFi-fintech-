/**
 * Net Worth Dashboard
 * Displays assets, liabilities, and net worth trends from onboarding data
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if data exists
        const hasData = await checkPageData('networth');
        
        if (!hasData) {
            showCompleteOnboardingMessage(
                'networth',
                'assets',
                'Build a complete picture of your financial health by tracking your assets and liabilities.'
            );
            return;
        }
        
        // Load and display data
        await loadNetWorthData();
    } catch (error) {
        console.error('Error initializing net worth page:', error);
        showError('Failed to load net worth data. Please try again later.');
    }
});

/**
 * Load and display net worth data from onboarding
 */
async function loadNetWorthData() {
    const data = await fetchOnboardingDataFromBackend();
    
    if (!data) {
        showCompleteOnboardingMessage('networth', 'assets', 'Get started by adding your financial information.');
        return;
    }
    
    // Parse assets
    let assets = [];
    if (data.assets) {
        try {
            assets = typeof data.assets === 'string' ? JSON.parse(data.assets) : data.assets;
            if (!Array.isArray(assets)) assets = [];
        } catch (e) {
            console.error('Error parsing assets:', e);
            assets = [];
        }
    }
    
    // Parse debts/liabilities
    let liabilities = [];
    if (data.debts) {
        try {
            liabilities = typeof data.debts === 'string' ? JSON.parse(data.debts) : data.debts;
            if (!Array.isArray(liabilities)) liabilities = [];
        } catch (e) {
            console.error('Error parsing liabilities:', e);
            liabilities = [];
        }
    }
    
    // Calculate totals
    const totalAssets = assets.reduce((sum, asset) => sum + (parseFloat(asset.value) || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Update summary cards
    updateSummaryCards(netWorth, totalAssets, totalLiabilities);
    
    // Render lists
    renderAssetsList(assets);
    renderLiabilitiesList(liabilities);
    
    // Create visualizations
    renderNetWorthTrendChart(netWorth);
    renderDebtRatioWidget(totalAssets, totalLiabilities);
    
    // Generate AI insights
    generateAIInsights(netWorth, totalAssets, totalLiabilities, assets, liabilities);
}

/**
 * Update summary cards with values
 */
function updateSummaryCards(netWorth, totalAssets, totalLiabilities) {
    // Net worth with trend
    const netWorthElement = document.getElementById('netWorth');
    if (netWorthElement) {
        netWorthElement.textContent = formatCurrency(netWorth);
        netWorthElement.parentElement.parentElement.classList.add('fade-in');
    }
    
    // Total assets
    const assetsElement = document.getElementById('totalAssets');
    if (assetsElement) {
        assetsElement.textContent = formatCurrency(totalAssets);
        assetsElement.parentElement.parentElement.classList.add('fade-in');
    }
    
    // Total liabilities
    const liabilitiesElement = document.getElementById('totalLiabilities');
    if (liabilitiesElement) {
        liabilitiesElement.textContent = formatCurrency(totalLiabilities);
        liabilitiesElement.parentElement.parentElement.classList.add('fade-in');
    }
}

/**
 * Render assets list
 */
function renderAssetsList(assets) {
    const assetsList = document.getElementById('assetsList');
    if (!assetsList) return;
    
    if (assets.length === 0) {
        assetsList.innerHTML = '<li class="empty-state">No assets added yet. Complete onboarding to add your assets.</li>';
        return;
    }
    
    assetsList.innerHTML = assets.map(asset => `
        <li class="balance-item">
            <div class="item-info">
                <i class="fas ${getAssetIcon(asset.type || asset.name)}" aria-hidden="true"></i>
                <div>
                    <strong>${asset.name || 'Asset'}</strong>
                    <span class="account-number">${asset.type || 'Asset'}</span>
                </div>
            </div>
            <span class="amount">${formatCurrency(asset.value || 0)}</span>
        </li>
    `).join('');
}

/**
 * Render liabilities list
 */
function renderLiabilitiesList(liabilities) {
    const liabilitiesList = document.getElementById('liabilitiesList');
    if (!liabilitiesList) return;
    
    if (liabilities.length === 0) {
        liabilitiesList.innerHTML = '<li class="empty-state">No liabilities tracked. Great job staying debt-free!</li>';
        return;
    }
    
    liabilitiesList.innerHTML = liabilities.map(debt => `
        <li class="balance-item debt">
            <div class="item-info">
                <i class="fas ${getDebtIcon(debt.type || debt.name)}" aria-hidden="true"></i>
                <div>
                    <strong>${debt.name || 'Debt'}</strong>
                    <span class="account-number">${debt.type || 'Liability'} ${debt.apr ? `• ${debt.apr}% APR` : ''}</span>
                </div>
            </div>
            <span class="amount negative">-${formatCurrency(debt.balance || 0)}</span>
        </li>
    `).join('');
}

/**
 * Render net worth trend chart (12 months simulated)
 */
function renderNetWorthTrendChart(currentNetWorth) {
    const canvas = document.getElementById('netWorthChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Generate 12 months of simulated data (showing growth trend)
    const months = [];
    const values = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        
        // Simulate growth from 92% to 100% of current value
        const growthFactor = 0.92 + (0.08 * (11 - i) / 11);
        values.push(Math.round(currentNetWorth * growthFactor));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Net Worth',
                data: values,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#00d4ff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 39, 0.95)',
                    titleColor: '#00d4ff',
                    bodyColor: '#fff',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Net Worth: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Render debt-to-asset ratio widget
 */
function renderDebtRatioWidget(totalAssets, totalLiabilities) {
    const ratio = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0;
    
    // Determine health status
    let status = 'excellent';
    let statusText = 'Excellent';
    let statusColor = '#4ade80';
    
    if (ratio > 50) {
        status = 'concerning';
        statusText = 'Needs Attention';
        statusColor = '#ef4444';
    } else if (ratio > 36) {
        status = 'moderate';
        statusText = 'Moderate';
        statusColor = '#f59e0b';
    }
    
    // Add widget to page if section exists
    const chartSection = document.querySelector('.chart-section');
    if (chartSection && ratio > 0) {
        const ratioWidget = document.createElement('div');
        ratioWidget.className = 'card';
        ratioWidget.innerHTML = `
            <h2><i class="fas fa-balance-scale"></i> Debt-to-Asset Ratio</h2>
            <div class="ratio-display">
                <div class="ratio-circle" style="background: conic-gradient(${statusColor} ${ratio * 3.6}deg, rgba(255,255,255,0.1) 0deg);">
                    <div class="ratio-inner">
                        <span class="ratio-value">${ratio.toFixed(1)}%</span>
                        <span class="ratio-status" style="color: ${statusColor};">${statusText}</span>
                    </div>
                </div>
                <div class="ratio-info">
                    <p><strong>What this means:</strong></p>
                    <p>${getRatioExplanation(ratio)}</p>
                </div>
            </div>
            <style>
                .ratio-display {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                    margin-top: 1.5rem;
                }
                .ratio-circle {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .ratio-inner {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    background: #0a0e27;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .ratio-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: white;
                }
                .ratio-status {
                    font-size: 0.875rem;
                    font-weight: 600;
                }
                .ratio-info {
                    flex: 1;
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.6;
                }
                @media (max-width: 768px) {
                    .ratio-display {
                        flex-direction: column;
                    }
                }
            </style>
        `;
        chartSection.appendChild(ratioWidget);
    }
}

/**
 * Generate AI insights based on financial data
 */
function generateAIInsights(netWorth, totalAssets, totalLiabilities, assets, liabilities) {
    const insightsCard = document.querySelector('.insights-card');
    if (!insightsCard) return;
    
    const insightsList = insightsCard.querySelector('.insight-list');
    if (!insightsList) return;
    
    const insights = [];
    
    // Net worth insight
    if (netWorth > 0) {
        insights.push({
            icon: 'fa-arrow-up',
            color: 'success',
            text: `Your net worth is <strong>${formatCurrency(netWorth)}</strong>. You're building wealth steadily!`
        });
    } else if (netWorth < 0) {
        insights.push({
            icon: 'fa-exclamation-triangle',
            color: 'warning',
            text: `Your liabilities exceed assets by <strong>${formatCurrency(Math.abs(netWorth))}</strong>. Focus on debt reduction.`
        });
    }
    
    // Debt ratio insight
    const ratio = totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0;
    if (ratio > 0) {
        if (ratio < 36) {
            insights.push({
                icon: 'fa-check-circle',
                color: 'success',
                text: `Your debt-to-asset ratio is ${ratio.toFixed(1)}% — well within the healthy range (under 36%).`
            });
        } else {
            insights.push({
                icon: 'fa-chart-line',
                color: 'warning',
                text: `Your debt ratio is ${ratio.toFixed(1)}%. Consider paying down high-interest debt to improve this.`
            });
        }
    }
    
    // Asset diversity insight
    if (assets.length >= 3) {
        insights.push({
            icon: 'fa-layer-group',
            color: 'info',
            text: `Great diversification! You're tracking ${assets.length} different assets across your portfolio.`
        });
    } else if (assets.length === 0) {
        insights.push({
            icon: 'fa-lightbulb',
            color: 'info',
            text: `Start building wealth by adding your first assets to track. Even small amounts compound over time!`
        });
    }
    
    // Render insights
    insightsList.innerHTML = insights.map(insight => `
        <li class="insight-item">
            <i class="fas ${insight.icon} text-${insight.color}"></i>
            <p>${insight.text}</p>
        </li>
    `).join('');
}

/**
 * Helper: Get icon for asset type
 */
function getAssetIcon(assetName) {
    const name = assetName.toLowerCase();
    if (name.includes('cash') || name.includes('checking') || name.includes('saving')) return 'fa-university';
    if (name.includes('401k') || name.includes('ira') || name.includes('investment') || name.includes('stock')) return 'fa-chart-line';
    if (name.includes('home') || name.includes('house') || name.includes('property') || name.includes('real estate')) return 'fa-home';
    if (name.includes('car') || name.includes('vehicle')) return 'fa-car';
    if (name.includes('crypto') || name.includes('bitcoin') || name.includes('eth')) return 'fa-bitcoin';
    return 'fa-coins';
}

/**
 * Helper: Get icon for debt type
 */
function getDebtIcon(debtName) {
    const name = debtName.toLowerCase();
    if (name.includes('mortgage') || name.includes('home')) return 'fa-home';
    if (name.includes('car') || name.includes('auto') || name.includes('vehicle')) return 'fa-car';
    if (name.includes('credit') || name.includes('card')) return 'fa-credit-card';
    if (name.includes('student') || name.includes('education')) return 'fa-graduation-cap';
    if (name.includes('personal') || name.includes('loan')) return 'fa-hand-holding-usd';
    return 'fa-file-invoice-dollar';
}

/**
 * Helper: Get explanation for debt ratio
 */
function getRatioExplanation(ratio) {
    if (ratio < 20) {
        return 'Outstanding! Your debt is very manageable relative to your assets. You have strong financial flexibility.';
    } else if (ratio < 36) {
        return 'Good standing! Your debt is within the healthy range. Keep maintaining this balance.';
    } else if (ratio < 50) {
        return 'Moderate concern. Consider focusing on paying down high-interest debt to improve your ratio.';
    } else {
        return 'High debt burden. Prioritize debt reduction strategies like the avalanche or snowball method.';
    }
}

/**
 * Helper: Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Helper: Show error message
 */
function showError(message) {
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error Loading Data</h2>
                <p>${message}</p>
                <a href="dashboard.html" class="btn-primary">Return to Dashboard</a>
            </div>
        `;
    }
}
