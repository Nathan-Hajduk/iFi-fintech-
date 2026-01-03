/**
 * Budget Page - Interactive Budget Management
 * Senior Developer Implementation for iFi Fintech
 */

async function initializeBudgetPage() {
    try {
        console.log('💰 Initializing Budget Page...');
        
        // Wait for data service to be ready
        if (!window.onboardingDataService) {
            console.error('❌ onboardingDataService not loaded');
            showNoDataMessage();
            return;
        }
        
        const data = await onboardingDataService.getData();
        console.log('📊 Received data:', data);
        
        if (!data || !data.monthly_takehome) {
            console.error('❌ No onboarding data found');
            showNoDataMessage();
            return;
        }
        
        const expenses = await onboardingDataService.getExpenses();
        const income = await onboardingDataService.getMonthlyIncome();
        const subscriptions = await onboardingDataService.getSubscriptions();
        
        console.log('💰 Income:', income, 'Expenses:', expenses, 'Subs:', subscriptions);
        
        createBudgetVisualizations(expenses, income, subscriptions);
    } catch (error) {
        console.error('❌ Error initializing budget:', error);
        showNoDataMessage();
    }
}

function showNoDataMessage() {
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: #e8eef9;">
                <h2>⚠️ No Data Found</h2>
                <p>Please complete your onboarding to see budget visualizations.</p>
                <a href="onboarding.html" style="color: #00d4ff; text-decoration: underline;">Complete Onboarding</a>
            </div>
        `;
    }
}

function createBudgetVisualizations(expenses, income, subscriptions) {
    const main = document.querySelector('main');
    if (!main) return;
    
    const totalExpenses = Object.values(expenses).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const subTotal = subscriptions.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);
    const remaining = income - totalExpenses - subTotal;
    
    const budgetHTML = `
        <div class="budget-hero">
            <h1>💰 Budget Overview</h1>
            <div class="budget-cards-grid">
                <div class="budget-metric-card pulse-animation">
                    <div class="metric-icon">💵</div>
                    <div class="metric-value">$${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">Monthly Income</div>
                </div>
                <div class="budget-metric-card">
                    <div class="metric-icon">🛒</div>
                    <div class="metric-value">$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">Essential Expenses</div>
                </div>
                <div class="budget-metric-card">
                    <div class="metric-icon">🔄</div>
                    <div class="metric-value">$${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">Subscriptions</div>
                </div>
                <div class="budget-metric-card ${remaining >= 0 ? 'positive' : 'negative'}">
                    <div class="metric-icon">${remaining >= 0 ? '✨' : '⚠️'}</div>
                    <div class="metric-value">$${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div class="metric-label">${remaining >= 0 ? 'Available' : 'Over Budget'}</div>
                </div>
            </div>
        </div>
        
        <div class="expense-breakdown-section">
            <h2>📊 Expense Categories</h2>
            ${createExpenseCategories(expenses, totalExpenses)}
        </div>
        
        ${subscriptions.length > 0 ? `
        <div class="subscriptions-section">
            <h2>🔄 Active Subscriptions</h2>
            <div class="subscriptions-grid">
                ${subscriptions.map((sub, i) => `
                    <div class="subscription-card fade-in" style="animation-delay: ${i * 0.1}s;">
                        <div class="sub-logo">${sub.name.charAt(0).toUpperCase()}</div>
                        <div class="sub-details">
                            <h4>${sub.name}</h4>
                            <div class="sub-cost">$${parseFloat(sub.cost).toFixed(2)}/mo</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;
    
    main.insertAdjacentHTML('afterbegin', budgetHTML);
}

function createExpenseCategories(expenses, total) {
    const categories = [
        { key: 'housing', name: 'Housing', icon: '🏠', color: '#667eea' },
        { key: 'utilities', name: 'Utilities', icon: '💡', color: '#f59e0b' },
        { key: 'food', name: 'Food & Groceries', icon: '🍽️', color: '#10b981' },
        { key: 'transportation', name: 'Transportation', icon: '🚗', color: '#3b82f6' },
        { key: 'insurance', name: 'Insurance', icon: '🛡️', color: '#8b5cf6' },
        { key: 'other', name: 'Other', icon: '📦', color: '#6b7280' }
    ];
    
    return `
        <div class="categories-grid">
            ${categories.map((cat, i) => {
                const amount = parseFloat(expenses[cat.key]) || 0;
                const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
                return `
                    <div class="category-card slide-up" style="animation-delay: ${i * 0.1}s;">
                        <div class="cat-header">
                            <span class="cat-icon">${cat.icon}</span>
                            <span class="cat-name">${cat.name}</span>
                        </div>
                        <div class="cat-amount">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div class="cat-bar">
                            <div class="cat-fill" style="width: ${percentage}%; background: ${cat.color};"></div>
                        </div>
                        <div class="cat-percent">${percentage}% of expenses</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize page first
    await initializeBudgetPage();
    
    // Then initialize chart if canvas exists
    setTimeout(async () => {
        const ctx = document.getElementById('cashFlowChart');
        if (ctx) {
            try {
                const income = await onboardingDataService.getMonthlyIncome();
                const expenses = await onboardingDataService.getExpenses();
                const totalExp = Object.values(expenses).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const incomeData = Array(12).fill(income);
                const expenseData = Array(12).fill(totalExp);
                
                // Destroy existing chart if any
                if (window.budgetChart) {
                    window.budgetChart.destroy();
                }
                
                // Create small, wide chart
                ctx.height = 200; // Smaller vertical height
                
                window.budgetChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: months,
                        datasets: [{
                            label: 'Income',
                            data: incomeData,
                            borderColor: '#66bb6a',
                            backgroundColor: 'rgba(102, 187, 106, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#66bb6a'
                        }, {
                            label: 'Expenses',
                            data: expenseData,
                            borderColor: '#ef5350',
                            backgroundColor: 'rgba(239, 83, 80, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#ef5350'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    padding: 10,
                                    color: '#e8eef9',
                                    font: { size: 12 }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(20, 26, 46, 0.95)',
                                titleColor: '#e8eef9',
                                bodyColor: '#b8c5d9',
                                borderColor: '#00d4ff',
                                borderWidth: 1,
                                padding: 12,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    color: '#b8c5d9',
                                    callback: function(value) {
                                        return '$' + (value / 1000).toFixed(1) + 'k';
                                    }
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
                    }
                });
            } catch (error) {
                console.error('❌ Error creating chart:', error);
            }
        }
    }, 500);
});
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#27ae60',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }, {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: '#e74c3c',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 3000,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(1) + 'k';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
});

// Add Category button handler
const addCategoryBtn = document.querySelector('.add-category-btn');
if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', function() {
        alert('Add Category feature coming soon! This will allow you to create custom budget categories.');
    });
}

// Update progress bars dynamically (could be used for real-time updates)
function updateBudgetProgress(categoryName, spent, budget) {
    const categories = document.querySelectorAll('.budget-category');
    
    categories.forEach(category => {
        const nameElement = category.querySelector('.category-name');
        if (nameElement && nameElement.textContent === categoryName) {
            const percentage = (spent / budget) * 100;
            const progressFill = category.querySelector('.progress-fill');
            const amountElement = category.querySelector('.category-amount');
            const varianceElement = category.querySelector('.category-variance');
            
            if (progressFill) {
                progressFill.style.width = Math.min(percentage, 100) + '%';
                
                // Update color based on percentage
                if (percentage > 100) {
                    progressFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
                } else if (percentage > 90) {
                    progressFill.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
                } else {
                    progressFill.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
                }
            }
            
            if (amountElement) {
                amountElement.innerHTML = `<span class="spent">$${spent}</span> / <span class="budget">$${budget}</span>`;
            }
            
            const variance = budget - spent;
            if (varianceElement) {
                if (variance >= 0) {
                    varianceElement.textContent = `$${variance} under budget`;
                    varianceElement.className = 'category-variance under';
                } else {
                    varianceElement.textContent = `$${Math.abs(variance)} over budget`;
                    varianceElement.className = 'category-variance over';
                }
            }
        }
    });
}
