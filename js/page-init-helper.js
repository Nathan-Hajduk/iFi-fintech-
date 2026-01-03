/**
 * Universal Page Initialization Helper
 * Ensures data loads properly on all pages
 */

window.ifiPageInit = {
    async waitForDataService(maxWait = 5000) {
        const start = Date.now();
        while (!window.onboardingDataService && (Date.now() - start < maxWait)) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return !!window.onboardingDataService;
    },
    
    async loadPageData(pageName) {
        try {
            console.log(`🚀 Loading ${pageName} data...`);
            
            // Wait for service
            const hasService = await this.waitForDataService();
            if (!hasService) {
                console.error('❌ Data service not available');
                return null;
            }
            
            // Fetch data
            const data = await onboardingDataService.getData();
            console.log(`✅ ${pageName} data loaded:`, data);
            
            if (!data || !data.monthly_takehome) {
                console.warn('⚠️ No onboarding data found');
                return null;
            }
            
            return data;
        } catch (error) {
            console.error(`❌ Error loading ${pageName} data:`, error);
            return null;
        }
    },
    
    showNoDataMessage(message = 'Please complete your onboarding to see this page.') {
        const main = document.querySelector('main');
        if (main) {
            const existingContent = main.querySelector('.page-header-section, .summary-cards');
            if (existingContent) {
                existingContent.remove();
            }
            
            main.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; color: #e8eef9; background: #0a0e27;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
                    <h2 style="color: #00d4ff; margin-bottom: 1rem;">No Data Yet</h2>
                    <p style="color: #b8c5d9; margin-bottom: 2rem; font-size: 1.1rem;">${message}</p>
                    <a href="onboarding.html" style="display: inline-block; background: #00d4ff; color: #0a0e27; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-weight: 600;">Complete Onboarding →</a>
                </div>
            `;
        }
    },
    
    createSmallChart(canvasId, datasets, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        // Set small height
        ctx.height = 200;
        ctx.style.maxHeight = '200px';
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e8eef9',
                        font: { size: 12 },
                        padding: 10,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(20, 26, 46, 0.95)',
                    titleColor: '#e8eef9',
                    bodyColor: '#b8c5d9',
                    borderColor: '#00d4ff',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#b8c5d9'
                    },
                    grid: {
                        color: 'rgba(184, 197, 217, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#b8c5d9'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        return new Chart(ctx, {
            type: 'line',
            data: datasets,
            options: mergedOptions
        });
    }
};

console.log('✅ Page initialization helper loaded');
