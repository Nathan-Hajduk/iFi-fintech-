// iFi Login Form Validation and Authentication
const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.login-form');
    // If inline handler is present, skip to avoid double submission
    if (form && form.dataset && form.dataset.handler === 'inline') {
        return;
    }
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Check server health on page load
    checkServerHealth();

    // Check if user is already logged in
    const currentUser = localStorage.getItem('ifi_current_user');
    if (currentUser) {
        // Already logged in - redirect to dashboard
        window.location.href = '../html/dashboard.html';
        return;
    }

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const usernameValue = username.value.trim();
        const passwordValue = password.value;

        // Basic validation
        if (!usernameValue) {
            showError('Please enter your username or email.');
            return;
        }

        if (!passwordValue) {
            showError('Please enter your password.');
            return;
        }

        // Disable submit button during processing + show spinner
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Signing In';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameValue,
                    password: passwordValue
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store user session
                localStorage.setItem('ifi_current_user', JSON.stringify(result.user));
                // Success - redirect to dashboard
                window.location.href = '../html/dashboard.html';
            } else {
                // Login failed
                showError(result.message || 'Invalid username or password.');
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Unable to connect to server. Please make sure the correct account information was provided.');
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
        }
    });
});

function showError(message) {
    let errorElement = document.querySelector('.login-error');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'login-error';
        const form = document.querySelector('.login-form');
        form.insertBefore(errorElement, form.firstChild);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Check server health and show status banner
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
            // Server is healthy - remove any existing warning
            const existingBanner = document.querySelector('.server-status-banner');
            if (existingBanner) {
                existingBanner.remove();
            }
        } else {
            showServerStatusBanner('warning');
        }
    } catch (error) {
        console.error('Server health check failed:', error);
        showServerStatusBanner('error');
    }
}

// Show server status banner
function showServerStatusBanner(type) {
    // Remove existing banner if present
    const existingBanner = document.querySelector('.server-status-banner');
    if (existingBanner) {
        existingBanner.remove();
    }
    
    const banner = document.createElement('div');
    banner.className = 'server-status-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        padding: 1rem;
        text-align: center;
        z-index: 9999;
        font-weight: 500;
        ${type === 'error' 
            ? 'background: #dc3545; color: white;' 
            : 'background: #ffc107; color: #000;'}
    `;
    
    const message = type === 'error' 
        ? '⚠️ Server is currently offline. Please try again later or contact support.'
        : '⚠️ Server connection is unstable. You may experience issues.';
    
    banner.innerHTML = `
        ${message}
        <button onclick="this.parentElement.remove()" style="margin-left: 1rem; padding: 0.25rem 0.75rem; cursor: pointer; border: none; background: rgba(0,0,0,0.2); color: inherit; border-radius: 4px;">Dismiss</button>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
}
