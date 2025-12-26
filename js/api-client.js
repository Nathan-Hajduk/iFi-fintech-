/**
 * iFi API Client
 * Handles all API calls to the backend with authentication
 */

const API_BASE_URL = 'http://localhost:3000/api';

class IFiAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.accessToken = localStorage.getItem('ifi_access_token');
        this.refreshToken = localStorage.getItem('ifi_refresh_token');
    }

    /**
     * Get authorization headers
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        return headers;
    }

    /**
     * Make API request with automatic token refresh
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        };

        try {
            let response = await fetch(url, config);

            // If unauthorized, try to refresh token
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry request with new token
                    config.headers['Authorization'] = `Bearer ${this.accessToken}`;
                    response = await fetch(url, config);
                } else {
                    // Refresh failed, redirect to login
                    this.logout();
                    throw new Error('Session expired. Please log in again.');
                }
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.accessToken;
                localStorage.setItem('ifi_access_token', data.accessToken);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }

    /**
     * Store authentication tokens
     */
    setTokens(accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('ifi_access_token', accessToken);
        localStorage.setItem('ifi_refresh_token', refreshToken);
    }

    /**
     * Clear authentication tokens
     */
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('ifi_access_token');
        localStorage.removeItem('ifi_refresh_token');
        localStorage.removeItem('ifi_current_user');
    }

    // ==================== Auth Endpoints ====================

    /**
     * Register new user
     */
    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (data.success) {
            this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
            localStorage.setItem('ifi_current_user', JSON.stringify(data.user));
        }

        return data;
    }

    /**
     * Login user
     */
    async login(credentials) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (data.success) {
            this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
            localStorage.setItem('ifi_current_user', JSON.stringify(data.user));
            
            // Track session start
            await this.trackSession();
        }

        return data;
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
            window.location.href = '/html/Login.html';
        }
    }

    /**
     * Get current user profile
     */
    async getMe() {
        return await this.request('/auth/me');
    }

    /**
     * Request password reset
     */
    async forgotPassword(email) {
        return await this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        return await this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        });
    }

    // ==================== User Endpoints ====================

    /**
     * Get user profile
     */
    async getUserProfile() {
        return await this.request('/user/profile');
    }

    /**
     * Update user profile
     */
    async updateProfile(profileData) {
        return await this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    /**
     * Get user analytics
     */
    async getUserAnalytics() {
        return await this.request('/user/analytics');
    }

    /**
     * Get user onboarding data
     */
    async getOnboardingData() {
        return await this.request('/user/onboarding');
    }

    /**
     * Save user onboarding data
     */
    async saveOnboardingData(onboardingData) {
        return await this.request('/user/onboarding', {
            method: 'POST',
            body: JSON.stringify(onboardingData),
        });
    }

    /**
     * Get dashboard data
     */
    async getDashboard() {
        return await this.request('/user/dashboard');
    }

    /**
     * Track session start
     */
    async trackSession(deviceType = 'desktop', browser = navigator.userAgent) {
        try {
            const data = await this.request('/user/track-session', {
                method: 'POST',
                body: JSON.stringify({ device_type: deviceType, browser }),
            });
            
            if (data.success && data.session_id) {
                sessionStorage.setItem('ifi_session_id', data.session_id);
            }
            
            return data;
        } catch (error) {
            console.error('Track session error:', error);
        }
    }

    /**
     * End session
     */
    async endSession() {
        const sessionId = sessionStorage.getItem('ifi_session_id');
        if (sessionId) {
            try {
                await this.request('/user/end-session', {
                    method: 'POST',
                    body: JSON.stringify({ session_id: sessionId }),
                });
                sessionStorage.removeItem('ifi_session_id');
            } catch (error) {
                console.error('End session error:', error);
            }
        }
    }

    /**
     * Track feature usage
     */
    async trackFeature(featureName, actionType, durationSeconds = 0, metadata = {}) {
        try {
            return await this.request('/user/track-feature', {
                method: 'POST',
                body: JSON.stringify({
                    feature_name: featureName,
                    action_type: actionType,
                    duration_seconds: durationSeconds,
                    metadata,
                }),
            });
        } catch (error) {
            console.error('Track feature error:', error);
        }
    }

    // ==================== Plaid Endpoints ====================

    /**
     * Create Plaid link token
     */
    async createLinkToken(userId) {
        return await this.request('/plaid/create_link_token', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        });
    }

    /**
     * Exchange Plaid public token
     */
    async exchangePublicToken(publicToken, userId, metadata) {
        return await this.request('/plaid/exchange_public_token', {
            method: 'POST',
            body: JSON.stringify({ public_token: publicToken, userId, metadata }),
        });
    }

    /**
     * Get user's Plaid connections
     */
    async getPlaidConnections(userId) {
        return await this.request(`/plaid/connections/${userId}`);
    }

    /**
     * Sync Plaid data
     */
    async syncPlaidData(itemId) {
        return await this.request(`/plaid/sync/${itemId}`, {
            method: 'POST',
        });
    }

    /**
     * Delete Plaid connection
     */
    async deletePlaidConnection(itemId) {
        return await this.request(`/plaid/connection/${itemId}`, {
            method: 'DELETE',
        });
    }

    // ==================== AI Endpoints ====================

    /**
     * Send message to iFi AI
     */
    async sendAIMessage(message) {
        return await this.request('/ifi-ai/query', {
            method: 'POST',
            body: JSON.stringify({ query: message }),
        });
    }

    /**
     * Get AI conversation history
     */
    async getAIConversations(limit = 50) {
        return await this.request(`/ifi-ai/conversations?limit=${limit}`);
    }
}

// Create global instance
const ifiAPI = new IFiAPI();

// Track page unload to end session
window.addEventListener('beforeunload', () => {
    // Use sendBeacon for reliable tracking on page unload
    const sessionId = sessionStorage.getItem('ifi_session_id');
    if (sessionId && ifiAPI.accessToken) {
        const url = `${API_BASE_URL}/user/end-session`;
        const data = JSON.stringify({ session_id: sessionId });
        navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
    }
});

// Make available globally
window.ifiAPI = ifiAPI;
