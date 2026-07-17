// Enhanced Main Application Module
class MainApp {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.highlightCurrentPage();
            this.setupContactForm();
            this.setupNewsletterForm();
            this.setupDropdownBehavior();
            this.setupTestimonialSlider();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (this.sliderInterval) {
                clearInterval(this.sliderInterval);
            }
        });
    }

    // Highlight current page in navigation
    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-list li a, .navbar ul li a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('javascript:')) return;
            
            const linkPage = href.split('/').pop() || 'index.html';
            
            // Use endsWith for more robust matching that ignores query params
            if (currentPath.endsWith(linkPage) || currentPath.endsWith('/' + linkPage)) {
                link.classList.add('current-page');

                // Highlight dropdown parent if applicable
                const parent = link.closest('.has-dropdown');
                if (parent) {
                    const parentLink = parent.querySelector('> a');
                    if (parentLink) {
                        parentLink.classList.add('current-page');
                    }
                }
            }
        });
    }

    // Setup contact form with validation
    setupContactForm() {
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Simple validation
                const name = contactForm.querySelector('#name').value.trim();
                const email = contactForm.querySelector('#email').value.trim();
                const message = contactForm.querySelector('#message').value.trim();

                if (!name || !email || !message) {
                    this.showFormError('Please fill in all required fields.');
                    return;
                }

                // Email validation regex
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.showFormError('Please enter a valid email address.');
                    return;
                }

                // Simulate form submission
                this.showFormSubmissionFeedback();
                contactForm.reset();
            });
        }
    }

    // Setup newsletter form with validation
    setupNewsletterForm() {
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const emailInput = newsletterForm.querySelector('input[type="email"]');
                const email = emailInput.value.trim();

                if (!email) {
                    this.showNewsletterFeedback('Please enter an email address.', 'error');
                    return;
                }

                // Email validation regex
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.showNewsletterFeedback('Please enter a valid email address.', 'error');
                    return;
                }

                // Simulate successful subscription
                this.showNewsletterFeedback('Thank you for subscribing! Check your email for confirmation.', 'success');
                newsletterForm.reset();
            });
        }
    }

    showFormError(message) {
        const feedback = document.createElement('div');
        feedback.className = 'form-feedback error';
        feedback.innerHTML = `
            <div class="feedback-content">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;

        const contactSection = document.querySelector('.contact-section');
        if (contactSection) {
            // Remove any existing feedback
            const existingFeedback = contactSection.querySelector('.form-feedback');
            if (existingFeedback) existingFeedback.remove();
            
            contactSection.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3500);
        }
    }

    showFormSubmissionFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'form-feedback success';
        feedback.innerHTML = `
            <div class="feedback-content">
                <i class="fas fa-check-circle"></i>
                <p>Thank you for your message! We will get back to you soon.</p>
            </div>
        `;

        const contactSection = document.querySelector('.contact-section');
        if (contactSection) {
            // Remove any existing feedback
            const existingFeedback = contactSection.querySelector('.form-feedback');
            if (existingFeedback) existingFeedback.remove();
            
            contactSection.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3500);
        }
    }

    showNewsletterFeedback(message, type = 'success') {
        const feedback = document.createElement('div');
        feedback.className = `newsletter-feedback ${type}`;
        feedback.innerHTML = `
            <div class="feedback-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <p>${message}</p>
            </div>
        `;

        const newsletterSection = document.querySelector('.newsletter');
        if (newsletterSection) {
            // Remove any existing feedback
            const existingFeedback = newsletterSection.querySelector('.newsletter-feedback');
            if (existingFeedback) existingFeedback.remove();
            
            newsletterSection.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3500);
        }
    }

    // Setup dropdown behavior
    setupDropdownBehavior() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (event) => {
            const dropdowns = document.querySelectorAll('.has-dropdown');
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(event.target)) {
                    const content = dropdown.querySelector('.dropdown-content');
                    const link = dropdown.querySelector('> a');
                    if (content) {
                        content.style.display = 'none';
                    }
                    if (link) {
                        link.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });

        // Toggle dropdowns on click
        document.querySelectorAll('.has-dropdown > a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Only prevent default if we are on mobile or if it's a click interaction
                if (window.innerWidth <= 1024) {
                    e.preventDefault();
                    const dropdown = e.target.closest('.has-dropdown');
                    if (dropdown) {
                        dropdown.classList.toggle('active');
                        const content = dropdown.querySelector('.dropdown-content');
                        const isExpanded = link.getAttribute('aria-expanded') === 'true';
                        
                        if (content) {
                            content.style.display = isExpanded ? 'none' : 'block';
                        }
                        link.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
                    }
                }
            });
        });

        // Add keyboard navigation support
        document.querySelectorAll('.has-dropdown > a').forEach(link => {
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
                }
            });
        });
    }

    // Testimonial slider functionality
    setupTestimonialSlider() {
        const slides = document.querySelectorAll('.testimonial-slide');
        const dots = document.querySelectorAll('.dot');

        if (slides.length === 0) return;

        this.currentSlide = 0;
        this.showTestimonial(this.currentSlide);

        // Auto slide
        this.sliderInterval = setInterval(() => this.nextTestimonial(), 5000);

        // Manual controls
        dots.forEach((dot, index) => {
            if (dot) {
                dot.addEventListener('click', () => {
                    if (this.sliderInterval) {
                        clearInterval(this.sliderInterval);
                    }
                    this.showTestimonial(index);
                    this.sliderInterval = setInterval(() => this.nextTestimonial(), 5000);
                });
            }
        });
    }

    showTestimonial(n) {
        const slides = document.querySelectorAll('.testimonial-slide');
        const dots = document.querySelectorAll('.dot');

        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        this.currentSlide = n;
        if (slides[this.currentSlide]) slides[this.currentSlide].classList.add('active');
        if (dots[this.currentSlide]) dots[this.currentSlide].classList.add('active');
    }

    nextTestimonial() {
        const slides = document.querySelectorAll('.testimonial-slide');
        this.currentSlide = (this.currentSlide + 1) % slides.length;
        this.showTestimonial(this.currentSlide);
    }

    prevTestimonial() {
        const slides = document.querySelectorAll('.testimonial-slide');
        this.currentSlide = (this.currentSlide - 1 + slides.length) % slides.length;
        this.showTestimonial(this.currentSlide);
    }
}

/**
 * @class NavigationController
 * Architectural controller handling modern slide drawer layouts and toggle interactions.
 * Fixes hamburger toggle with proper state management and event handling.
 */
class NavigationController {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.hamburger = document.querySelector('.hamburger');
        this.sidebar = document.querySelector('.sidebar');
        this.backdrop = document.getElementById('mobileDrawerBackdrop');
        this.navbarCloseBtn = document.querySelector('.navbar-close');
        this.isOpen = false;
        
        this.init();
    }

    /**
     * Bootstraps interface engines upon validating critical DOM elements.
     */
    init() {
        if (this.navbar && this.hamburger) {
            this.setupNavbarToggle();
            this.setupAutoCloseLinks();
            this.setupOutsideClickCleanup();
            this.setupCloseButton();
            this.setupEscapeKey();
        } else {
            console.warn('NavigationController: Navbar or Hamburger node elements not resolved.');
        }
    }

    /**
     * Enforces explicit visual state cleanups across all interactive DOM branches.
     */
    closeMenu() {
        if (this.hamburger) {
            this.hamburger.setAttribute('aria-expanded', 'false');
            this.hamburger.classList.remove('active');
        }
        
        if (this.navbar) {
            this.navbar.classList.remove('open', 'active');
        }

        if (this.sidebar) {
            this.sidebar.classList.remove('open', 'active');
        }

        if (this.backdrop) {
            this.backdrop.classList.remove('active');
            document.body.classList.remove('drawer-open');
        }

        this.isOpen = false;
    }

    /**
     * Opens the menu with proper state updates.
     */
    openMenu() {
        if (this.hamburger) {
            this.hamburger.setAttribute('aria-expanded', 'true');
            this.hamburger.classList.add('active');
        }
        
        if (this.navbar) {
            this.navbar.classList.add('open', 'active');
        }

        if (this.backdrop) {
            this.backdrop.classList.add('active');
            document.body.classList.add('drawer-open');
        }

        this.isOpen = true;
    }

    /**
     * Toggles the menu state.
     */
    toggleMenu() {
        if (this.isOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Binds mouse click and keyboard event routines onto the trigger button node.
     */
    setupNavbarToggle() {
        if (this.hamburger) {
            this.hamburger.setAttribute('aria-expanded', 'false');
            this.hamburger.setAttribute('aria-label', 'Toggle navigation menu');

            this.hamburger.addEventListener('click', (event) => {
                event.stopPropagation();
                this.toggleMenu();
            });

            // Accessibility (A11y) Keyboard Framework Support
            this.hamburger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleMenu();
                }
            });
        }
    }

    /**
     * Sets up the close button inside the navbar drawer.
     */
    setupCloseButton() {
        if (this.navbarCloseBtn) {
            this.navbarCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeMenu();
            });

            this.navbarCloseBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.closeMenu();
                }
            });
        }
    }

    /**
     * Closes menu on Escape key press.
     */
    setupEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
                // Return focus to hamburger
                if (this.hamburger) {
                    this.hamburger.focus();
                }
            }
        });
    }

    /**
     * Evaluates child tokens down structural lists.
     * Direct link selections close the menu; interactive parent links (dropdowns) are ignored.
     */
    setupAutoCloseLinks() {
        if (!this.navbar) return;
        
        const menuLinks = this.navbar.querySelectorAll('.nav-list a:not([href="javascript:void(0)"])');
        
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Only close if it's an actual navigation link, not a dropdown toggle
                if (link.getAttribute('href') && 
                    link.getAttribute('href') !== 'javascript:void(0)' &&
                    link.getAttribute('href') !== '#') {
                    this.closeMenu();
                }
            });
        });

        // Also handle dropdown parent links - prevent closing when toggling dropdown
        const dropdownLinks = this.navbar.querySelectorAll('.has-dropdown > a[href="javascript:void(0)"]');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = link.closest('.has-dropdown');
                if (parent) {
                    parent.classList.toggle('active');
                    const isActive = parent.classList.contains('active');
                    link.setAttribute('aria-expanded', String(isActive));
                }
            });
        });
    }

    /**
     * Layout listener monitoring body elements to auto-dismiss menus on external clicks.
     */
    setupOutsideClickCleanup() {
        document.addEventListener('click', (event) => {
            if (!this.isOpen) return;
            
            const target = event.target;
            const isClickInsideNavbar = this.navbar && this.navbar.contains(target);
            const isClickInsideHamburger = this.hamburger && this.hamburger.contains(target);
            const isClickInsideSidebar = this.sidebar && this.sidebar.contains(target);
            const isClickInsideBackdrop = this.backdrop && this.backdrop.contains(target);

            // If clicking on backdrop, close menu
            if (isClickInsideBackdrop) {
                this.closeMenu();
                return;
            }

            // If clicking outside all relevant elements, close menu
            if (!isClickInsideNavbar && !isClickInsideHamburger && !isClickInsideSidebar) {
                this.closeMenu();
            }
        });

        // Handle window resize - close menu on resize to desktop
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth >= 993 && this.isOpen) {
                    this.closeMenu();
                }
            }, 250);
        });
    }
}

// Instantiate engine onto global runtime lifecycle
document.addEventListener('DOMContentLoaded', () => {
    new NavigationController();
});

// Initialize the Main App
new MainApp();