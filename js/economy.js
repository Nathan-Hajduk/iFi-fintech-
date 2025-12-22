// Economy Page Logic

// Mock data for market indices
const marketIndices = [
    { name: 'S&P 500', symbol: 'SPX', value: 4783.45, change: 67.89, changePercent: 1.44 },
    { name: 'Dow Jones', symbol: 'DJI', value: 37440.34, change: -125.56, changePercent: -0.33 },
    { name: 'NASDAQ', symbol: 'IXIC', value: 14963.87, change: 234.12, changePercent: 1.59 },
    { name: 'Bitcoin', symbol: 'BTC', value: 43256.78, change: 1234.56, changePercent: 2.94 }
];

// Mock news data
const newsArticles = [
    { 
        source: 'Financial Times', 
        title: 'Federal Reserve Signals Potential Rate Cuts in 2024', 
        time: '2 hours ago',
        category: 'markets'
    },
    { 
        source: 'Bloomberg', 
        title: 'Tech Stocks Rally on Strong Earnings Reports', 
        time: '4 hours ago',
        category: 'stocks'
    },
    { 
        source: 'Reuters', 
        title: 'Oil Prices Surge on Middle East Tensions', 
        time: '5 hours ago',
        category: 'commodities'
    },
    { 
        source: 'Wall Street Journal', 
        title: 'Bitcoin Hits New All-Time High Amid ETF Approval', 
        time: '6 hours ago',
        category: 'crypto'
    },
    { 
        source: 'CNBC', 
        title: 'Housing Market Shows Signs of Recovery', 
        time: '8 hours ago',
        category: 'economy'
    },
    { 
        source: 'MarketWatch', 
        title: 'Dollar Weakens Against Major Currencies', 
        time: '10 hours ago',
        category: 'forex'
    }
];

// Economic indicators data
const economicIndicators = [
    { label: 'Federal Funds Rate', value: '5.50%', change: 0, icon: 'fa-percent' },
    { label: 'Inflation Rate (CPI)', value: '3.4%', change: -0.2, icon: 'fa-chart-line' },
    { label: 'Unemployment Rate', value: '3.7%', change: 0.1, icon: 'fa-users' },
    { label: 'GDP Growth', value: '2.8%', change: 0.3, icon: 'fa-chart-bar' }
];

// AI insights
const aiInsights = [
    {
        title: 'Market Momentum',
        text: 'Technology sector showing strong momentum with major indices up. Consider diversifying portfolio to capture growth opportunities.'
    },
    {
        title: 'Interest Rate Impact',
        text: 'Federal Reserve\'s dovish stance may benefit growth stocks and real estate. Monitor rate-sensitive sectors for potential opportunities.'
    },
    {
        title: 'Risk Assessment',
        text: 'Current market volatility suggests maintaining balanced portfolio. Consider increasing cash position for tactical opportunities.'
    }
];

// Trending topics
const trendingTopics = [
    'AI Revolution',
    'Clean Energy',
    'Electric Vehicles',
    'Semiconductor Shortage',
    'Digital Banking',
    'Remote Work',
    'Cybersecurity',
    '5G Technology'
];

// DOM Elements
const categoryBtns = document.querySelectorAll('.category-btn');
const newsFeed = document.getElementById('newsFeed');

// Category filter
let activeCategory = 'all';
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.category;
        renderNews();
    });
});

// Render market indices
function renderMarketIndices() {
    const indicesContainer = document.querySelector('.market-indices');
    indicesContainer.innerHTML = marketIndices.map((index, i) => {
        const isPositive = index.change >= 0;
        const icons = ['fa-chart-line', 'fa-building-columns', 'fa-microchip', 'fa-bitcoin'];
        
        return `
            <div class="index-card">
                <div class="index-header">
                    <span class="index-name">${index.name}</span>
                    <div class="index-icon">
                        <i class="fas ${icons[i]}"></i>
                    </div>
                </div>
                <div class="index-value">$${index.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div class="index-change ${isPositive ? 'positive' : 'negative'}">
                    <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                    ${isPositive ? '+' : ''}$${Math.abs(index.change).toFixed(2)} (${isPositive ? '+' : ''}${index.changePercent.toFixed(2)}%)
                </div>
            </div>
        `;
    }).join('');
}

// Render news feed
function renderNews() {
    const filtered = activeCategory === 'all' 
        ? newsArticles 
        : newsArticles.filter(n => n.category === activeCategory);
    
    if (filtered.length === 0) {
        newsFeed.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <p>No news available for this category</p>
            </div>
        `;
        return;
    }
    
    newsFeed.innerHTML = filtered.map(news => `
        <div class="news-item" onclick="window.open('#', '_blank')">
            <div class="news-source">${news.source}</div>
            <div class="news-title">${news.title}</div>
            <div class="news-time">${news.time}</div>
        </div>
    `).join('');
}

// Render economic indicators
function renderIndicators() {
    const indicatorsContainer = document.querySelector('.indicators-widget');
    const indicatorsList = economicIndicators.map(indicator => {
        const changeClass = indicator.change > 0 ? 'positive' : indicator.change < 0 ? 'negative' : '';
        const changeText = indicator.change !== 0 
            ? `<div class="indicator-change ${changeClass}">
                <i class="fas fa-arrow-${indicator.change > 0 ? 'up' : 'down'}"></i>
                ${Math.abs(indicator.change)}% from last month
               </div>`
            : '<div class="indicator-change">Unchanged</div>';
        
        return `
            <div class="indicator-item">
                <div class="indicator-label">
                    <i class="fas ${indicator.icon}"></i>
                    ${indicator.label}
                </div>
                <div class="indicator-value">${indicator.value}</div>
                ${changeText}
            </div>
        `;
    }).join('');
    
    indicatorsContainer.querySelector('.widget-header').insertAdjacentHTML('afterend', indicatorsList);
}

// Render AI insights
function renderInsights() {
    const insightsGrid = document.querySelector('.insights-grid');
    insightsGrid.innerHTML = aiInsights.map(insight => `
        <div class="insight-card">
            <div class="insight-title">${insight.title}</div>
            <div class="insight-text">${insight.text}</div>
        </div>
    `).join('');
}

// Render trending topics
function renderTrending() {
    const trendingTags = document.querySelector('.trending-tags');
    trendingTags.innerHTML = trendingTopics.map(topic => `
        <span class="trend-tag">${topic}</span>
    `).join('');
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
    setInterval(() => {
        // Randomly update market indices
        marketIndices.forEach(index => {
            const change = (Math.random() - 0.5) * 20;
            index.value += change;
            index.change += change;
            index.changePercent = (index.change / (index.value - index.change)) * 100;
        });
        
        renderMarketIndices();
    }, 10000); // Update every 10 seconds
}

// Initialize page
function init() {
    renderMarketIndices();
    renderNews();
    renderIndicators();
    renderInsights();
    renderTrending();
    
    // Start real-time updates
    simulateRealTimeUpdates();
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
