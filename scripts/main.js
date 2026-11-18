// Enhanced Main Application Module
const CONTACT_EMAIL = 'a7333ji@gmail.com';

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
            this.setupKeyboardDismiss();
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
        const currentPath = decodeURIComponent(window.location.pathname);
        const currentPage = currentPath.split('/').pop() || 'index.html';
        const navLinks = Array.from(document.querySelectorAll('.nav-list li a, .navbar ul li a'));

        const matchingLinks = navLinks.filter(link => {
            const href = link.getAttribute('href');
            if (!href || href.startsWith('javascript:') || href.startsWith('#')) return false;

            const cleanHref = decodeURIComponent(href.split('#')[0].split('?')[0]);
            const linkPage = cleanHref.split('/').pop() || 'index.html';
            return linkPage === currentPage;
        });

        if (matchingLinks.length > 0) {
            navLinks.forEach(link => {
                link.classList.remove('current-page');
                link.removeAttribute('aria-current');
            });

            matchingLinks.forEach(link => {
                link.classList.add('current-page');
                link.setAttribute('aria-current', 'page');

                // Highlight dropdown parent if applicable
                const parent = link.closest('.has-dropdown');
                if (parent) {
                    const parentLink = parent.querySelector(':scope > a, :scope > button');
                    if (parentLink && parentLink !== link) {
                        parentLink.classList.add('current-page');
                    }
                }
            });
        } else {
            // Ensure any statically marked current-page link has aria-current="page"
            navLinks.forEach(link => {
                if (link.classList.contains('current-page')) {
                    link.setAttribute('aria-current', 'page');
                }
            });
        }
    }

    // Setup contact form with validation and honest mailto: fallback
    setupContactForm() {
        const contactForm = document.querySelector('.contact-form');
        if (!contactForm) return;

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('#name')?.value.trim() || '';
            const email = contactForm.querySelector('#email')?.value.trim() || '';
            const phone = contactForm.querySelector('#phone')?.value.trim() || '';
            const subjectInput = contactForm.querySelector('#subject')?.value.trim() || '';
            const message = contactForm.querySelector('#message')?.value.trim() || '';

            if (!name || !email || !message) {
                this.showFormError('Please fill in all required fields.');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showFormError('Please enter a valid email address.');
                return;
            }

            const mailSubject = subjectInput || `Message from ${name} via Gurukulam Website`;
            const bodyLines = [
                `Name: ${name}`,
                `Email: ${email}`,
                phone ? `Phone: ${phone}` : null,
                '',
                message
            ].filter(line => line !== null).join('\n');

            const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(bodyLines)}`;
            window.location.href = mailtoUrl;

            this.showFormSubmissionFeedback(mailtoUrl);
            contactForm.reset();
        });
    }

    // Setup newsletter form with validation and honest mailto: fallback
    setupNewsletterForm() {
        const newsletterForm = document.querySelector('.newsletter-form');
        if (!newsletterForm) return;

        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput ? emailInput.value.trim() : '';

            if (!email) {
                this.showNewsletterFeedback('Please enter an email address.', 'error');
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showNewsletterFeedback('Please enter a valid email address.', 'error');
                return;
            }

            const mailSubject = 'Gurukulam Newsletter Subscription Request';
            const mailBody = `Please subscribe ${email} to the Gurukulam newsletter.`;
            const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
            window.location.href = mailtoUrl;

            this.showNewsletterFeedback(
                `Opening your email client to subscribe ${email}. If no email app opened, please write to `,
                'success',
                mailtoUrl
            );
            newsletterForm.reset();
        });
    }

    createFeedbackElement(className, iconClass, message, mailtoUrl = null, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = className;
        feedback.setAttribute('role', isError ? 'alert' : 'status');
        feedback.setAttribute('aria-live', isError ? 'assertive' : 'polite');

        const content = document.createElement('div');
        content.className = 'feedback-content';

        const icon = document.createElement('i');
        icon.className = iconClass;
        icon.setAttribute('aria-hidden', 'true');

        const paragraph = document.createElement('p');
        paragraph.textContent = message;

        if (mailtoUrl) {
            const emailLink = document.createElement('a');
            emailLink.href = mailtoUrl;
            emailLink.textContent = CONTACT_EMAIL;
            emailLink.style.textDecoration = 'underline';
            emailLink.style.fontWeight = '600';
            paragraph.appendChild(emailLink);
            paragraph.appendChild(document.createTextNode('.'));
        }

        content.appendChild(icon);
        content.appendChild(paragraph);
        feedback.appendChild(content);
        return feedback;
    }

    showFormError(message) {
        const contactSection = document.querySelector('.contact-section');
        if (!contactSection) return;

        const existingFeedback = contactSection.querySelector('.form-feedback');
        if (existingFeedback) existingFeedback.remove();

        const feedback = this.createFeedbackElement(
            'form-feedback error',
            'fas fa-exclamation-circle',
            message,
            null,
            true
        );

        contactSection.appendChild(feedback);
        setTimeout(() => feedback.remove(), 5000);
    }

    showFormSubmissionFeedback(mailtoUrl) {
        const contactSection = document.querySelector('.contact-section');
        if (!contactSection) return;

        const existingFeedback = contactSection.querySelector('.form-feedback');
        if (existingFeedback) existingFeedback.remove();

        const feedback = this.createFeedbackElement(
            'form-feedback success',
            'fas fa-envelope',
            'Opening your email app with your pre-filled message. If no email client is configured, please email us directly at ',
            mailtoUrl,
            false
        );

        contactSection.appendChild(feedback);
    }

    showNewsletterFeedback(message, type = 'success', mailtoUrl = null) {
        const newsletterSection = document.querySelector('.newsletter');
        if (!newsletterSection) return;

        const existingFeedback = newsletterSection.querySelector('.newsletter-feedback');
        if (existingFeedback) existingFeedback.remove();

        const isError = type === 'error';
        const iconClass = isError ? 'fas fa-exclamation-circle' : 'fas fa-envelope';
        const feedback = this.createFeedbackElement(
            `newsletter-feedback ${type}`,
            iconClass,
            message,
            mailtoUrl,
            isError
        );

        newsletterSection.appendChild(feedback);
        if (isError) {
            setTimeout(() => feedback.remove(), 5000);
        }
    }

    closeDropdown(dropdown) {
        dropdown.classList.remove('active', 'dropdown-open');
        const link = dropdown.querySelector(':scope > a, :scope > button');
        if (link) {
            link.setAttribute('aria-expanded', 'false');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.has-dropdown').forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
    }

    // Setup dropdown behavior
    setupDropdownBehavior() {
        const dropdownTriggers = document.querySelectorAll('.has-dropdown > a, .has-dropdown > button');

        dropdownTriggers.forEach(link => {
            if (!link.hasAttribute('aria-expanded')) {
                link.setAttribute('aria-expanded', 'false');
            }

            link.addEventListener('click', (e) => {
                const dropdown = link.closest('.has-dropdown');
                if (!dropdown) return;

                const href = link.getAttribute('href');
                const isPlaceholderHref = link.tagName === 'BUTTON' || !href || href === '#' || href.startsWith('javascript:');

                if (window.innerWidth <= 1024 || isPlaceholderHref) {
                    e.preventDefault();
                    const willOpen = !dropdown.classList.contains('dropdown-open') && !dropdown.classList.contains('active');

                    // Close sibling dropdowns first
                    this.closeAllDropdowns();

                    if (willOpen) {
                        dropdown.classList.add('active', 'dropdown-open');
                        link.setAttribute('aria-expanded', 'true');
                    }
                }
            });

            if (link.tagName !== 'BUTTON') {
                link.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        link.click();
                    }
                });
            }
        });

        // Close dropdowns when clicking outside (via CSS classes so desktop :hover stays intact)
        document.addEventListener('click', (event) => {
            document.querySelectorAll('.has-dropdown').forEach(dropdown => {
                if (!dropdown.contains(event.target)) {
                    this.closeDropdown(dropdown);
                }
            });
        });
    }

    // Close open menus/dropdowns on Escape key
    setupKeyboardDismiss() {
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;

            this.closeAllDropdowns();

            const navbar = document.getElementById('navbar');
            const hamburger = document.querySelector('.hamburger');
            if (navbar && navbar.classList.contains('active')) {
                navbar.classList.remove('active');
                if (hamburger) {
                    hamburger.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                    hamburger.focus();
                }
            }
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
                const isOpen = navbar.classList.toggle('active');
                hamburger.classList.toggle('active', isOpen);
                hamburger.setAttribute('aria-expanded', String(isOpen));
            });

            // Keyboard fallback for non-button hamburger elements
            if (hamburger.tagName !== 'BUTTON') {
                hamburger.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        hamburger.click();
                    }
                });
            }
        }
    }
}

// Initialize the Main App
new MainApp();
