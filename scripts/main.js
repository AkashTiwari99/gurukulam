// ============================================================
// Enhanced Main Application Module
// ============================================================
class MainApp {
    constructor() {
        this.sliderInterval = null;
        this.currentSlide = 0;
        this.init();
    }

    init() {
        // Use DOMContentLoaded if not already ready, else fire immediately
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onReady());
        } else {
            this.onReady();
        }

        // Clean up on unload
        window.addEventListener('beforeunload', () => {
            if (this.sliderInterval) {
                clearInterval(this.sliderInterval);
            }
        });
    }

    onReady() {
        this.highlightCurrentPage();
        this.setupContactForm();
        this.setupNewsletterForm();
        this.setupDropdownBehavior();
        this.setupTestimonialSlider();
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname.replace(/\\/g, '/');
        const navItems = document.querySelectorAll('.nav-list li a, .nav-list li button');

        navItems.forEach(item => {
            if (item.tagName.toLowerCase() !== 'a') return;

            const href = item.getAttribute('href');
            if (!href || href.startsWith('javascript:')) return;

            let resolvedHref = href;
            try {
                resolvedHref = new URL(href, window.location.href).pathname;
            } catch (e) {
                resolvedHref = href;
            }

            if (resolvedHref === currentPath || currentPath.endsWith(resolvedHref)) {
                item.classList.add('current-page');
                item.setAttribute('aria-current', 'page');

                const parentDropdown = item.closest('.has-dropdown');
                if (parentDropdown) {
                    const trigger = parentDropdown.querySelector('> button, > a, .dropdown-toggle');
                    if (trigger) {
                        trigger.classList.add('current-page');
                        trigger.setAttribute('aria-expanded', 'true');
                    }
                    parentDropdown.classList.add('active');
                }
            }
        });
    }

    setupContactForm() {
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = contactForm.querySelector('#name');
                const emailInput = contactForm.querySelector('#email');
                const messageInput = contactForm.querySelector('#message');

                if (!nameInput || !emailInput || !messageInput) return;

                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                const message = messageInput.value.trim();

                if (!name || !email || !message) {
                    this.showFormError('Please fill in all required fields.');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.showFormError('Please enter a valid email address.');
                    return;
                }

                this.showFormSubmissionFeedback();
                contactForm.reset();
            });
        }
    }

    setupNewsletterForm() {
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const emailInput = newsletterForm.querySelector('input[type="email"]');
                if (!emailInput) return;

                const email = emailInput.value.trim();

                if (!email) {
                    this.showNewsletterFeedback('Please enter an email address.', 'error');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.showNewsletterFeedback('Please enter a valid email address.', 'error');
                    return;
                }

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
            const existingFeedback = newsletterSection.querySelector('.newsletter-feedback');
            if (existingFeedback) existingFeedback.remove();
            newsletterSection.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3500);
        }
    }

    setupDropdownBehavior() {
        const handleDocumentClick = (event) => {
            const dropdowns = document.querySelectorAll('.has-dropdown');
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(event.target)) {
                    const content = dropdown.querySelector('.dropdown-content');
                    const trigger = dropdown.querySelector('> button, > a');
                    if (content) {
                        content.style.display = '';
                    }
                    if (trigger) {
                        trigger.setAttribute('aria-expanded', 'false');
                    }
                    dropdown.classList.remove('active');
                }
            });
        };

        document.addEventListener('click', handleDocumentClick);

        // Toggle dropdown on link or button click (mobile behavior)
        document.querySelectorAll('.has-dropdown > a, .has-dropdown > button').forEach(trigger => {
            const clickHandler = (e) => {
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    const dropdown = e.target.closest('.has-dropdown');
                    if (dropdown) {
                        dropdown.classList.toggle('active');
                        const content = dropdown.querySelector('.dropdown-content');
                        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

                        if (content) {
                            content.style.display = isExpanded ? 'none' : 'block';
                        }
                        trigger.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
                    }
                }
            };

            trigger.addEventListener('click', clickHandler);

            trigger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    trigger.click();
                }
            });
        });
    }

    setupTestimonialSlider() {
        const slides = document.querySelectorAll('.testimonial-slide');
        const dots = document.querySelectorAll('.dot');

        if (slides.length === 0) return;

        this.currentSlide = 0;
        this.showTestimonial(this.currentSlide);

        // Clear any existing interval before starting a new one
        if (this.sliderInterval) {
            clearInterval(this.sliderInterval);
        }
        this.sliderInterval = setInterval(() => this.nextTestimonial(), 5000);

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
        if (slides.length === 0) return;
        this.currentSlide = (this.currentSlide + 1) % slides.length;
        this.showTestimonial(this.currentSlide);
    }

    prevTestimonial() {
        const slides = document.querySelectorAll('.testimonial-slide');
        if (slides.length === 0) return;
        this.currentSlide = (this.currentSlide - 1 + slides.length) % slides.length;
        this.showTestimonial(this.currentSlide);
    }
}

// ============================================================
// VIEWPORT REALIGNMENT CONTROLLER
// Monitors orientation shifts and runtime layout widths
// ============================================================
class ViewportRealignmentController {
    constructor() {
        this.resizeTimer = null;
        this.init();
    }

    init() {
        const handler = () => this.evaluateViewportConstraints();

        window.addEventListener('resize', handler);
        window.addEventListener('orientationchange', handler);

        // Initial check
        this.evaluateViewportConstraints();
    }

    /**
     * Runtime validation to clean up dirty widths or layout constraints
     */
    evaluateViewportConstraints() {
        const width = window.innerWidth;

        // Force reset active side elements if we're past the mobile breakpoint
        if (width > 992) {
            const navbar = document.getElementById('navbar');
            const hamburger = document.querySelector('.hamburger');
            const backdrop = document.getElementById('mobileDrawerBackdrop');

            if (navbar && navbar.classList.contains('active')) {
                navbar.classList.remove('active', 'open');
                if (hamburger) hamburger.classList.remove('active');
                if (backdrop) backdrop.classList.remove('active');
                document.body.classList.remove('drawer-open');
            }
        }
    }
}

// ============================================================
// HAMBURGER TOGGLE HANDLER
// ============================================================
function initHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.getElementById('navbar');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    const navbarClose = document.querySelector('.navbar-close');

    if (!hamburger || !navbar) {
        console.warn('Hamburger or navbar not found');
        return;
    }

    // Create backdrop if missing
    let backdropElement = backdrop;
    if (!backdropElement) {
        backdropElement = document.createElement('div');
        backdropElement.className = 'mobile-drawer-backdrop';
        backdropElement.id = 'mobileDrawerBackdrop';
        document.body.appendChild(backdropElement);
    }

    function closeMenu() {
        navbar.classList.remove('active', 'open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        backdropElement.classList.remove('active');
        document.body.classList.remove('drawer-open');
    }

    function openMenu() {
        navbar.classList.add('active', 'open');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        backdropElement.classList.add('active');
        document.body.classList.add('drawer-open');
    }

    function toggleMenu(e) {
        if (e) {
            e.stopPropagation();
        }
        if (navbar.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // Instead of cloneNode (which loses listeners), use a clean approach:
    // Remove any existing listeners by using fresh event listeners
    // and tracking state via data attribute.

    // Click event
    hamburger.addEventListener('click', toggleMenu);

    // Keyboard support
    hamburger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu(e);
        }
    });

    // Close button handler
    const closeBtn = navbarClose || document.querySelector('.navbar-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            closeMenu();
        });
    }

    // Backdrop click to close
    backdropElement.addEventListener('click', function () {
        closeMenu();
    });

    // Escape key handler
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navbar.classList.contains('active')) {
            closeMenu();
            hamburger.focus();
        }
    });

    // Close on resize to desktop
    let resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            if (window.innerWidth >= 993 && navbar.classList.contains('active')) {
                closeMenu();
            }
        }, 200);
    });

    // Close when clicking outside the navbar or hamburger
    document.addEventListener('click', function (e) {
        if (!navbar.classList.contains('active')) return;

        const target = e.target;
        const isInsideNavbar = navbar.contains(target);
        const isHamburgerClick = hamburger.contains(target);

        if (!isInsideNavbar && !isHamburgerClick) {
            closeMenu();
        }
    });

    console.log('Hamburger initialized successfully');
}

// ============================================================
// GLOBAL INVOCATION (runs after DOMContentLoaded)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    // Initialize hamburger first (no dependency)
    initHamburger();

    // Initialize viewport controller
    new ViewportRealignmentController();

    // Initialize main app
    new MainApp();
});