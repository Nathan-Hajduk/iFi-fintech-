// Net Worth Dashboard JavaScript

// Initialize Net Worth Trend Chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('netWorthChart');
    
    if (ctx) {
        // Sample data: 12-month net worth history
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const netWorthData = [-92850, -89300, -86200, -82400, -78900, -75100, -71500, -67800, -64200, -60500, -56800, -53050];
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Net Worth',
                    data: netWorthData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: '#3498db',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        callbacks: {
                            label: function(context) {
                                return 'Net Worth: $' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000).toFixed(0) + 'k';
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
    
    // Calculate and update total net worth
    updateNetWorthSummary();
});

// Calculate net worth from assets and liabilities
function updateNetWorthSummary() {
    const assets = [12450, 78200, 125000]; // From HTML data
    const liabilities = [285000, 18500, 3200]; // From HTML data
    
    const totalAssets = assets.reduce((sum, val) => sum + val, 0);
    const totalLiabilities = liabilities.reduce((sum, val) => sum + val, 0);
    const netWorth = totalAssets - totalLiabilities;
    
    // Update summary card values
    const netWorthElement = document.querySelector('.summary-card.primary .big-number');
    const assetsElement = document.querySelectorAll('.summary-card .big-number')[1];
    const liabilitiesElement = document.querySelectorAll('.summary-card .big-number')[2];
    
    if (netWorthElement) netWorthElement.textContent = '$' + netWorth.toLocaleString();
    if (assetsElement) assetsElement.textContent = '$' + totalAssets.toLocaleString();
    if (liabilitiesElement) liabilitiesElement.textContent = '-$' + totalLiabilities.toLocaleString();
}

// Add Asset modal handler (placeholder)
document.addEventListener('DOMContentLoaded', function() {
    const addAssetBtns = document.querySelectorAll('.add-account-btn');
    
    addAssetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const isAsset = this.textContent.includes('Asset');
            const accountType = isAsset ? 'asset' : 'liability';
            
            if (typeof showToast === 'function') {
                showToast(
                    `Add ${accountType} feature coming soon! This will connect with your bank via Plaid for real-time data.`,
                    'info',
                    4000
                );
            } else {
                alert(`Add ${accountType} feature coming soon! This will connect with your bank via Plaid for real-time data.`);
            }
        });
    });
});
