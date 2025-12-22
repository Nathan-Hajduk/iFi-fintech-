// iFi Authentication System
// Protects pages from unauthorized access

// Check if user is logged in
function checkAuth() {
    const currentUser = localStorage.getItem('ifi_current_user');
    
    if (!currentUser) {
        // No user logged in - redirect to login
        window.location.href = '../html/Login.html';
        return null;
    }
    
    try {
        return JSON.parse(currentUser);
    } catch (error) {
        console.error('Error parsing user data:', error);
        // Invalid session data - redirect to login
        localStorage.removeItem('ifi_current_user');
        window.location.href = '../html/Login.html';
        return null;
    }
}

// Initialize auth check on protected pages
function initAuthProtection() {
    const user = checkAuth();
    
    if (user) {
        // User is authenticated
        console.log('Authenticated user:', user.email);
        
        // Display user info if elements exist
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        
        if (userNameElement) {
            userNameElement.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('ifi_current_user');
    window.location.href = '../html/Login.html';
}

// Run auth check immediately when script loads
initAuthProtection();
