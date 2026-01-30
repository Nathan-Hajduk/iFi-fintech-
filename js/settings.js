/**
 * Settings Page - User Account & Preferences Management
 * Comprehensive settings with profile, security, theme, and data management
 */

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadUserProfile();
        initializeSettings();
    } catch (error) {
        console.error('Settings page error:', error);
    }
});

async function loadUserProfile() {
    const userData = await fetchOnboardingDataFromBackend();
    if (!userData) return;
    
    // Populate profile fields
    if (document.getElementById('profileName')) {
        document.getElementById('profileName').value = userData.full_name || '';
    }
    if (document.getElementById('profileEmail')) {
        document.getElementById('profileEmail').value = userData.email || '';
    }
    if (document.getElementById('monthlySavingsGoal')) {
        document.getElementById('monthlySavingsGoal').value = userData.monthly_savings_goal || '';
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('ifiTheme') || 'dark';
    document.querySelectorAll(`input[name="theme"][value="${savedTheme}"]`).forEach(input => {
        input.checked = true;
    });
    
    // Load notification preferences
    const notificationPrefs = JSON.parse(localStorage.getItem('ifiNotifications') || '{}');
    document.getElementById('notifBudgetAlerts')?.checked = notificationPrefs.budgetAlerts !== false;
    document.getElementById('notifGoalMilestones')?.checked = notificationPrefs.goalMilestones !== false;
    document.getElementById('notifDebtReminders')?.checked = notificationPrefs.debtReminders !== false;
    document.getElementById('notifMarketUpdates')?.checked = notificationPrefs.marketUpdates !== false;
}

function initializeSettings() {
    // Profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password change form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Theme preference change
    document.querySelectorAll('input[name="theme"]').forEach(input => {
        input.addEventListener('change', handleThemeChange);
    });
    
    // Notification preferences change
    document.querySelectorAll('.notification-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', handleNotificationPrefsChange);
    });
    
    // Data export button
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleDataExport);
    }
    
    // Account deletion button
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleAccountDeletion);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const profileData = {
        full_name: document.getElementById('profileName')?.value,
        email: document.getElementById('profileEmail')?.value,
        monthly_savings_goal: parseFloat(document.getElementById('monthlySavingsGoal')?.value) || 0
    };
    
    try {
        const response = await authManager.fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            showNotification('Profile updated successfully!', 'success');
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Error updating profile. Please try again.', 'error');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Validate password match
    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match!', 'error');
        return;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return;
    }
    
    try {
        const response = await authManager.fetch('/api/user/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (response.ok) {
            showNotification('Password changed successfully!', 'success');
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            const data = await response.json();
            throw new Error(data.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification(error.message || 'Error changing password. Please try again.', 'error');
    }
}

function handleThemeChange(e) {
    const theme = e.target.value;
    localStorage.setItem('ifiTheme', theme);
    
    // Apply theme immediately
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    }
    
    showNotification(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied!`, 'success');
}

function handleNotificationPrefsChange() {
    const preferences = {
        budgetAlerts: document.getElementById('notifBudgetAlerts')?.checked,
        goalMilestones: document.getElementById('notifGoalMilestones')?.checked,
        debtReminders: document.getElementById('notifDebtReminders')?.checked,
        marketUpdates: document.getElementById('notifMarketUpdates')?.checked
    };
    
    localStorage.setItem('ifiNotifications', JSON.stringify(preferences));
    showNotification('Notification preferences saved!', 'success');
}

async function handleDataExport() {
    try {
        const userData = await fetchOnboardingDataFromBackend();
        if (!userData) {
            showNotification('No data available to export.', 'error');
            return;
        }
        
        // Create formatted JSON
        const exportData = {
            exportDate: new Date().toISOString(),
            userData: userData,
            appVersion: '1.0.0'
        };
        
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `iFi_data_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Data export error:', error);
        showNotification('Error exporting data. Please try again.', 'error');
    }
}

function handleAccountDeletion() {
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Delete Account</h2>
            </div>
            <div class="modal-body">
                <p>Are you absolutely sure you want to delete your account?</p>
                <p class="warning-text">This action cannot be undone. All your data will be permanently deleted.</p>
                <div class="confirmation-input">
                    <label>Type "DELETE" to confirm:</label>
                    <input type="text" id="deleteConfirmInput" placeholder="DELETE">
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="this.closest('.delete-confirmation-modal').remove()">
                    Cancel
                </button>
                <button class="btn btn-danger" onclick="confirmAccountDeletion()">
                    Delete My Account
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function confirmAccountDeletion() {
    const confirmInput = document.getElementById('deleteConfirmInput');
    if (confirmInput.value !== 'DELETE') {
        showNotification('Please type "DELETE" to confirm account deletion.', 'error');
        return;
    }
    
    try {
        const response = await authManager.fetch('/api/user/account', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Account deleted successfully. Redirecting...', 'success');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '../html/Login.html';
            }, 2000);
        } else {
            throw new Error('Failed to delete account');
        }
    } catch (error) {
        console.error('Account deletion error:', error);
        showNotification('Error deleting account. Please contact support.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Security & Privacy Disclaimer
console.log('%c🔒 Settings & Privacy', 'color: #00d4ff; font-size: 14px; font-weight: bold;');
console.log('Your privacy and security are our top priority. All data is encrypted and stored securely. Account deletion requests are processed immediately and cannot be reversed. For questions about data handling, please review our Privacy Policy.');