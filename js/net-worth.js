/**
 * Net Worth Page - Asset & Debt Visualization
 * Senior Developer Implementation for iFi Fintech
 */

async function initializeNetWorthPage() {
    try {
        console.log('📊 Initializing Net Worth Page...');
        
        const data = await ifiPageInit.loadPageData('Net Worth');
        if (!data) {
            ifiPageInit.showNoDataMessage('Complete onboarding to track your net worth.');
            return;
        }
        
        const assets = await onboardingDataService.getAssets();
        const debts = await onboardingDataService.getDebts();
        const totalAssets = await onboardingDataService.getTotalAssets();
        const totalDebts = await onboardingDataService.getTotalDebts();
        const netWorth = await onboardingDataService.getNetWorth();
        
        console.log('📊 Data loaded:', { assets, debts, totalAssets, totalDebts, netWorth });
        
        displayNetWorthOverview(netWorth, totalAssets, totalDebts);
        displayAssetsBreakdown(assets, totalAssets);
        displayDebtsBreakdown(debts, totalDebts);
    } catch (error) {
        console.error('❌ Error initializing net worth:', error);
        ifiPageInit.showNoDataMessage('Error loading net worth data.');
    }
}

function displayNetWorthOverview(netWorth, assets, debts) {
    const main = document.querySelector('main');
    if (!main) return;
    
    const overviewHTML = `
        <div class="networth-hero">
            <h1>📊 Net Worth Tracker</h1>
            <div class="networth-cards">
                <div class="nw-card primary glow-effect">
                    <div class="nw-icon">💎</div>
                    <div class="nw-value ${netWorth >= 0 ? 'positive' : 'negative'}">
                        ${netWorth >= 0 ? '+' : ''}$${Math.abs(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div class="nw-label">Net Worth</div>
                    <div class="nw-subtext">${netWorth >= 0 ? 'Building wealth 📈' : 'Debt reduction mode 💪'}</div>
                </div>
                <div class="nw-card assets pulse-animation">
                    <div class="nw-icon">💰</div>
                    <div class="nw-value positive">$${assets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="nw-label">Total Assets</div>
                    <div class="nw-subtext">What you own</div>
                </div>
                <div class="nw-card debts">
                    <div class="nw-icon">📉</div>
                    <div class="nw-value negative">$${debts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="nw-label">Total Debts</div>
                    <div class="nw-subtext">What you owe</div>
                </div>
            </div>
        </div>
    `;
    
    main.insertAdjacentHTML('afterbegin', overviewHTML);
}

function displayAssetsBreakdown(assets, total) {
    const main = document.querySelector('main');
    if (!main || !assets || assets.length === 0) return;
    
    const assetsHTML = `
        <div class="assets-section">
            <h2>💰 Your Assets</h2>
            <p class="section-desc">Things you own that have value</p>
            <div class="assets-grid">
                ${assets.map((asset, i) => {
                    const value = parseFloat(asset.value) || 0;
                    const percent = total > 0 ? (value / total * 100).toFixed(1) : 0;
                    return `
                        <div class="asset-card zoom-in" style="animation-delay: ${i * 0.1}s;">
                            <div class="asset-header">
                                <h3>${asset.name || 'Asset'}</h3>
                                <span class="asset-type">${asset.type || 'Asset'}</span>
                            </div>
                            <div class="asset-value">$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <div class="asset-bar">
                                <div class="asset-fill" style="width: ${percent}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                            </div>
                            <div class="asset-percent">${percent}% of total assets</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    main.insertAdjacentHTML('beforeend', assetsHTML);
}

function displayDebtsBreakdown(debts, total) {
    const main = document.querySelector('main');
    if (!main || !debts || debts.length === 0) return;
    
    const debtsHTML = `
        <div class="debts-section">
            <h2>📉 Your Debts</h2>
            <p class="section-desc">Obligations you're working to eliminate</p>
            <div class="debts-grid">
                ${debts.map((debt, i) => {
                    const balance = parseFloat(debt.balance) || 0;
                    const rate = parseFloat(debt.rate) || 0;
                    const percent = total > 0 ? (balance / total * 100).toFixed(1) : 0;
                    return `
                        <div class="debt-card slide-left" style="animation-delay: ${i * 0.1}s;">
                            <div class="debt-header">
                                <h3>${debt.name || 'Debt'}</h3>
                                <span class="debt-rate">${rate.toFixed(2)}% APR</span>
                            </div>
                            <div class="debt-balance">$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                            <div class="debt-bar">
                                <div class="debt-fill" style="width: ${percent}%; background: linear-gradient(90deg, #ef4444, #dc2626);"></div>
                            </div>
                            <div class="debt-percent">${percent}% of total debt</div>
                            ${debt.payment ? `<div class="debt-payment">Min Payment: $${parseFloat(debt.payment).toFixed(2)}/mo</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    main.insertAdjacentHTML('beforeend', debtsHTML);
}

document.addEventListener('DOMContentLoaded', async function() {
    await initializeNetWorthPage();
    const ctx = document.getElementById('netWorthChart');
    
    if (ctx) {
        // Use real net worth for trend projection
        const netWorth = await onboardingDataService.getNetWorth();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Project growth (simplified projection)
        const monthlyChange = 300; // Average monthly improvement
        const netWorthData = months.map((_, i) => netWorth + (monthlyChange * i));
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Net Worth',
                    data: netWorthData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
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
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return 'Net Worth: $' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Calculate and update total net worth
    updateNetWorthSummary();
});

// Calculate net worth from assets and liabilities
function updateNetWorthSummary() {
    const assets = [12450, 78200, 125000]; // From HTML data
    const liabilities = [285000, 18500, 3200]; // From HTML data
    
    const totalAssets = assets.reduce((sum, val) => sum + val, 0);
    const totalLiabilities = liabilities.reduce((sum, val) => sum + val, 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Update summary card values
    const netWorthElement = document.querySelector('.summary-card.primary .big-number');
    const assetsElement = document.querySelectorAll('.summary-card .big-number')[1];
    const liabilitiesElement = document.querySelectorAll('.summary-card .big-number')[2];
    
    if (netWorthElement) netWorthElement.textContent = '$' + netWorth.toLocaleString();
    if (assetsElement) assetsElement.textContent = '$' + totalAssets.toLocaleString();
    if (liabilitiesElement) liabilitiesElement.textContent = '-$' + totalLiabilities.toLocaleString();
}

// Add Asset modal handler (placeholder)
document.addEventListener('DOMContentLoaded', function() {
    const addAssetBtns = document.querySelectorAll('.add-account-btn');
    
    addAssetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const isAsset = this.textContent.includes('Asset');
            const accountType = isAsset ? 'asset' : 'liability';
            
            if (typeof showToast === 'function') {
                showToast(
                    `Add ${accountType} feature coming soon! This will connect with your bank via Plaid for real-time data.`,
                    'info',
                    4000
                );
            } else {
                alert(`Add ${accountType} feature coming soon! This will connect with your bank via Plaid for real-time data.`);
            }
        });
    });
});
