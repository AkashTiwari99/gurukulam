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
            this.setupNavbarToggle();
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

    // Navbar toggle for mobile
    setupNavbarToggle() {
        const navbar = document.getElementById('navbar');
        const hamburger = document.querySelector('.hamburger');

        if (navbar && hamburger) {
            // Set initial aria-expanded
            hamburger.setAttribute('aria-expanded', 'false');
            
            hamburger.addEventListener('click', () => {
                const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                navbar.classList.toggle('active');
                hamburger.classList.toggle('active');
                hamburger.setAttribute('aria-expanded', !isExpanded);
            });

            // Add keyboard support (Space/Enter to toggle)
            hamburger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    hamburger.click();
                }
            });
        } else {
            console.warn('Navbar or hamburger element not found');
        }
    }
}

// Initialize the Main App
new MainApp();