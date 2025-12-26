/**
 * Auth Guard - Protect dashboard pages from unauthorized access
 * Include this script at the top of all protected pages
 */

// Wait for authManager to be fully loaded
if (typeof authManager === 'undefined') {
  console.error('authManager not loaded. Check script loading order.');
}

// Check if we're on specific pages
const isLoginPage = window.location.pathname.includes('Login.html');
const isOnboardingPage = window.location.pathname.includes('onboarding.html');

// Special handling for onboarding - skip auth guard, let onboarding.js handle it
if (isOnboardingPage) {
  // Onboarding page will do its own auth check after authManager loads
  console.log('Onboarding page - skipping auth guard');
} else if (!isLoginPage) {
  // For other protected pages, do full auth check
  if (!window.authManager || !authManager.isAuthenticated()) {
    const currentPath = window.location.pathname;
    const redirectCount = parseInt(sessionStorage.getItem('redirect_count') || '0');
    
    if (redirectCount < 2) {
      sessionStorage.setItem('redirect_count', String(redirectCount + 1));
      window.location.href = `/html/Login.html?redirect=${encodeURIComponent(currentPath)}`;
    } else {
      console.error('Redirect loop detected. Clearing storage and redirecting to login.');
      sessionStorage.removeItem('redirect_count');
      localStorage.clear();
      window.location.href = '/html/Login.html';
    }
  } else {
    // Clear redirect count on successful authentication check
    sessionStorage.removeItem('redirect_count');
    sessionStorage.removeItem('login_redirect_check');
  }
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
