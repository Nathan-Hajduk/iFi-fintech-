// iFi Signup Form Validation and Account Creation via API
// Prefer same-origin "/api" when served by the Node server; fallback to localhost when opened from file://
const API_URL = (function() {
    try {
        const origin = window.location.origin || '';
        // When served via server.core.js, origin will be http://localhost:3000 (or 127.0.0.1:3000)
        if (origin && origin.includes(':3000')) return '/api';
        // If opened from file:// or other hosts during development, use explicit localhost
        return 'http://localhost:3000/api';
    } catch (_) {
        return 'http://localhost:3000/api';
    }
})();

// Validation state tracking
const validationState = {
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    passwordMatch: false,
    phone: false
};

// Initialize validation when DOM(document object model) is ready
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.signup-form');
    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const reenterPassword = document.getElementById('reenter-password');
    const phone = document.getElementById('phone-number');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Check server health on page load
    checkServerHealth();

    // Initialize localStorage for user database if not exists
    if (!localStorage.getItem('ifi_users')) {
        localStorage.setItem('ifi_users', JSON.stringify([]));
    }

    // Validate First Name - letters only
    firstName.addEventListener('input', function() {
        validateName(this, 'firstName');
        updateSubmitButton();
    });

    firstName.addEventListener('blur', function() {
        validateName(this, 'firstName');
    });

    // Validate Last Name - letters only
    lastName.addEventListener('input', function() {
        validateName(this, 'lastName');
        updateSubmitButton();
    });

    lastName.addEventListener('blur', function() {
        validateName(this, 'lastName');
    });

    // Validate Email
    email.addEventListener('input', function() {
        validateEmail(this);
        updateSubmitButton();
    });

    email.addEventListener('blur', function() {
        if (validateEmail(this)) {
            // Best-effort duplicate check; non-blocking if endpoint unavailable
            checkEmailExists(this.value);
        }
    });

    // Validate Password
    password.addEventListener('input', function() {
        validatePassword(this);
        if (reenterPassword.value) {
            validatePasswordMatch(password, reenterPassword);
        }
        updateSubmitButton();
    });

    // Validate Password Match
    reenterPassword.addEventListener('input', function() {
        validatePasswordMatch(password, reenterPassword);
        updateSubmitButton();
    });

    // Validate Phone
    phone.addEventListener('input', function() {
        validatePhone(this);
        updateSubmitButton();
    });

    phone.addEventListener('blur', function() {
        if (validatePhone(this)) {
            // Best-effort duplicate check; non-blocking if endpoint unavailable
            checkPhoneExists(this.value);
        }
    });

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Run all validations
        const isFirstNameValid = validateName(firstName, 'firstName');
        const isLastNameValid = validateName(lastName, 'lastName');
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        const isPasswordMatchValid = validatePasswordMatch(password, reenterPassword);
        const isPhoneValid = validatePhone(phone);

        // Check if all validations pass
        if (!isFirstNameValid || !isLastNameValid || !isEmailValid || 
            !isPasswordValid || !isPasswordMatchValid || !isPhoneValid) {
            showFormError('Please correct all errors before submitting.');
            return;
        }

        // Disable submit button during processing + show spinner
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Creating Account';

        try {
            // Create user account
            const userData = {
                firstName: firstName.value.trim(),
                lastName: lastName.value.trim(),
                email: email.value.trim(),
                password: password.value,
                phone: phone.value.trim(),
                dateOfBirth: {
                    month: document.getElementById('birth-month').value,
                    day: document.getElementById('birth-day').value,
                    year: document.getElementById('birth-year').value
                }
            };

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            let result = { message: 'Unknown error' };
            try {
                result = await response.json();
            } catch (_) {
                // Non-JSON response; keep default message
            }
            
            if (response.ok) {
                // Store tokens
                if (result.tokens) {
                    localStorage.setItem('ifi_access_token', result.tokens.accessToken);
                    localStorage.setItem('ifi_refresh_token', result.tokens.refreshToken);
                }
                
                // Store user session
                localStorage.setItem('ifi_current_user', JSON.stringify({
                    id: result.user.user_id,
                    firstName: result.user.first_name,
                    lastName: result.user.last_name,
                    email: result.user.email,
                    subscriptionType: result.user.subscription_type
                }));
                
                // New users: clear onboarding completion flag
                localStorage.removeItem('ifi_onboarding_complete');
                
                // Success toast, then redirect to confirmation page
                showToast('success', 'Account created! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'account-created.html';
                }, 800);
            } else {
                // Server returned an error
                showFormError(result.message || 'Failed to create account. Please try again.');
                // Smooth scroll to top to show error
                window.scrollTo({ top: 0, behavior: 'smooth' });
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.innerHTML = 'Create Account <i class="fas fa-arrow-right"></i>';
            }
        } catch (error) {
            console.error('Signup error:', error);

            // Graceful fallback: if request reached the server but response was blocked (CORS/read error),
            // verify via duplicate endpoints and treat as success if account now exists.
            const doFallbackCheck = async () => {
                try {
                    // Quick health check
                    const health = await fetch(`${API_URL}/health`).then(r => r.ok ? r.json() : null).catch(() => null);
                    if (!health) return false;
                    // Check if email/phone now exist
                    const [emailRes, phoneRes] = await Promise.all([
                        fetch(`${API_URL}/check-email?email=${encodeURIComponent(email.value.trim())}`).then(r => r.ok ? r.json() : { exists: false }).catch(() => ({ exists: false })),
                        fetch(`${API_URL}/check-phone?phone=${encodeURIComponent(phone.value.trim())}`).then(r => r.ok ? r.json() : { exists: false }).catch(() => ({ exists: false }))
                    ]);
                    if ((emailRes && emailRes.exists) || (phoneRes && phoneRes.exists)) {
                        // Assume success, persist session, redirect
                        localStorage.setItem('ifi_current_user', JSON.stringify({
                            id: undefined,
                            firstName: firstName.value.trim(),
                            lastName: lastName.value.trim(),
                            email: email.value.trim()
                        }));
                        localStorage.removeItem('ifi_onboarding_complete');
                        showToast('success', 'Account created! Redirecting...');
                        setTimeout(() => {
                            window.location.href = 'account-created.html';
                        }, 800);
                        return true;
                    }
                    return false;
                } catch (_) {
                    return false;
                }
            };

            const isFileProtocol = window.location.protocol === 'file:';
            const handled = await doFallbackCheck();
            if (!handled) {
                if (isFileProtocol) {
                    showFormError('Please open this page through the server at: http://localhost:3000/html/signup.html');
                    const errorDiv = document.querySelector('.form-error');
                    if (errorDiv) {
                        errorDiv.innerHTML += '<br><a href="http://localhost:3000/html/signup.html" style="color: #2980b9; font-weight: 600; text-decoration: underline;">Click here to open from server</a>';
                    }
                } else {
                    showFormError('Unable to connect to server. Please check your connection and try again.');
                }
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.innerHTML = 'Create Account <i class="fas fa-arrow-right"></i>';
            }
        }
    });

    // Update submit button state whenever validation changes
    setInterval(updateSubmitButton, 200);
});

// Validate name fields (letters, spaces, hyphens, apostrophes only)
function validateName(input, fieldName) {
    const value = input.value.trim();
    const nameRegex = /^[A-Za-z\s'\-]+$/;
    const errorElement = input.nextElementSibling;

    if (!value) {
        showError(input, 'This field is required.');
        validationState[fieldName] = false;
        return false;
    }

    if (!nameRegex.test(value)) {
        showError(input, 'Please enter letters only.');
        validationState[fieldName] = false;
        return false;
    }

    if (value.length < 2) {
        showError(input, 'Name must be at least 2 characters long.');
        validationState[fieldName] = false;
        return false;
    }

    clearError(input);
    validationState[fieldName] = true;
    return true;
}

// Validate email format
function validateEmail(input) {
    const value = input.value.trim();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!value) {
        showError(input, 'Email address is required.');
        validationState.email = false;
        return false;
    }

    if (!emailRegex.test(value)) {
        showError(input, 'Please enter a valid email address (e.g., example@domain.com).');
        validationState.email = false;
        return false;
    }

    clearError(input);
    validationState.email = true;
    return true;
}

// Check if email already exists in database
async function checkEmailExists(email) {
    try {
        const response = await fetch(`${API_URL}/check-email?email=${encodeURIComponent(email)}`);
        if (!response.ok) return false; // Endpoint not available on core server; ignore
        const result = await response.json();

        if (result && result.exists) {
            const emailInput = document.getElementById('email');
            showError(emailInput, 'This email address is already registered. Please use a different email or login.');
            validationState.email = false;
            // Smooth scroll to top to show error
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

// Validate password
function validatePassword(input) {
    const value = input.value;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSymbol = /[!@#$%^&*]/.test(value);
    const isLongEnough = value.length >= 9;

    if (!value) {
        showError(input, 'Password is required.');
        validationState.password = false;
        return false;
    }

    if (!isLongEnough || !hasUpperCase || !hasNumber || !hasSymbol) {
        showError(input, 'Password must meet all requirements listed below.');
        validationState.password = false;
        return false;
    }

    clearError(input);
    validationState.password = true;
    return true;
}

// Validate password match
function validatePasswordMatch(passwordInput, reenterInput) {
    const password = passwordInput.value;
    const reenterPassword = reenterInput.value;

    if (!reenterPassword) {
        showError(reenterInput, 'Please re-enter your password.');
        validationState.passwordMatch = false;
        return false;
    }

    if (password !== reenterPassword) {
        showError(reenterInput, 'Passwords do not match. Please ensure both passwords are identical.');
        validationState.passwordMatch = false;
        return false;
    }

    clearError(reenterInput);
    validationState.passwordMatch = true;
    return true;
}

// Validate phone number
function validatePhone(input) {
    const value = input.value.trim();
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;

    if (!value) {
        showError(input, 'Phone number is required.');
        validationState.phone = false;
        return false;
    }

    if (!phoneRegex.test(value)) {
        showError(input, 'Please enter a valid phone number in the format: 123-456-7890');
        validationState.phone = false;
        return false;
    }

    clearError(input);
    validationState.phone = true;
    return true;
}

// Check if phone already exists in database
async function checkPhoneExists(phone) {
    try {
        const response = await fetch(`${API_URL}/check-phone?phone=${encodeURIComponent(phone)}`);
        if (!response.ok) return false; // Endpoint not available on core server; ignore
        const result = await response.json();

        if (result && result.exists) {
            const phoneInput = document.getElementById('phone-number');
            showError(phoneInput, 'This phone number is already registered. Please use a different number or login.');
            validationState.phone = false;
            // Smooth scroll to top to show error
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking phone:', error);
        return false;
    }
}

// Show error message for a field
function showError(input, message) {
    input.classList.add('error');
    let errorElement = input.parentElement.querySelector('.error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        input.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Clear error message for a field
function clearError(input) {
    input.classList.remove('error');
    const errorElement = input.parentElement.querySelector('.error-message');
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Show form-level error message
function showFormError(message) {
    let formError = document.querySelector('.form-error');
    
    if (!formError) {
        formError = document.createElement('div');
        formError.className = 'form-error';
        const form = document.querySelector('.signup-form');
        form.insertBefore(formError, form.firstChild);
    }
    
    formError.textContent = message;
    formError.style.display = 'block';
    
    // Scroll to error
    formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Update submit button based on validation state
function updateSubmitButton() {
    const submitBtn = document.querySelector('.signup-form button[type="submit"]');
    if (!submitBtn) return;
    // Don't alter visuals while actively submitting
    if (submitBtn.disabled || submitBtn.classList.contains('loading')) return;
    const allValid = Object.values(validationState).every(valid => valid === true);
    
    if (!allValid) {
        submitBtn.classList.add('disabled');
        submitBtn.style.opacity = '0.6';
        submitBtn.style.cursor = 'not-allowed';
    } else {
        submitBtn.classList.remove('disabled');
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
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

// --- Toast notifications ---
function ensureToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function showToast(type, message) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✔️' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);
    // Force reflow for animation
    void toast.offsetWidth;
    toast.classList.add('show');

    const remove = () => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    const timeout = setTimeout(remove, 3000);
    toast.addEventListener('click', () => {
        clearTimeout(timeout);
        remove();
    });
}
