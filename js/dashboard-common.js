// User menu dropdown toggle
function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    const userMenuBtn = document.querySelector('.user-menu-btn');
    const isExpanded = userMenuBtn.getAttribute('aria-expanded') === 'true';
    
    userDropdown.classList.toggle('show');
    userMenuBtn.setAttribute('aria-expanded', !isExpanded);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');
    const userMenuBtn = document.querySelector('.user-menu-btn');
    
    if (userMenu && !userMenu.contains(event.target)) {
        if (userDropdown && userDropdown.classList.contains('show')) {
            userDropdown.classList.remove('show');
            if (userMenuBtn) {
                userMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    }
});

// Keyboard navigation for user menu
document.addEventListener('keydown', function(event) {
    const userDropdown = document.getElementById('userDropdown');
    
    if (!userDropdown || !userDropdown.classList.contains('show')) return;
    
    const dropdownItems = userDropdown.querySelectorAll('.dropdown-item');
    const currentFocus = document.activeElement;
    const currentIndex = Array.from(dropdownItems).indexOf(currentFocus);
    
    if (event.key === 'Escape') {
        const userMenuBtn = document.querySelector('.user-menu-btn');
        userDropdown.classList.remove('show');
        userMenuBtn.setAttribute('aria-expanded', 'false');
        userMenuBtn.focus();
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = currentIndex < dropdownItems.length - 1 ? currentIndex + 1 : 0;
        dropdownItems[nextIndex].focus();
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : dropdownItems.length - 1;
        dropdownItems[prevIndex].focus();
    }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const dashboardNav = document.querySelector('.dashboard-nav');
    
    if (mobileMenuToggle && dashboardNav) {
        mobileMenuToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            dashboardNav.classList.toggle('show');
            this.setAttribute('aria-expanded', !isExpanded);
            
            // Change icon
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (mobileMenuToggle && dashboardNav && 
            !mobileMenuToggle.contains(event.target) && 
            !dashboardNav.contains(event.target)) {
            dashboardNav.classList.remove('show');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
    
    // Close mobile menu when nav link is clicked
    const navLinks = document.querySelectorAll('.dashboard-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768 && dashboardNav) {
                dashboardNav.classList.remove('show');
                if (mobileMenuToggle) {
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }
        });
    });
});

// Prevent dropdown from closing when clicking inside it
document.addEventListener('DOMContentLoaded', function() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.addEventListener('click', function(event) {
            // Allow links to work normally
            if (!event.target.closest('.dropdown-item')) {
                event.stopPropagation();
            }
        });
    }
});

// Add loading state indicator
function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.setAttribute('aria-busy', 'true');
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.setAttribute('aria-busy', 'false');
    }
}

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}" aria-hidden="true"></i>
        <span>${message}</span>
        <button class="toast-close" aria-label="Close notification">&times;</button>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));
    
    // Auto remove
    setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}

// Smooth scroll to element
function scrollToElement(element, offset = 80) {
    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}
