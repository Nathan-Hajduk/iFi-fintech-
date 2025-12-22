// Unified Navigation Component for All Post-Login Pages
// Ensures consistent navigation across dashboard, net-worth, budget, debt, goals, investments, economy, ifi-ai

// Navigation configuration
const NAV_CONFIG = {
    pages: [
        { id: 'dashboard', name: 'Dashboard', icon: 'fa-home', href: 'dashboard.html' },
        { id: 'net-worth', name: 'Net Worth', icon: 'fa-chart-line', href: 'net-worth.html' },
        { id: 'budget', name: 'Budget', icon: 'fa-calculator', href: 'budget.html' },
        { id: 'debt', name: 'Debt', icon: 'fa-credit-card', href: 'debt.html' },
        { id: 'goals', name: 'Goals', icon: 'fa-bullseye', href: 'goals.html' },
        { id: 'investments', name: 'Investments', icon: 'fa-chart-pie', href: 'investments.html' },
        { id: 'economy', name: 'Economy', icon: 'fa-globe-americas', href: 'economy.html' },
        { id: 'transactions', name: 'Transactions', icon: 'fa-receipt', href: 'transactions.html' },
        { id: 'ifi-ai', name: 'iFi AI', icon: 'fa-robot', href: 'ifi-ai.html' }
    ],
    userMenuItems: [
        { name: 'Profile', icon: 'fa-user', href: 'settings.html' },
        { name: 'Settings', icon: 'fa-cog', href: 'settings.html' },
        { name: 'Help', icon: 'fa-question-circle', href: 'feedback.html' }
    ]
};

// Generate navigation HTML
function generateNavigationHTML(activePage) {
    const navLinks = NAV_CONFIG.pages.map(page => {
        const isActive = page.id === activePage ? 'active' : '';
        const ariaCurrent = page.id === activePage ? 'aria-current="page"' : '';
        return `
            <a href="${page.href}" class="nav-link ${isActive}" ${ariaCurrent}>
                <i class="fas ${page.icon}" aria-hidden="true"></i>
                <span>${page.name}</span>
            </a>
        `;
    }).join('');

    const userMenuItems = NAV_CONFIG.userMenuItems.map(item => `
        <a href="${item.href}" class="dropdown-item" role="menuitem">
            <i class="fas ${item.icon}" aria-hidden="true"></i> ${item.name}
        </a>
    `).join('');

    return `
        <header class="modern-header" role="banner">
            <div class="header-inner">
                <a href="dashboard.html" class="logo-brand" aria-label="iFi Home">
                    <svg class="logo" width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="6" y="30" width="10" height="14" fill="#5dade2" rx="2"/>
                        <rect x="20" y="18" width="10" height="26" fill="#3498db" rx="2"/>
                        <rect x="34" y="6" width="10" height="38" fill="#2980b9" rx="2"/>
                    </svg>
                    <span class="brand-name">iFi</span>
                </a>
                
                <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
                    <i class="fas fa-bars"></i>
                </button>
                
                <nav class="dashboard-nav" role="navigation" aria-label="Main navigation">
                    ${navLinks}
                </nav>

                <div class="user-menu">
                    <button class="user-menu-btn" onclick="toggleUserMenu()" aria-label="User menu" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-user-circle" aria-hidden="true"></i>
                        <span id="user-name-display">User</span>
                        <i class="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div class="user-dropdown" id="userDropdown" role="menu" aria-label="User menu options">
                        ${userMenuItems}
                        <div class="dropdown-divider"></div>
                        <a href="#" onclick="logout(); return false;" class="dropdown-item logout" role="menuitem">
                            <i class="fas fa-sign-out-alt" aria-hidden="true"></i> Logout
                        </a>
                    </div>
                </div>
            </div>
        </header>
    `;
}

// Initialize navigation on page load
function initializeNavigation(activePage) {
    // Find the header element or create placeholder
    let headerContainer = document.querySelector('header');
    
    if (!headerContainer) {
        // If no header exists, create one at the top of body
        headerContainer = document.createElement('div');
        document.body.insertBefore(headerContainer, document.body.firstChild);
    }
    
    // Inject navigation HTML
    headerContainer.outerHTML = generateNavigationHTML(activePage);
    
    // Initialize mobile menu
    setupMobileMenu();
    
    // Initialize user dropdown
    setupUserDropdown();
    
    // Load user data if available
    loadUserData();
}

// Mobile menu functionality
function setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.dashboard-nav');
    
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
            nav.classList.toggle('mobile-open');
            
            // Animate icon
            const icon = toggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggle.contains(e.target) && !nav.contains(e.target)) {
                toggle.setAttribute('aria-expanded', 'false');
                nav.classList.remove('mobile-open');
                const icon = toggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}

// User dropdown functionality
function setupUserDropdown() {
    const userBtn = document.querySelector('.user-menu-btn');
    const dropdown = document.getElementById('userDropdown');
    
    if (userBtn && dropdown) {
        // Toggle dropdown
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = userBtn.getAttribute('aria-expanded') === 'true';
            userBtn.setAttribute('aria-expanded', !isExpanded);
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
                userBtn.setAttribute('aria-expanded', 'false');
                dropdown.classList.remove('show');
            }
        });
    }
}

// Load user data from localStorage
function loadUserData() {
    try {
        const userData = localStorage.getItem('userData');
        if (userData) {
            const user = JSON.parse(userData);
            const nameDisplay = document.getElementById('user-name-display');
            if (nameDisplay && user.firstName) {
                nameDisplay.textContent = user.firstName;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Toggle user menu (for backward compatibility)
function toggleUserMenu() {
    const userBtn = document.querySelector('.user-menu-btn');
    const dropdown = document.getElementById('userDropdown');
    
    if (userBtn && dropdown) {
        const isExpanded = userBtn.getAttribute('aria-expanded') === 'true';
        userBtn.setAttribute('aria-expanded', !isExpanded);
        dropdown.classList.toggle('show');
    }
}

// Logout functionality
function logout() {
    // Clear all user data
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = 'Login.html';
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeNavigation, toggleUserMenu, logout };
}
