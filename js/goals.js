// Goals Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Add Goal button handler
    const addGoalBtn = document.querySelector('.add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', function() {
            alert('Create New Goal feature coming soon! You will be able to set custom financial goals with target amounts and dates.');
        });
    }
    
    // Adjust goal buttons
    const adjustButtons = document.querySelectorAll('.btn-secondary');
    adjustButtons.forEach(btn => {
        if (btn.textContent.includes('Adjust')) {
            btn.addEventListener('click', function() {
                const goalCard = this.closest('.goal-card');
                const goalName = goalCard.querySelector('.goal-info h3').textContent;
                alert(`Adjust ${goalName}: Coming soon! You will be able to modify the target amount, date, and monthly contribution.`);
            });
        }
    });
    
    // Add Funds buttons
    const addFundsButtons = document.querySelectorAll('.btn-primary');
    addFundsButtons.forEach(btn => {
        if (btn.textContent.includes('Add Funds')) {
            btn.addEventListener('click', function() {
                const goalCard = this.closest('.goal-card');
                const goalName = goalCard.querySelector('.goal-info h3').textContent;
                const amount = prompt(`How much would you like to add to your ${goalName} goal?`, '100');
                
                if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
                    alert(`$${parseFloat(amount).toFixed(2)} will be added to your ${goalName} goal. Bank connection integration coming soon!`);
                }
            });
        }
    });
    
    // Update goal progress dynamically
    updateGoalMetrics();
});

// Calculate and update goal summary metrics
function updateGoalMetrics() {
    const goalCards = document.querySelectorAll('.goal-card');
    let onTrackCount = 0;
    let totalSaved = 0;
    
    goalCards.forEach(card => {
        // Check if goal is on track
        if (card.classList.contains('on-track')) {
            onTrackCount++;
        }
        
        // Calculate current savings from progress
        const progressInfo = card.querySelector('.progress-info span:first-child');
        if (progressInfo) {
            const match = progressInfo.textContent.match(/\$([0-9,]+)/);
            if (match) {
                totalSaved += parseInt(match[1].replace(/,/g, ''));
            }
        }
    });
    
    // Update summary cards
    const activeGoalsCard = document.querySelector('.summary-card.success .big-number');
    const totalSavedCard = document.querySelectorAll('.summary-card .big-number')[1];
    const onTrackCard = document.querySelector('.summary-card.primary .big-number');
    const onTrackTrend = document.querySelector('.summary-card.primary .trend');
    
    if (activeGoalsCard) activeGoalsCard.textContent = goalCards.length;
    if (totalSavedCard) totalSavedCard.textContent = '$' + totalSaved.toLocaleString();
    if (onTrackCard) {
        const percentage = Math.round((onTrackCount / goalCards.length) * 100);
        onTrackCard.textContent = percentage + '%';
    }
    if (onTrackTrend) {
        onTrackTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${onTrackCount} of ${goalCards.length} goals`;
    }
}

// Calculate funding gap for behind-schedule goals
function calculateFundingGap(current, target, monthsRemaining) {
    const remaining = target - current;
    const neededMonthly = remaining / monthsRemaining;
    return neededMonthly;
}

// Update progress bar color based on status
function updateProgressBarColor(progressBar, percentage, status) {
    if (status === 'behind') {
        progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    } else if (percentage > 80) {
        progressBar.style.background = 'linear-gradient(90deg, #27ae60, #2ecc71)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
    }
}
