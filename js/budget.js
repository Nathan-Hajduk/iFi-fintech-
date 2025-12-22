// Budget Dashboard JavaScript

// Initialize Cash Flow Forecast Chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('cashFlowChart');
    
    if (ctx) {
        // Sample data: 12-month cash flow forecast
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const incomeData = [5200, 5200, 5400, 5200, 5200, 5200, 5400, 5200, 5200, 5400, 5200, 5200];
        const expenseData = [3890, 3950, 3820, 3900, 3850, 3920, 3880, 3910, 3870, 3890, 3900, 3850];
        
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
