/**
 * Client-Side Authentication Manager
 * Handles JWT tokens, login/logout, and protected route access
 */

class AuthManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    this.tokenRefreshTimer = null;
    
    // Load tokens from localStorage on init
    this.loadFromStorage();
  }
  
  /**
   * Load tokens and user data from localStorage
   */
  loadFromStorage() {
    try {
      this.accessToken = localStorage.getItem('ifi_access_token');
      this.refreshToken = localStorage.getItem('ifi_refresh_token');
      const userData = localStorage.getItem('ifi_user');
      
      if (userData) {
        this.user = JSON.parse(userData);
      }
      
      // Start token refresh timer if we have a refresh token
      if (this.refreshToken) {
        this.scheduleTokenRefresh();
      }
    } catch (error) {
      console.error('Error loading auth data from storage:', error);
      this.clearAuth();
    }
  }
  
  /**
   * Save tokens and user data to localStorage
   */
  saveToStorage() {
    try {
      if (this.accessToken) {
        localStorage.setItem('ifi_access_token', this.accessToken);
      }
      if (this.refreshToken) {
        localStorage.setItem('ifi_refresh_token', this.refreshToken);
      }
      if (this.user) {
        localStorage.setItem('ifi_user', JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Error saving auth data to storage:', error);
    }
  }
  
  /**
   * Clear authentication data
   */
  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    
    localStorage.removeItem('ifi_access_token');
    localStorage.removeItem('ifi_refresh_token');
    localStorage.removeItem('ifi_user');
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }
  
  /**
   * Register new user account
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Store tokens and user data
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.user = data.user;
      this.saveToStorage();
      this.scheduleTokenRefresh();
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login result
   */
  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store tokens and user data
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.user = data.user;
      this.saveToStorage();
      this.scheduleTokenRefresh();
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      if (this.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
      window.location.href = '/html/Login.html';
    }
  }
  
  /**
   * Refresh access token using refresh token
   * @returns {Promise<boolean>} True if refresh successful
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }
      
      this.accessToken = data.accessToken;
      localStorage.setItem('ifi_access_token', this.accessToken);
      this.scheduleTokenRefresh();
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      window.location.href = '/html/Login.html';
      return false;
    }
  }
  
  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    
    // Refresh token 1 minute before it expires (15min - 1min = 14min)
    const refreshIn = 14 * 60 * 1000; // 14 minutes
    
    this.tokenRefreshTimer = setTimeout(async () => {
      await this.refreshAccessToken();
    }, refreshIn);
  }
  
  /**
   * Make authenticated API request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async fetch(url, options = {}) {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }
    
    // Add authorization header
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    
    let response = await fetch(url, options);
    
    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      
      if (refreshed) {
        // Retry request with new token
        options.headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, options);
      }
    }
    
    return response;
  }
  
  /**
   * Get current user data
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      const response = await this.fetch('/api/auth/me');
      const data = await response.json();
      
      if (response.ok) {
        this.user = data.user;
        this.saveToStorage();
        return data.user;
      }
      
      throw new Error(data.message || 'Failed to get user data');
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!this.accessToken && !!this.user;
  }
  
  /**
   * Check if user has required subscription tier
   * @param {string} tier - Required tier ('free', 'premium', 'enterprise')
   * @returns {boolean} True if user has access
   */
  hasSubscription(tier) {
    if (!this.user) return false;
    
    const tierLevels = {
      'free': 0,
      'premium': 1,
      'enterprise': 2
    };
    
    const userLevel = tierLevels[this.user.role] || 0;
    const requiredLevel = tierLevels[tier] || 0;
    
    return userLevel >= requiredLevel;
  }
  
  /**
   * Require authentication or redirect to login
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      const currentPath = window.location.pathname;
      window.location.href = `/html/Login.html?redirect=${encodeURIComponent(currentPath)}`;
      return false;
    }
    return true;
  }
  
  /**
   * Require subscription tier or show upgrade prompt
   * @param {string} tier - Required subscription tier
   * @returns {boolean} True if user has access
   */
  requireSubscription(tier) {
    if (!this.requireAuth()) {
      return false;
    }
    
    if (!this.hasSubscription(tier)) {
      this.showUpgradePrompt(tier);
      return false;
    }
    
    return true;
  }
  
  /**
   * Show upgrade prompt modal
   * @param {string} tier - Required tier
   */
  showUpgradePrompt(tier) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-crown"></i> ${tier.charAt(0).toUpperCase() + tier.slice(1)} Feature
          </h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>This feature requires a ${tier} subscription.</p>
          <p>Upgrade now to unlock:</p>
          <ul class="feature-list">
            ${tier === 'premium' ? `
              <li><i class="fas fa-check"></i> AI Financial Advisor</li>
              <li><i class="fas fa-check"></i> Advanced Analytics</li>
              <li><i class="fas fa-check"></i> Unlimited Accounts</li>
              <li><i class="fas fa-check"></i> Priority Support</li>
            ` : `
              <li><i class="fas fa-check"></i> All Premium Features</li>
              <li><i class="fas fa-check"></i> API Access</li>
              <li><i class="fas fa-check"></i> White-label Options</li>
              <li><i class="fas fa-check"></i> Dedicated Account Manager</li>
            `}
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            Maybe Later
          </button>
          <button class="btn btn-primary" onclick="window.location.href='/html/pricing.html'">
            View Pricing
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  /**
   * Get user display name
   * @returns {string} User's display name
   */
  getUserDisplayName() {
    if (!this.user) return 'User';
    return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim() || 'User';
  }
  
  /**
   * Get user initials for avatar
   * @returns {string} User initials
   */
  getUserInitials() {
    if (!this.user) return 'U';
    const firstName = this.user.firstName || '';
    const lastName = this.user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Expose to window for easy access
window.authManager = authManager;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}
