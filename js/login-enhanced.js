/**
 * iFi Enhanced Login Page - Interactive Features
 * Handles authentication, animations, and user interactions
 */

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const currentUser = localStorage.getItem('ifi_current_user');
    if (currentUser) {
        window.location.href = '../html/dashboard.html';
        return;
    }

    // Initialize features
    initPasswordToggle();
    initFormSubmission();
    initScrollAnimations();
    initParallaxEffects();
    checkServerHealth();
});

/**
 * Password Toggle - Single Eye Icon (Fixed)
 */
function initPasswordToggle() {
    const toggleButton = document.getElementById('togglePassword');
    const passwordField = document.getElementById('password');

    if (!toggleButton || !passwordField) return;

    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const type = passwordField.getAttribute('type');
        const icon = toggleButton.querySelector('i');
        
        if (type === 'password') {
            passwordField.setAttribute('type', 'text');
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordField.setAttribute('type', 'password');
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

/**
 * Form Submission Handler
 */
function initFormSubmission() {
    const form = document.getElementById('loginForm');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const messageEl = document.getElementById('loginMessage');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = usernameField.value.trim();
        const password = passwordField.value;

        // Validation
        if (!username) {
            showMessage('Please enter your username or email', 'error');
            return;
        }

        if (!password) {
            showMessage('Please enter your password', 'error');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Signing In...';

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store auth data
                if (result.tokens) {
                    localStorage.setItem('ifi_access_token', result.tokens.accessToken);
                    localStorage.setItem('ifi_refresh_token', result.tokens.refreshToken);
                }
                localStorage.setItem('ifi_user', JSON.stringify(result.user));
                localStorage.setItem('ifi_current_user', JSON.stringify(result.user));

                // Initialize authManager
                if (window.authManager) {
                    authManager.accessToken = result.tokens.accessToken;
                    authManager.refreshToken = result.tokens.refreshToken;
                    authManager.user = result.user;
                    authManager.scheduleTokenRefresh();
                }

                showMessage('Login successful! Redirecting...', 'success');

                // Redirect based on onboarding status
                setTimeout(() => {
                    if (result.onboardingCompleted === false) {
                        window.location.href = '../html/onboarding.html';
                    } else {
                        window.location.href = '../html/dashboard.html';
                    }
                }, 800);

            } else {
                showMessage(result.message || 'Invalid username or password', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
            }

        } catch (error) {
            console.error('Login error:', error);
            showMessage('Unable to connect to server. Please try again.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In <i class="fas fa-arrow-right"></i>';
        }
    });
}

/**
 * Show Message to User
 */
function showMessage(message, type) {
    const messageEl = document.getElementById('loginMessage');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `login-message ${type}`;
    messageEl.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

/**
 * Scroll Animations
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    document.querySelectorAll('.feature-card, .step-card, .testimonial-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(card);
    });
}

/**
 * Parallax Effects
 */
function initParallaxEffects() {
    let ticking = false;

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const scrolled = window.pageYOffset;
                
                // Move background orbs
                const orbs = document.querySelectorAll('.gradient-orb');
                orbs.forEach((orb, index) => {
                    const speed = 0.5 + (index * 0.2);
                    orb.style.transform = `translateY(${scrolled * speed}px)`;
                });

                ticking = false;
            });

            ticking = true;
        }
    });
}

/**
 * Check Server Health
 */
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            console.log('✅ Server is healthy');
        } else {
            console.warn('⚠️ Server returned non-OK status');
        }
    } catch (error) {
        console.error('❌ Cannot reach server:', error.message);
        showMessage('Warning: Cannot connect to server. Some features may be unavailable.', 'error');
    }
}

/**
 * Smooth Scroll for Anchor Links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

/**
 * Add Gradient SVG for Goal Progress Ring
 */
const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svgDefs.style.position = 'absolute';
svgDefs.style.width = '0';
svgDefs.style.height = '0';
svgDefs.innerHTML = `
    <defs>
        <linearGradient id="goal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#00d4ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#667eea;stop-opacity:1" />
        </linearGradient>
    </defs>
`;
document.body.appendChild(svgDefs);

console.log('%c🚀 iFi Enhanced Login Loaded', 'color: #00d4ff; font-size: 16px; font-weight: bold;');
console.log('%cReady to transform your financial future!', 'color: #667eea; font-size: 14px;');
