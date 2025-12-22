// Debt Management JavaScript

// Strategy tab switching
document.addEventListener('DOMContentLoaded', function() {
    const strategyTabs = document.querySelectorAll('.strategy-tab');
    const strategyContent = document.querySelector('.strategy-results');
    
    // Tab click handlers
    strategyTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            strategyTabs.forEach(t => t.classList.remove('active'));
            
            // Add active to clicked tab
            this.classList.add('active');
            
            // Update strategy results based on selected tab
            const strategy = this.dataset.strategy;
            updateStrategyResults(strategy);
        });
    });
    
    // Apply strategy button handler
    const applyBtn = document.querySelector('.btn-primary');
    if (applyBtn && applyBtn.textContent.includes('Apply')) {
        applyBtn.addEventListener('click', function() {
            const activeTab = document.querySelector('.strategy-tab.active');
            const strategy = activeTab ? activeTab.dataset.strategy : 'current';
            
            if (strategy !== 'current') {
                if (confirm(`Are you sure you want to switch to the ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} strategy? This will adjust your payment allocations.`)) {
                    alert(`${strategy.charAt(0).toUpperCase() + strategy.slice(1)} strategy applied! Your payment plan has been optimized.`);
                }
            }
        });
    }
    
    // Add debt button handler
    const addDebtBtn = document.querySelector('.add-debt-btn');
    if (addDebtBtn) {
        addDebtBtn.addEventListener('click', function() {
            alert('Add Debt feature coming soon! This will allow you to manually add debt accounts for tracking.');
        });
    }
});

// Update strategy results display
function updateStrategyResults(strategy) {
    const resultsContainer = document.querySelector('.strategy-results');
    
    // Strategy calculations (placeholder data)
    const strategies = {
        current: {
            totalInterest: 87420,
            debtFreeDate: 'Mar 2048',
            monthlyPayment: 1825
        },
        avalanche: {
            totalInterest: 81580,
            debtFreeDate: 'Jan 2047',
            monthlyPayment: 1825
        },
        snowball: {
            totalInterest: 89200,
            debtFreeDate: 'May 2047',
            monthlyPayment: 1825
        }
    };
    
    const data = strategies[strategy];
    
    // Update result values
    const resultItems = resultsContainer.querySelectorAll('.result-item');
    if (resultItems.length >= 3) {
        resultItems[0].querySelector('.result-value').textContent = '$' + data.totalInterest.toLocaleString();
        resultItems[1].querySelector('.result-value').textContent = data.debtFreeDate;
        resultItems[2].querySelector('.result-value').textContent = '$' + data.monthlyPayment.toLocaleString();
    }
    
    // Update comparison message
    const comparison = document.querySelector('.strategy-comparison');
    if (comparison) {
        if (strategy === 'avalanche') {
            comparison.innerHTML = 'Switch to Avalanche: Pay off debt <strong>14 months faster</strong> and save <strong>$5,840</strong> in interest';
            comparison.style.display = 'block';
        } else if (strategy === 'snowball') {
            comparison.innerHTML = 'Snowball method focuses on quick wins by paying off smallest balances first';
            comparison.style.display = 'block';
        } else {
            comparison.style.display = 'none';
        }
    }
}

// Calculate debt-free date based on payments
function calculateDebtFreeDate(totalDebt, monthlyPayment, apr) {
    const monthlyRate = apr / 12 / 100;
    const months = Math.log(monthlyPayment / (monthlyPayment - totalDebt * monthlyRate)) / Math.log(1 + monthlyRate);
    
    const date = new Date();
    date.setMonth(date.getMonth() + Math.ceil(months));
    
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Calculate total interest paid
function calculateTotalInterest(totalDebt, monthlyPayment, apr) {
    const monthlyRate = apr / 12 / 100;
    const months = Math.log(monthlyPayment / (monthlyPayment - totalDebt * monthlyRate)) / Math.log(1 + monthlyRate);
    
    return (monthlyPayment * months) - totalDebt;
}
