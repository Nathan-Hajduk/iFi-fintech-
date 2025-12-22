// ================================================
// FINTECH-GRADE SCROLL & INTERACTION ANIMATIONS
// ================================================

// Scroll-Triggered Reveal Observer
const createScrollObserver = () => {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                // Unobserve after revealing for performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with reveal-element class
    document.querySelectorAll('.reveal-element').forEach(el => {
        observer.observe(el);
    });

    // Observe contact methods with staggered animation
    document.querySelectorAll('.contact-method').forEach((el, index) => {
        el.style.animationDelay = `${index * 150}ms`;
        observer.observe(el);
    });

    // Observe purpose cards
    document.querySelectorAll('.purpose-card').forEach((el, index) => {
        el.style.animationDelay = `${index * 100}ms`;
        observer.observe(el);
    });

    // Observe dashboard cards
    document.querySelectorAll('.dashboard-card').forEach((el, index) => {
        el.style.animationDelay = `${index * 150}ms`;
        observer.observe(el);
    });

    // Observe feature cards
    document.querySelectorAll('.feature-card').forEach((el, index) => {
        el.style.animationDelay = `${index * 120}ms`;
        observer.observe(el);
    });

    return observer;
};

// Form Input Focus Animations
const enhanceFormInputs = () => {
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea, .form-group select');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('input-focused');
            
            // Add validation visual feedback if input has value
            if (this.value.trim()) {
                if (this.checkValidity()) {
                    this.classList.add('valid');
                    this.classList.remove('invalid');
                } else {
                    this.classList.add('invalid');
                    this.classList.remove('valid');
                }
            } else {
                this.classList.remove('valid', 'invalid');
            }
        });

        // Remove validation classes on input
        input.addEventListener('input', function() {
            if (this.classList.contains('invalid')) {
                this.classList.remove('invalid');
            }
        });
    });
};

// Enhanced Button Submit Animation
const enhanceSubmitButtons = () => {
    const submitButtons = document.querySelectorAll('.btn-send, .signup-btn, .btn-primary[type="submit"]');
    
    submitButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const form = this.closest('form');
            
            // Only proceed if form is valid or no form present
            if (form && !form.checkValidity()) {
                return; // Let default validation handle it
            }
            
            e.preventDefault();
            
            // Add loading state
            this.classList.add('btn-loading');
            const originalContent = this.innerHTML;
            this.innerHTML = '';
            
            // Simulate API call
            setTimeout(() => {
                this.classList.remove('btn-loading');
                
                // Success state
                this.innerHTML = '<i class="fas fa-check"></i> Success!';
                this.style.background = 'linear-gradient(135deg, #00c853, #00a843)';
                
                // Reset after 3 seconds
                setTimeout(() => {
                    this.innerHTML = originalContent;
                    this.style.background = '';
                    
                    // Reset form if present
                    if (form) {
                        form.reset();
                        // Remove validation classes
                        form.querySelectorAll('.valid, .invalid').forEach(el => {
                            el.classList.remove('valid', 'invalid');
                        });
                    }
                }, 3000);
            }, 2000);
        });
    });
};

// Navigation Link Active State
const enhanceNavigation = () => {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link, .header-nav a:not(.cta-button)');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
};

// Card Hover Enhancement
const enhanceCards = () => {
    const cards = document.querySelectorAll('.purpose-card, .dashboard-card, .feature-card, .pricing-card, .tier-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle tilt effect
            this.style.transform = 'translateY(-4px) rotateX(2deg)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
};

// Smooth Scroll for Anchor Links
const enableSmoothScroll = () => {
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
};

// Parallax Effect for Hero Sections
const enableParallax = () => {
    const heroSections = document.querySelectorAll('.hero, .hero-section');
    
    if (heroSections.length === 0) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        heroSections.forEach(hero => {
            const speed = 0.5;
            hero.style.transform = `translateY(${scrolled * speed}px)`;
        });
    }, { passive: true });
};

// Initialize all animations on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll observer
    createScrollObserver();
    
    // Enhance form inputs
    enhanceFormInputs();
    
    // Enhance submit buttons
    enhanceSubmitButtons();
    
    // Set active navigation
    enhanceNavigation();
    
    // Enhance cards
    enhanceCards();
    
    // Enable smooth scrolling
    enableSmoothScroll();
    
    // Enable parallax (optional, can be disabled for performance)
    // enableParallax();
    
    console.log('✨ Fintech-grade animations initialized');
});

// Respect reduced motion preferences
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    console.log('🎯 Reduced motion mode active');
}

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createScrollObserver,
        enhanceFormInputs,
        enhanceSubmitButtons,
        enhanceNavigation,
        enhanceCards,
        enableSmoothScroll
    };
}
