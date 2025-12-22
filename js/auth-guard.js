/**
 * Auth Guard - Protect dashboard pages from unauthorized access
 * Include this script at the top of all protected pages
 */

// Redirect to login if not authenticated
if (!window.authManager || !authManager.isAuthenticated()) {
  const currentPath = window.location.pathname;
  window.location.href = `/html/Login.html?redirect=${encodeURIComponent(currentPath)}`;
}

// Initialize user profile display
document.addEventListener('DOMContentLoaded', () => {
  // Update user display elements
  const userNameElements = document.querySelectorAll('.user-name, [data-user-name]');
  const userEmailElements = document.querySelectorAll('.user-email, [data-user-email]');
  const userInitialsElements = document.querySelectorAll('.user-initials, [data-user-initials]');
  const userAvatarElements = document.querySelectorAll('.user-avatar img');
  
  if (authManager.user) {
    const displayName = authManager.getUserDisplayName();
    const initials = authManager.getUserInitials();
    const email = authManager.user.email;
    
    // Update name displays
    userNameElements.forEach(el => {
      el.textContent = displayName;
    });
    
    // Update email displays
    userEmailElements.forEach(el => {
      el.textContent = email;
    });
    
    // Update initials displays
    userInitialsElements.forEach(el => {
      el.textContent = initials;
    });
    
    // Update avatar images with placeholder
    userAvatarElements.forEach(el => {
      el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&size=128`;
      el.alt = displayName;
    });
  }
  
  // Setup logout buttons
  const logoutButtons = document.querySelectorAll('[data-logout], .logout-btn, .btn-logout');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        await authManager.logout();
      }
    });
  });
  
  // Setup subscription gates
  const premiumFeatures = document.querySelectorAll('[data-requires="premium"]');
  premiumFeatures.forEach(feature => {
    if (!authManager.hasSubscription('premium')) {
      feature.classList.add('locked');
      feature.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        authManager.showUpgradePrompt('premium');
      });
    }
  });
  
  const enterpriseFeatures = document.querySelectorAll('[data-requires="enterprise"]');
  enterpriseFeatures.forEach(feature => {
    if (!authManager.hasSubscription('enterprise')) {
      feature.classList.add('locked');
      feature.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        authManager.showUpgradePrompt('enterprise');
      });
    }
  });
});

// Refresh user data periodically
setInterval(async () => {
  if (authManager.isAuthenticated()) {
    try {
      await authManager.getCurrentUser();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes
