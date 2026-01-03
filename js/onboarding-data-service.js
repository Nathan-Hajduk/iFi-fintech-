/**
 * Onboarding Data Service
 * Centralized service for fetching and caching user onboarding data
 */

class OnboardingDataService {
    constructor() {
        this.cachedData = null;
        this.cacheTimestamp = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.API_BASE_URL = 'http://localhost:3000/api';
    }

    /**
     * Get onboarding data (with caching)
     */
    async getData(forceRefresh = false) {
        // Check cache
        if (!forceRefresh && this.cachedData && this.isCacheValid()) {
            console.log('📦 Returning cached onboarding data');
            return this.cachedData;
        }

        try {
            const token = localStorage.getItem('ifi_access_token');
            if (!token) {
                console.error('❌ No access token found');
                return null;
            }

            console.log('📡 Fetching onboarding data from API...');
            const response = await fetch(`${this.API_BASE_URL}/user/onboarding-data`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch onboarding data');
            }

            const data = await response.json();
            
            // Parse JSON fields if they're strings
            if (data) {
                if (typeof data.expenses === 'string') {
                    data.expenses = JSON.parse(data.expenses);
                }
                if (typeof data.subscriptions === 'string') {
                    data.subscriptions = JSON.parse(data.subscriptions);
                }
                if (typeof data.assets === 'string') {
                    data.assets = JSON.parse(data.assets);
                }
                if (typeof data.investments === 'string') {
                    data.investments = JSON.parse(data.investments);
                }
                if (typeof data.debts === 'string') {
                    data.debts = JSON.parse(data.debts);
                }
                if (typeof data.additional_income === 'string') {
                    data.additional_income = JSON.parse(data.additional_income);
                }
                if (typeof data.linked_accounts === 'string') {
                    data.linked_accounts = JSON.parse(data.linked_accounts);
                }
            }

            // Cache the data
            this.cachedData = data;
            this.cacheTimestamp = Date.now();
            
            console.log('✅ Onboarding data loaded and cached');
            return data;
        } catch (error) {
            console.error('❌ Error fetching onboarding data:', error);
            return null;
        }
    }

    /**
     * Check if cache is still valid
     */
    isCacheValid() {
        if (!this.cacheTimestamp) return false;
        return (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cachedData = null;
        this.cacheTimestamp = null;
    }

    /**
     * Get specific data sections
     */
    async getExpenses() {
        const data = await this.getData();
        return data?.expenses || {};
    }

    async getDebts() {
        const data = await this.getData();
        return data?.debts || [];
    }

    async getAssets() {
        const data = await this.getData();
        return data?.assets || [];
    }

    async getInvestments() {
        const data = await this.getData();
        return data?.investments || [];
    }

    async getSubscriptions() {
        const data = await this.getData();
        return data?.subscriptions || [];
    }

    async getIncome() {
        const data = await this.getData();
        return {
            source: data?.income_source,
            monthly: data?.monthly_takehome,
            additional: data?.additional_income || []
        };
    }

    async getLinkedAccounts() {
        const data = await this.getData();
        return data?.linked_accounts || [];
    }

    /**
     * Calculate totals
     */
    async getTotalExpenses() {
        const expenses = await this.getExpenses();
        return Object.values(expenses).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }

    async getTotalAssets() {
        const data = await this.getData();
        return parseFloat(data?.total_assets_value) || 0;
    }

    async getTotalDebts() {
        const data = await this.getData();
        return parseFloat(data?.total_debt_amount) || 0;
    }

    async getNetWorth() {
        const assets = await this.getTotalAssets();
        const debts = await this.getTotalDebts();
        return assets - debts;
    }

    async getMonthlyIncome() {
        const data = await this.getData();
        return parseFloat(data?.monthly_takehome) || 0;
    }

    async getCashFlow() {
        const income = await this.getMonthlyIncome();
        const expenses = await this.getTotalExpenses();
        return income - expenses;
    }
}

// Create global instance and explicitly attach to window
const onboardingDataService = new OnboardingDataService();
window.onboardingDataService = onboardingDataService;

// Log that service is ready
console.log('✅ Onboarding Data Service initialized');
