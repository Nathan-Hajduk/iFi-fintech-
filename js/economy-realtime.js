// Real-Time Stock Market Data & Business News Integration
// Uses free APIs: Alpha Vantage (stocks) and NewsAPI (business news)

// API Configuration (Free tier limits apply)
// IMPORTANT: Get your own API keys from the respective services
// Store them in environment variables or a config file (NOT committed to git)
const API_CONFIG = {
    // Alpha Vantage for real-time stock data (500 requests/day free)
    // Get your key from: https://www.alphavantage.co/support/#api-key
    stocks: {
        apiKey: process.env.ALPHA_VANTAGE_KEY || 'YOUR_ALPHA_VANTAGE_KEY_HERE',
        baseURL: 'https://www.alphavantage.co/query'
    },
    // NewsAPI for business news (100 requests/day free)
    // Get your key from: https://newsapi.org/register
    news: {
        apiKey: process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY_HERE',
        baseURL: 'https://newsapi.org/v2'
    },
    // Finnhub as backup for stocks (60 requests/minute free)
    // Get your key from: https://finnhub.io/register
    finnhub: {
        apiKey: process.env.FINNHUB_API_KEY || 'YOUR_FINNHUB_KEY_HERE',
        baseURL: 'https://finnhub.io/api/v1'
    }
};

// Stock symbols to track
const MARKET_INDICES = {
    'SPY': { name: 'S&P 500', fullName: 'SPDR S&P 500 ETF Trust' },
    'DIA': { name: 'Dow Jones', fullName: 'SPDR Dow Jones Industrial Average ETF' },
    'QQQ': { name: 'Nasdaq', fullName: 'Invesco QQQ Trust' },
    'AAPL': { name: 'Apple', fullName: 'Apple Inc.' },
    'MSFT': { name: 'Microsoft', fullName: 'Microsoft Corporation' },
    'GOOGL': { name: 'Google', fullName: 'Alphabet Inc.' },
    'AMZN': { name: 'Amazon', fullName: 'Amazon.com Inc.' },
    'TSLA': { name: 'Tesla', fullName: 'Tesla Inc.' }
};

// Cache for stock data (prevent API rate limiting)
let stockDataCache = {};
let newsDataCache = null;
let lastStockUpdate = 0;
let lastNewsUpdate = 0;

// Update intervals
const STOCK_UPDATE_INTERVAL = 5000; // 5 seconds (reduced from 1 second to respect API limits)
const NEWS_UPDATE_INTERVAL = 300000; // 5 minutes

// Initialize economy page
function initializeEconomyPage() {
    console.log('Initializing Economy Page...');
    
    // Load initial data
    loadAllStockData();
    loadBusinessNews();
    
    // Set up auto-refresh intervals
    setInterval(updateStockPrices, STOCK_UPDATE_INTERVAL);
    setInterval(loadBusinessNews, NEWS_UPDATE_INTERVAL);
    
    // Update last refreshed timestamp
    updateLastRefreshedTime();
    setInterval(updateLastRefreshedTime, 1000);
    
    // Add event listeners
    setupSearchFunctionality();
    setupFilterButtons();
}

// Load all stock data
async function loadAllStockData() {
    const symbols = Object.keys(MARKET_INDICES);
    
    for (const symbol of symbols) {
        try {
            await fetchStockData(symbol);
        } catch (error) {
            console.error(`Error loading ${symbol}:`, error);
        }
    }
}

// Fetch stock data from API
async function fetchStockData(symbol) {
    const now = Date.now();
    
    // Check cache (don't fetch more than once per minute per symbol)
    if (stockDataCache[symbol] && (now - stockDataCache[symbol].timestamp < 60000)) {
        return stockDataCache[symbol].data;
    }
    
    try {
        // Try Alpha Vantage first
        const url = `${API_CONFIG.stocks.baseURL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.stocks.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
            const quote = data['Global Quote'];
            const stockData = {
                symbol: symbol,
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                volume: parseInt(quote['06. volume']),
                timestamp: now
            };
            
            // Cache the data
            stockDataCache[symbol] = {
                data: stockData,
                timestamp: now
            };
            
            // Update UI
            updateStockUI(symbol, stockData);
            
            return stockData;
        } else {
            // Fallback to Finnhub
            return await fetchStockDataFinnhub(symbol);
        }
    } catch (error) {
        console.error(`Error fetching ${symbol} from Alpha Vantage:`, error);
        return await fetchStockDataFinnhub(symbol);
    }
}

// Fallback: Fetch from Finnhub
async function fetchStockDataFinnhub(symbol) {
    try {
        const url = `${API_CONFIG.finnhub.baseURL}/quote?symbol=${symbol}&token=${API_CONFIG.finnhub.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.c) {
            const stockData = {
                symbol: symbol,
                price: data.c, // current price
                change: data.d, // change
                changePercent: data.dp, // percent change
                high: data.h, // high
                low: data.l, // low
                timestamp: Date.now()
            };
            
            // Cache the data
            stockDataCache[symbol] = {
                data: stockData,
                timestamp: Date.now()
            };
            
            // Update UI
            updateStockUI(symbol, stockData);
            
            return stockData;
        }
    } catch (error) {
        console.error(`Error fetching ${symbol} from Finnhub:`, error);
        
        // Use mock data as last resort
        return generateMockStockData(symbol);
    }
}

// Generate realistic mock data (for demo when API keys not configured)
function generateMockStockData(symbol) {
    const basePrice = {
        'SPY': 450.00,
        'DIA': 350.00,
        'QQQ': 380.00,
        'AAPL': 185.00,
        'MSFT': 380.00,
        'GOOGL': 140.00,
        'AMZN': 175.00,
        'TSLA': 240.00
    };
    
    const base = basePrice[symbol] || 100;
    const variance = (Math.random() - 0.5) * 2; // -1% to +1%
    const price = base * (1 + variance / 100);
    const change = price - base;
    const changePercent = (change / base) * 100;
    
    return {
        symbol: symbol,
        price: price,
        change: change,
        changePercent: changePercent,
        high: price * 1.01,
        low: price * 0.99,
        volume: Math.floor(Math.random() * 10000000),
        timestamp: Date.now(),
        isMock: true
    };
}

// Update stock UI elements
function updateStockUI(symbol, data) {
    const symbolLower = symbol.toLowerCase();
    
    // Update price
    const priceElement = document.getElementById(`${symbolLower}-price`);
    if (priceElement) {
        priceElement.textContent = `$${data.price.toFixed(2)}`;
        
        // Add pulse animation
        priceElement.classList.add('price-update');
        setTimeout(() => priceElement.classList.remove('price-update'), 500);
    }
    
    // Update change
    const changeElement = document.getElementById(`${symbolLower}-change`);
    if (changeElement) {
        const isPositive = data.change >= 0;
        const icon = isPositive ? '▲' : '▼';
        const sign = isPositive ? '+' : '';
        
        changeElement.textContent = `${icon} ${sign}${data.changePercent.toFixed(2)}% (${sign}${data.change.toFixed(2)})`;
        changeElement.className = isPositive ? 'change positive' : 'change negative';
    }
    
    // Update additional info if present
    const highElement = document.getElementById(`${symbolLower}-high`);
    if (highElement && data.high) {
        highElement.textContent = `$${data.high.toFixed(2)}`;
    }
    
    const lowElement = document.getElementById(`${symbolLower}-low`);
    if (lowElement && data.low) {
        lowElement.textContent = `$${data.low.toFixed(2)}`;
    }
    
    const volumeElement = document.getElementById(`${symbolLower}-volume`);
    if (volumeElement && data.volume) {
        volumeElement.textContent = formatVolume(data.volume);
    }
}

// Update all stock prices (lightweight refresh)
function updateStockPrices() {
    const now = Date.now();
    
    // Only fetch new data if enough time has passed
    if (now - lastStockUpdate < STOCK_UPDATE_INTERVAL) {
        return;
    }
    
    lastStockUpdate = now;
    
    // Rotate through symbols to avoid hitting rate limits
    const symbols = Object.keys(MARKET_INDICES);
    const index = Math.floor(now / STOCK_UPDATE_INTERVAL) % symbols.length;
    const symbol = symbols[index];
    
    fetchStockData(symbol);
}

// Load business news
async function loadBusinessNews() {
    const now = Date.now();
    
    // Check cache
    if (newsDataCache && (now - lastNewsUpdate < NEWS_UPDATE_INTERVAL)) {
        return newsDataCache;
    }
    
    try {
        // Fetch from NewsAPI
        const categories = ['technology', 'business'];
        const allNews = [];
        
        for (const category of categories) {
            const url = `${API_CONFIG.news.baseURL}/top-headlines?category=${category}&country=us&pageSize=10&apiKey=${API_CONFIG.news.apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.articles) {
                allNews.push(...data.articles);
            }
        }
        
        // Sort by publishedAt (most recent first)
        allNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        // Take top 15
        const topNews = allNews.slice(0, 15);
        
        // Cache and update UI
        newsDataCache = topNews;
        lastNewsUpdate = now;
        
        displayNewsArticles(topNews);
        
        return topNews;
    } catch (error) {
        console.error('Error fetching news:', error);
        
        // Use mock news data
        displayMockNews();
    }
}

// Display news articles with modal functionality
function displayNewsArticles(articles) {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;
    
    const newsHTML = articles.map((article, index) => `
        <article class="news-card" data-category="${article.source.name}" onclick="openNewsModal(${index})">
            <div class="news-image" style="background-image: url('${article.urlToImage || '/images/placeholder-news.jpg'}')"></div>
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-source">${sanitizeHTML(article.source.name)}</span>
                    <span class="news-time">${getTimeAgo(article.publishedAt)}</span>
                </div>
                <h3 class="news-title">${sanitizeHTML(article.title)}</h3>
                <p class="news-description">${sanitizeHTML(article.description || 'No description available')}</p>
                <button class="news-read-more-btn">
                    Read Full Story <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </article>
    `).join('');
    
    newsContainer.innerHTML = newsHTML;
    
    // Store articles globally for modal access
    window.currentNewsArticles = articles;
}

// Open news story modal
function openNewsModal(articleIndex) {
    const article = window.currentNewsArticles[articleIndex];
    if (!article) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'news-modal-overlay';
    modal.innerHTML = `
        <div class="news-modal-content">
            <div class="news-modal-header">
                <div class="news-modal-meta">
                    <span class="news-modal-source">${sanitizeHTML(article.source.name)}</span>
                    <span class="news-modal-time">${getTimeAgo(article.publishedAt)}</span>
                </div>
                <button class="news-modal-close" onclick="closeNewsModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${article.urlToImage ? `<div class="news-modal-image" style="background-image: url('${article.urlToImage}')"></div>` : ''}
            <div class="news-modal-body">
                <h2 class="news-modal-title">${sanitizeHTML(article.title)}</h2>
                <p class="news-modal-description">${sanitizeHTML(article.description || 'No description available')}</p>
                ${article.content ? `<p class="news-modal-content">${sanitizeHTML(article.content)}</p>` : ''}
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="news-modal-external-link">
                    <i class="fas fa-external-link-alt"></i> Read full article at ${article.source.name}
                </a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeNewsModal();
        }
    });
}

// Close news modal
function closeNewsModal() {
    const modal = document.querySelector('.news-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Display mock news (when API not configured)
function displayMockNews() {
    const mockArticles = [
        {
            source: { name: 'CNBC' },
            title: 'Tech Stocks Rally as Fed Signals Rate Pause',
            description: 'Major tech stocks surged today following signals from the Federal Reserve about potential pause in rate hikes.',
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            url: '#',
            urlToImage: null
        },
        {
            source: { name: 'Bloomberg' },
            title: 'Oil Prices Drop Amid Global Demand Concerns',
            description: 'Crude oil prices fell sharply as investors weigh concerns about slowing global economic growth.',
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            url: '#',
            urlToImage: null
        },
        {
            source: { name: 'Reuters' },
            title: 'AI Stocks Lead Market Gains',
            description: 'Artificial intelligence companies saw significant gains as investors bet on future growth potential.',
            publishedAt: new Date(Date.now() - 10800000).toISOString(),
            url: '#',
            urlToImage: null
        }
    ];
    
    displayNewsArticles(mockArticles);
}

// Utility Functions

function formatVolume(volume) {
    if (volume >= 1000000000) {
        return (volume / 1000000000).toFixed(2) + 'B';
    } else if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toString();
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function updateLastRefreshedTime() {
    const element = document.getElementById('last-updated-time');
    if (element) {
        const now = new Date();
        element.textContent = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Search functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('news-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterNews(query);
        });
    }
}

function filterNews(query) {
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        const title = card.querySelector('.news-title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.news-description')?.textContent.toLowerCase() || '';
        const matches = title.includes(query) || description.includes(query);
        card.style.display = matches ? 'flex' : 'none';
    });
}

// Filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterNewsByCategory(filter);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function filterNewsByCategory(category) {
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'flex';
        } else {
            const cardCategory = card.dataset.category.toLowerCase();
            card.style.display = cardCategory.includes(category.toLowerCase()) ? 'flex' : 'none';
        }
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEconomyPage);
} else {
    initializeEconomyPage();
}

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchStockData,
        loadBusinessNews,
        updateStockPrices
    };
}
