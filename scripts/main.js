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

        window.addEventListener('beforeunload', () => {
            if (this.sliderInterval) {
                clearInterval(this.sliderInterval);
            }
        });
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-list li a, .navbar ul li a');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('javascript:')) return;
            
            const linkPage = href.split('/').pop() || 'index.html';
            
            if (currentPath.endsWith(linkPage) || currentPath.endsWith('/' + linkPage)) {
                link.classList.add('current-page');
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

    setupContactForm() {
        const contactForm = document.querySelector('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = contactForm.querySelector('#name').value.trim();
                const email = contactForm.querySelector('#email').value.trim();
                const message = contactForm.querySelector('#message').value.trim();

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
                    dropdown.classList.remove('active');
                }
            });
        });

        document.querySelectorAll('.has-dropdown > a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 992) {
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

        document.querySelectorAll('.has-dropdown > a').forEach(link => {
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    link.click();
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
        this.currentSlide = (this.currentSlide + 1) % slides.length;
        this.showTestimonial(this.currentSlide);
    }

    prevTestimonial() {
        const slides = document.querySelectorAll('.testimonial-slide');
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
        this.init();
    }

    init() {
        // Bind viewport orientation change listener
        window.addEventListener('resize', () => this.evaluateViewportConstraints());
        window.addEventListener('orientationchange', () => this.evaluateViewportConstraints());
        
        // Initial execution trace
        this.evaluateViewportConstraints();
    }

    /**
     * Runtime validation to clean up dirty widths or layout constraints
     */
    evaluateViewportConstraints() {
        const width = window.innerWidth;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;

        // Force reset active side elements if dynamic dimensions conflict
        if (width > 992 || isLandscape) {
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
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.getElementById('navbar');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    const navbarClose = document.querySelector('.navbar-close');

    // If no backdrop exists, create one
    let backdropElement = backdrop;
    if (!backdropElement) {
        backdropElement = document.createElement('div');
        backdropElement.className = 'mobile-drawer-backdrop';
        backdropElement.id = 'mobileDrawerBackdrop';
        document.body.appendChild(backdropElement);
    }

    if (!hamburger || !navbar) {
        console.warn('Hamburger or navbar not found');
        return;
    }

    function closeMenu() {
        navbar.classList.remove('active', 'open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        if (backdropElement) {
            backdropElement.classList.remove('active');
            document.body.classList.remove('drawer-open');
        }
    }

    function openMenu() {
        navbar.classList.add('active', 'open');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        if (backdropElement) {
            backdropElement.classList.add('active');
            document.body.classList.add('drawer-open');
        }
    }

    function toggleMenu(e) {
        if (e) e.stopPropagation();
        if (navbar.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // Remove existing listeners by cloning
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);
    const freshHamburger = document.querySelector('.hamburger');

    // Click event
    freshHamburger.addEventListener('click', toggleMenu);

    // Keyboard support
    freshHamburger.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
        }
    });

    // Close button
    const closeBtn = navbarClose || document.querySelector('.navbar-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMenu();
        });
    }

    // Backdrop click
    if (backdropElement) {
        backdropElement.addEventListener('click', closeMenu);
    }

    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navbar.classList.contains('active')) {
            closeMenu();
            freshHamburger.focus();
        }
    });

    // Close on resize to desktop
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            if (window.innerWidth >= 993 && navbar.classList.contains('active')) {
                closeMenu();
            }
        }, 200);
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
        if (!navbar.classList.contains('active')) return;
        
        const target = e.target;
        const isInsideNavbar = navbar.contains(target);
        const isInsideHamburger = freshHamburger.contains(target);
        const isInsideBackdrop = backdropElement && backdropElement.contains(target);
        
        if (!isInsideNavbar && !isInsideHamburger && !isInsideBackdrop) {
            closeMenu();
        }
    });

    console.log('Hamburger initialized successfully');
});

// ============================================================
// GLOBAL INVOCATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    new ViewportRealignmentController();
    new MainApp();
});