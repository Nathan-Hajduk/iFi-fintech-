/**
 * Investments Page - Portfolio Visualization
 * Senior Developer Implementation for iFi Fintech
 */

// Initialize data
let holdings = JSON.parse(localStorage.getItem('ifi_holdings')) || [];
let onboardingInvestments = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadOnboardingInvestments();
});

async function loadOnboardingInvestments() {
    try {
        onboardingInvestments = await onboardingDataService.getInvestments();
        console.log('📈 Loaded onboarding investments:', onboardingInvestments);
        displayOnboardingInvestments();
    } catch (error) {
        console.error('❌ Error loading investments:', error);
    }
}

function displayOnboardingInvestments() {
    if (!onboardingInvestments || onboardingInvestments.length === 0) return;
    
    const container = document.querySelector('.portfolio-summary') || document.querySelector('main');
    const totalValue = onboardingInvestments.reduce((sum, inv) => sum + (parseFloat(inv.value) || 0), 0);
    
    let html = `
        <div class="investment-overview">
            <h2>📊 Your Investment Portfolio</h2>
            <div class="portfolio-metrics">
                <div class="metric-card">
                    <div class="metric-icon">💰</div>
                    <div class="metric-value">$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">Total Portfolio Value</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">📈</div>
                    <div class="metric-value">${onboardingInvestments.length}</div>
                    <div class="metric-label">Investment Accounts</div>
                </div>
            </div>
            <div class="investment-grid">
    `;
    
    onboardingInvestments.forEach((inv, index) => {
        const value = parseFloat(inv.value) || 0;
        const percentage = totalValue > 0 ? (value / totalValue * 100).toFixed(1) : 0;
        html += `
            <div class="investment-card" style="animation-delay: ${index * 0.1}s;">
                <div class="investment-header">
                    <h3>${inv.name || 'Investment Account'}</h3>
                    <span class="investment-type">${inv.type || 'Investment'}</span>
                </div>
                <div class="investment-value">$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div class="investment-percentage">${percentage}% of portfolio</div>
            </div>
        `;
    });
    
    html += `</div></div>`;
    container.insertAdjacentHTML('afterbegin', html);
}

// DOM Elements
const modal = document.getElementById('investmentModal');
const addBtn = document.getElementById('addInvestmentBtn');
const closeBtn = document.querySelector('.modal-close');
const form = document.getElementById('investmentForm');
const searchInput = document.getElementById('searchHolding');
const assetFilter = document.getElementById('assetTypeFilter');
const holdingsTable = document.getElementById('holdingsTable');
const periodBtns = document.querySelectorAll('.period-btn');

// Modal Controls
addBtn.addEventListener('click', () => {
    modal.classList.add('active');
    form.reset();
});

closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
    }
});

// Form Submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const holding = {
        id: Date.now(),
        assetType: document.getElementById('assetType').value,
        symbol: document.getElementById('symbol').value.toUpperCase(),
        name: document.getElementById('assetName').value,
        shares: parseFloat(document.getElementById('shares').value),
        avgCost: parseFloat(document.getElementById('avgCost').value),
        purchaseDate: document.getElementById('purchaseDate').value,
        currentPrice: parseFloat(document.getElementById('avgCost').value) * (1 + (Math.random() * 0.2 - 0.1)) // Mock current price
    };
    
    holdings.push(holding);
    saveHoldings();
    renderHoldings();
    updatePortfolioSummary();
    
    modal.classList.remove('active');
    form.reset();
});

// Search and Filter
searchInput.addEventListener('input', renderHoldings);
assetFilter.addEventListener('change', renderHoldings);

// Performance Period Selection
periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // In a real app, this would update the performance chart
    });
});

// Save to localStorage
function saveHoldings() {
    localStorage.setItem('ifi_holdings', JSON.stringify(holdings));
}

// Filter holdings
function getFilteredHoldings() {
    let filtered = [...holdings];
    
    // Search filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(h => 
            h.symbol.toLowerCase().includes(searchTerm) ||
            h.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Asset type filter
    const assetType = assetFilter.value;
    if (assetType !== 'all') {
        filtered = filtered.filter(h => h.assetType === assetType);
    }
    
    return filtered;
}

// Render holdings table
function renderHoldings() {
    const filtered = getFilteredHoldings();
    
    if (filtered.length === 0) {
        holdingsTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <p>No holdings found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    holdingsTable.innerHTML = filtered.map(h => {
        const totalCost = h.shares * h.avgCost;
        const currentValue = h.shares * h.currentPrice;
        const gain = currentValue - totalCost;
        const gainPercent = (gain / totalCost) * 100;
        const isPositive = gain >= 0;
        
        return `
            <tr>
                <td>
                    <div class="asset-name">${h.name}</div>
                    <span class="asset-symbol">${h.symbol}</span>
                </td>
                <td>${h.assetType}</td>
                <td>${h.shares.toFixed(2)}</td>
                <td>$${h.avgCost.toFixed(2)}</td>
                <td>$${h.currentPrice.toFixed(2)}</td>
                <td>$${currentValue.toFixed(2)}</td>
                <td class="${isPositive ? 'gain-positive' : 'gain-negative'}">
                    ${isPositive ? '+' : ''}$${gain.toFixed(2)} (${isPositive ? '+' : ''}${gainPercent.toFixed(2)}%)
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" onclick="editHolding(${h.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" onclick="deleteHolding(${h.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update portfolio summary
function updatePortfolioSummary() {
    if (holdings.length === 0) {
        document.getElementById('portfolioValue').textContent = '$0.00';
        document.getElementById('dayChange').innerHTML = `<span class="portfolio-change positive">+$0.00 (+0.00%)</span>`;
        document.getElementById('totalGain').innerHTML = `<span class="portfolio-change positive">+$0.00 (+0.00%)</span>`;
        return;
    }
    
    const totalCost = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0);
    const currentValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
    const totalGain = currentValue - totalCost;
    const gainPercent = (totalGain / totalCost) * 100;
    
    // Mock day change (would come from API in real app)
    const dayChange = currentValue * (Math.random() * 0.04 - 0.02);
    const dayChangePercent = (dayChange / currentValue) * 100;
    
    document.getElementById('portfolioValue').textContent = `$${currentValue.toFixed(2)}`;
    
    const dayChangeEl = document.getElementById('dayChange');
    const isPositiveDay = dayChange >= 0;
    dayChangeEl.innerHTML = `
        <span class="portfolio-change ${isPositiveDay ? 'positive' : 'negative'}">
            <i class="fas fa-arrow-${isPositiveDay ? 'up' : 'down'}"></i>
            ${isPositiveDay ? '+' : ''}$${Math.abs(dayChange).toFixed(2)} (${isPositiveDay ? '+' : ''}${dayChangePercent.toFixed(2)}%)
        </span>
    `;
    
    const totalGainEl = document.getElementById('totalGain');
    const isPositiveTotal = totalGain >= 0;
    totalGainEl.innerHTML = `
        <span class="portfolio-change ${isPositiveTotal ? 'positive' : 'negative'}">
            <i class="fas fa-arrow-${isPositiveTotal ? 'up' : 'down'}"></i>
            ${isPositiveTotal ? '+' : ''}$${Math.abs(totalGain).toFixed(2)} (${isPositiveTotal ? '+' : ''}${gainPercent.toFixed(2)}%)
        </span>
    `;
    
    updateAssetAllocation();
}

// Update asset allocation
function updateAssetAllocation() {
    const allocationByType = {};
    const totalValue = holdings.reduce((sum, h) => sum + (h.shares * h.currentPrice), 0);
    
    holdings.forEach(h => {
        const value = h.shares * h.currentPrice;
        if (!allocationByType[h.assetType]) {
            allocationByType[h.assetType] = 0;
        }
        allocationByType[h.assetType] += value;
    });
    
    const legend = document.querySelector('.allocation-legend');
    if (Object.keys(allocationByType).length > 0) {
        const colors = ['#2980b9', '#27ae60', '#e74c3c', '#f39c12', '#9b59b6'];
        let colorIndex = 0;
        
        legend.innerHTML = Object.entries(allocationByType).map(([type, value]) => {
            const percent = (value / totalValue) * 100;
            const color = colors[colorIndex % colors.length];
            colorIndex++;
            
            return `
                <div class="legend-item">
                    <div class="legend-color" style="background: ${color}"></div>
                    <span class="legend-label">${type}</span>
                    <span class="legend-value">${percent.toFixed(1)}%</span>
                </div>
            `;
        }).join('');
    }
}

// Delete holding
function deleteHolding(id) {
    if (confirm('Are you sure you want to delete this holding?')) {
        holdings = holdings.filter(h => h.id !== id);
        saveHoldings();
        renderHoldings();
        updatePortfolioSummary();
    }
}

// Edit holding
function editHolding(id) {
    const holding = holdings.find(h => h.id === id);
    if (!holding) return;
    
    // Populate form
    document.getElementById('assetType').value = holding.assetType;
    document.getElementById('symbol').value = holding.symbol;
    document.getElementById('assetName').value = holding.name;
    document.getElementById('shares').value = holding.shares;
    document.getElementById('avgCost').value = holding.avgCost;
    document.getElementById('purchaseDate').value = holding.purchaseDate;
    
    // Delete old and add updated on save
    deleteHolding(id);
    
    modal.classList.add('active');
}

// Initialize page
function init() {
    renderHoldings();
    updatePortfolioSummary();
    
    // Set default date to today
    document.getElementById('purchaseDate').valueAsDate = new Date();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
