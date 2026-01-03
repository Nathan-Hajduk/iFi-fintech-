// Step 3 Financial Data Collection with API Integration
// Uses CoinGecko API (free, no key needed) and Yahoo Finance alternative
// Loads subscription database from external file

// ============================================
// PROGRESSIVE REVEAL SYSTEM
// ============================================
const sectionOrder = ['income', 'expenses', 'budget', 'assets', 'debt', 'investments', 'subscriptions', 'additional'];
let currentRevealedSection = 0;

// Track section completion
const sectionCompletion = {
    income: false,
    expenses: false,
    budget: false,
    assets: false,
    debt: false,
    investments: false,
    subscriptions: false,
    additional: false
};

// Initialize progressive reveal
function initProgressiveReveal() {
    // Set up input listeners for all sections
    setupSectionListeners('income', ['monthly-takehome']);
    setupSectionListeners('expenses', ['fixed-expenses', 'variable-expenses']);
    setupSectionListeners('budget', ['budget-housing', 'budget-utilities']);
    setupSectionListeners('assets', ['checking-balance']);
    setupSectionListeners('debt', ['total-debt', 'monthly-debt-payments']);
    setupSectionListeners('investments', ['monthly-contributions']);
    setupSectionListeners('subscriptions', ['subscription-search']);
    setupSectionListeners('additional', ['monthly-housing']);
}

// Setup input listeners for a section
function setupSectionListeners(sectionName, inputIds) {
    inputIds.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', () => {
                checkSectionCompletion(sectionName);
                validateStep3Complete();
            });
            input.addEventListener('change', () => {
                checkSectionCompletion(sectionName);
                validateStep3Complete();
            });
            input.addEventListener('input', () => {
                validateStep3Complete();
            });
        }
    });
}

// Check if section is complete and reveal next
function checkSectionCompletion(sectionName) {
    const sectionElement = document.getElementById(`${sectionName}-section`);
    if (!sectionElement) return;
    
    let isComplete = false;
    
    // Check completion based on section
    switch(sectionName) {
        case 'income':
            const takehome = document.getElementById('monthly-takehome');
            isComplete = takehome && takehome.value && parseFloat(takehome.value) > 0;
            break;
        case 'expenses':
            const fixed = document.getElementById('fixed-expenses');
            const variable = document.getElementById('variable-expenses');
            isComplete = fixed && variable && fixed.value && variable.value;
            break;
        case 'assets':
            const checking = document.getElementById('checking-balance');
            isComplete = checking && checking.value;
            break;
        case 'debt':
        case 'investments':
        case 'subscriptions':
        case 'additional':
            // Optional sections - mark as complete if user interacts
            isComplete = true;
            break;
    }
    
    if (isComplete && !sectionCompletion[sectionName]) {
        sectionCompletion[sectionName] = true;
        markSectionComplete(sectionName);
        revealNextSection();
    }
    
    // Check if all required sections are complete to show continue button
    validateStep3Complete();
}

// Validate if Step 3 has all required fields filled
function validateStep3Complete() {
    const takehome = document.getElementById('monthly-takehome');
    const fixed = document.getElementById('fixed-expenses');
    const variable = document.getElementById('variable-expenses');
    const checking = document.getElementById('checking-balance');
    
    const isComplete = 
        takehome && takehome.value && parseFloat(takehome.value) > 0 &&
        fixed && fixed.value && parseFloat(fixed.value) >= 0 &&
        variable && variable.value && parseFloat(variable.value) >= 0 &&
        checking && checking.value && parseFloat(checking.value) >= 0;
    
    const continueBtn = document.getElementById('step3-continue-btn');
    if (continueBtn) {
        if (isComplete) {
            continueBtn.style.display = 'block';
        } else {
            continueBtn.style.display = 'none';
        }
    }
}

// Mark section as complete with checkmark
function markSectionComplete(sectionName) {
    const sectionElement = document.getElementById(`${sectionName}-section`);
    if (!sectionElement) return;
    
    const heading = sectionElement.querySelector('h3');
    if (heading && !heading.querySelector('.section-complete-indicator')) {
        const checkmark = document.createElement('span');
        checkmark.className = 'section-complete-indicator';
        checkmark.innerHTML = '<i class="fas fa-check"></i>';
        heading.appendChild(checkmark);
    }
}

// Reveal the next hidden section
function revealNextSection() {
    const nextIndex = currentRevealedSection + 1;
    if (nextIndex >= sectionOrder.length) return;
    
    const nextSectionName = sectionOrder[nextIndex];
    const nextSection = document.getElementById(`${nextSectionName}-section`);
    
    if (nextSection && !nextSection.classList.contains('revealed')) {
        currentRevealedSection = nextIndex;
        nextSection.classList.add('revealed');
        
        // Scroll to the newly revealed section
        setTimeout(() => {
            nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// ============================================
// DATA STORAGE
// ============================================
// Make step3Data globally accessible so onboarding.js can read it
window.step3Data = {
    investments: [],
    subscriptions: []
};
 
// ============================================
// DATABASES (Loaded from external files)
// ============================================
let COMMON_SUBSCRIPTIONS = [];
let STOCKS_LIST = [];

// Load subscriptions from external database
function loadSubscriptionDatabase() {
    if (typeof SUBSCRIPTIONS_DATABASE !== 'undefined') {
        COMMON_SUBSCRIPTIONS = SUBSCRIPTIONS_DATABASE;
        console.log(`Loaded ${COMMON_SUBSCRIPTIONS.length} subscriptions from database`);
    } else {
        console.warn('Subscription database not loaded. Using fallback.');
        COMMON_SUBSCRIPTIONS = [
            { name: "Netflix", cost: 15.99, category: "entertainment" },
            { name: "Spotify Premium", cost: 10.99, category: "entertainment" }
        ];
    }
}

// Load stocks/ETFs from external database
function loadStocksDatabase() {
    if (typeof STOCKS_DATABASE !== 'undefined') {
        STOCKS_LIST = STOCKS_DATABASE;
        console.log(`Loaded ${STOCKS_LIST.length} stocks/ETFs from database`);
    } else {
        console.warn('Stocks database not loaded. Using fallback.');
        STOCKS_LIST = [
            { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 175.50 },
            { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', price: 385.20 }
        ];
    }
}

// ============================================
// INITIALIZE STEP 3
// ============================================
function initializeStep3() {
    // Initialize progressive reveal system
    initProgressiveReveal();
    
    // Load databases
    loadSubscriptionDatabase();
    loadStocksDatabase();
    
    // Set up subscription search
    const subscriptionSearch = document.getElementById('subscription-search');
    if (subscriptionSearch) {
        subscriptionSearch.addEventListener('input', handleSubscriptionSearch);
        subscriptionSearch.addEventListener('keydown', handleSearchKeydown);
        document.addEventListener('click', closeAllAutocomplete);
    }
    
    // Set up investment search
    const investmentSearch = document.getElementById('investment-search');
    if (investmentSearch) {
        investmentSearch.addEventListener('input', handleInvestmentSearch);
        investmentSearch.addEventListener('keydown', handleSearchKeydown);
    }
    
    // Set up real-time calculations
    setupFinancialCalculations();
}

// ============================================
// SUBSCRIPTION SEARCH
// ============================================
let subscriptionSearchTimeout;

function handleSubscriptionSearch(e) {
    clearTimeout(subscriptionSearchTimeout);
    const query = e.target.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('subscription-results');
    
    if (query.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    subscriptionSearchTimeout = setTimeout(() => {
        const matches = COMMON_SUBSCRIPTIONS.filter(sub => 
            sub.name.toLowerCase().includes(query)
        ).slice(0, 8);
        
        displaySubscriptionResults(matches);
    }, 200);
}

function displaySubscriptionResults(matches) {
    const resultsDiv = document.getElementById('subscription-results');
    
    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div class="autocomplete-item" style="cursor: default; opacity: 0.6;">No subscriptions found</div>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    resultsDiv.innerHTML = matches.map(sub => `
        <div class="autocomplete-item" onclick="selectSubscription('${sub.name}', ${sub.cost}, '${sub.category}')">
            <span class="autocomplete-item-icon"><i class="fas fa-tv"></i></span>
            <div class="autocomplete-item-content">
                <div class="autocomplete-item-name">${sub.name}</div>
                <div class="autocomplete-item-details">${capitalize(sub.category)}</div>
            </div>
            <div class="autocomplete-item-price">$${sub.cost.toFixed(2)}/mo</div>
        </div>
    `).join('');
    
    resultsDiv.style.display = 'block';
}

function selectSubscription(name, cost, category) {
    // Add to list
    step3Data.subscriptions.push({ name, cost, category, id: Date.now() });
    
    // Clear search
    document.getElementById('subscription-search').value = '';
    document.getElementById('subscription-results').style.display = 'none';
    
    // Update display
    renderSubscriptionList();
}

function renderSubscriptionList() {
    const listDiv = document.getElementById('subscription-list');
    const totalDisplay = document.getElementById('subscription-total-display');
    const totalAmount = document.getElementById('subscription-total-amount');
    
    if (step3Data.subscriptions.length === 0) {
        listDiv.innerHTML = '';
        if (totalDisplay) totalDisplay.style.display = 'none';
        return;
    }
    
    const total = step3Data.subscriptions.reduce((sum, sub) => sum + sub.cost, 0);
    
    listDiv.innerHTML = step3Data.subscriptions.map(sub => `
        <div class="subscription-list-item">
            <div class="subscription-list-item-info">
                <div class="subscription-list-item-name">${sub.name}</div>
                <div class="subscription-list-item-details">${capitalize(sub.category)}</div>
            </div>
            <div class="subscription-list-item-cost">$${sub.cost.toFixed(2)}</div>
            <button class="remove-item-btn" onclick="removeSubscription(${sub.id})">
                <i class="fas fa-times"></i> Remove
            </button>
        </div>
    `).join('');
    
    // Update and show total display
    if (totalDisplay && totalAmount) {
        totalDisplay.style.display = 'block';
        totalAmount.textContent = `$${total.toFixed(2)}`;
    }
    
    // Also update financial metrics
    calculateFinancialMetrics();
}

function removeSubscription(id) {
    step3Data.subscriptions = step3Data.subscriptions.filter(sub => sub.id !== id);
    renderSubscriptionList();
}

// ============================================
// INVESTMENT SEARCH (Using CoinGecko & Yahoo Finance Alternative)
// ============================================
let investmentSearchTimeout;

async function handleInvestmentSearch(e) {
    clearTimeout(investmentSearchTimeout);
    const query = e.target.value.trim().toUpperCase();
    const resultsDiv = document.getElementById('investment-results');
    
    if (query.length < 1) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    investmentSearchTimeout = setTimeout(async () => {
        try {
            // Try to fetch from multiple sources
            const results = await searchInvestments(query);
            displayInvestmentResults(results);
        } catch (error) {
            console.error('Investment search error:', error);
            resultsDiv.innerHTML = '<div class="autocomplete-item" style="cursor: default; opacity: 0.6;">Unable to fetch data. Try again.</div>';
            resultsDiv.style.display = 'block';
        }
    }, 300);
}

async function searchInvestments(query) {
    const results = [];
    
    // Search crypto using CoinGecko (free, no API key)
    if (query.length >= 2) {
        try {
            const cryptoResults = await searchCrypto(query);
            results.push(...cryptoResults);
        } catch (err) {
            console.warn('Crypto search failed:', err);
        }
    }
    
    // Add popular stocks manually (since free stock APIs are limited)
    const popularStocks = getPopularStocks(query);
    results.push(...popularStocks);
    
    return results.slice(0, 8);
}

async function searchCrypto(query) {
    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
    const data = await response.json();
    
    return data.coins.slice(0, 5).map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        type: 'crypto',
        price: null, // Will fetch when selected
        id: coin.id
    }));
}

function getPopularStocks(query) {
    const stocks = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 175.50 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', price: 385.20 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', price: 142.30 },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', price: 178.90 },
        { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', price: 245.60 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', price: 495.00 },
        { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', price: 485.00 },
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', price: 420.00 },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', price: 245.00 },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', price: 395.00 },
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', price: 470.00 }
    ];
    
    return stocks.filter(stock => 
        stock.symbol.includes(query) || 
        stock.name.toUpperCase().includes(query)
    );
}

function displayInvestmentResults(results) {
    const resultsDiv = document.getElementById('investment-results');
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<div class="autocomplete-item" style="cursor: default; opacity: 0.6;">No investments found</div>';
        resultsDiv.style.display = 'block';
        return;
    }
    
    resultsDiv.innerHTML = results.map(inv => `
        <div class="autocomplete-item" onclick='selectInvestment(${JSON.stringify(inv)})'>
            <span class="autocomplete-item-icon">
                <i class="fas fa-${inv.type === 'crypto' ? 'bitcoin' : inv.type === 'etf' ? 'chart-pie' : 'chart-line'}"></i>
            </span>
            <div class="autocomplete-item-content">
                <div class="autocomplete-item-name">${inv.symbol} - ${inv.name}</div>
                <div class="autocomplete-item-details">${capitalize(inv.type)}</div>
            </div>
            ${inv.price ? `<div class="autocomplete-item-price">$${inv.price.toFixed(2)}</div>` : ''}
        </div>
    `).join('');
    
    resultsDiv.style.display = 'block';
}

async function selectInvestment(investment) {
    // Fetch real-time price if crypto
    if (investment.type === 'crypto' && investment.id) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${investment.id}&vs_currencies=usd`);
            const data = await response.json();
            investment.price = data[investment.id]?.usd || 0;
        } catch (err) {
            console.error('Failed to fetch crypto price:', err);
            investment.price = 0;
        }
    }
    
    // Prompt user for shares
    const shares = prompt(`How many ${investment.type === 'crypto' ? 'units' : 'shares'} of ${investment.symbol} do you own?`, '1');
    if (!shares || isNaN(shares) || parseFloat(shares) <= 0) {
        return;
    }
    
    const sharesNum = parseFloat(shares);
    const totalValue = sharesNum * (investment.price || 0);
    
    step3Data.investments.push({
        ...investment,
        shares: sharesNum,
        totalValue,
        id: Date.now()
    });
    
    // Clear search
    document.getElementById('investment-search').value = '';
    document.getElementById('investment-results').style.display = 'none';
    
    // Update display
    renderInvestmentList();
}

function renderInvestmentList() {
    const listDiv = document.getElementById('investment-holdings-list');
    
    if (step3Data.investments.length === 0) {
        listDiv.innerHTML = '';
        return;
    }
    
    const totalValue = step3Data.investments.reduce((sum, inv) => sum + inv.totalValue, 0);
    
    listDiv.innerHTML = `
        ${step3Data.investments.map(inv => `
            <div class="holdings-list-item">
                <div class="holdings-list-item-info">
                    <div class="holdings-list-item-name">${inv.symbol} - ${inv.name}</div>
                    <div class="holdings-list-item-details">
                        ${inv.shares.toFixed(4)} ${inv.type === 'crypto' ? 'units' : 'shares'} × $${inv.price.toFixed(2)} = $${inv.totalValue.toFixed(2)}
                    </div>
                </div>
                <div class="holdings-list-item-value">$${inv.totalValue.toFixed(2)}</div>
                <button class="remove-item-btn" onclick="removeInvestment(${inv.id})">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
        `).join('')}
        <div style="text-align: right; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid rgba(93, 173, 226, 0.3);">
            <strong style="color: #4dd0e1; font-size: 1.25rem;">Total Holdings Value: $${totalValue.toFixed(2)}</strong>
        </div>
    `;
}

function removeInvestment(id) {
    step3Data.investments = step3Data.investments.filter(inv => inv.id !== id);
    renderInvestmentList();
}

// ============================================
// FINANCIAL CALCULATIONS
// ============================================
function setupFinancialCalculations() {
    const inputs = [
        'monthly-takehome', 'additional-income', 'fixed-expenses', 'variable-expenses',
        'checking-balance', 'savings-balance', 'cash-hand', 'other-assets',
        'total-debt', 'monthly-debt-payments', 'monthly-contributions'
    ];
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', calculateFinancialMetrics);
        }
    });
}

function calculateFinancialMetrics() {
    const takeHome = parseFloat(document.getElementById('monthly-takehome')?.value || 0);
    const additionalIncome = parseFloat(document.getElementById('additional-income')?.value || 0);
    const fixedExpenses = parseFloat(document.getElementById('fixed-expenses')?.value || 0);
    const variableExpenses = parseFloat(document.getElementById('variable-expenses')?.value || 0);
    const debtPayments = parseFloat(document.getElementById('monthly-debt-payments')?.value || 0);
    
    // Calculate subscriptions total from selected subscriptions
    const subscriptions = step3Data.subscriptions.reduce((sum, sub) => sum + sub.cost, 0);
    
    // Calculate portfolio value from selected investments
    const portfolio = step3Data.investments.reduce((sum, inv) => sum + inv.totalValue, 0);
    
    const checking = parseFloat(document.getElementById('checking-balance')?.value || 0);
    const savings = parseFloat(document.getElementById('savings-balance')?.value || 0);
    const cash = parseFloat(document.getElementById('cash-hand')?.value || 0);
    const otherAssets = parseFloat(document.getElementById('other-assets')?.value || 0);
    const totalDebt = parseFloat(document.getElementById('total-debt')?.value || 0);
    
    // Calculate metrics
    const totalIncome = takeHome + additionalIncome;
    const totalExpenses = fixedExpenses + variableExpenses + debtPayments + subscriptions;
    const freeCash = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (freeCash / totalIncome * 100) : 0;
    const totalAssets = checking + savings + cash + otherAssets + portfolio;
    const netWorth = totalAssets - totalDebt;
    const emergencyMonths = totalExpenses > 0 ? ((checking + savings + cash) / totalExpenses) : 0;
    
    // Display metrics
    const metricsDiv = document.getElementById('calculated-metrics');
    if (metricsDiv && (totalIncome > 0 || totalAssets > 0)) {
        metricsDiv.style.display = 'block';
        
        const networthEl = document.getElementById('metric-networth');
        const freecashEl = document.getElementById('metric-freecash');
        const savingsrateEl = document.getElementById('metric-savingsrate');
        const emergencyEl = document.getElementById('metric-emergency');
        
        if (networthEl) networthEl.textContent = formatCurrency(netWorth);
        if (freecashEl) freecashEl.textContent = formatCurrency(freeCash);
        if (savingsrateEl) savingsrateEl.textContent = savingsRate.toFixed(1) + '%';
        if (emergencyEl) emergencyEl.textContent = emergencyMonths.toFixed(1) + ' months';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function handleSearchKeydown(e) {
    if (e.key === 'Escape') {
        e.target.value = '';
        document.querySelectorAll('.autocomplete-results').forEach(div => {
            div.style.display = 'none';
        });
    }
}

function closeAllAutocomplete(e) {
    if (!e.target.matches('#subscription-search') && !e.target.matches('#investment-search')) {
        document.querySelectorAll('.autocomplete-results').forEach(div => {
            div.style.display = 'none';
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStep3);
} else {
    initializeStep3();
}
