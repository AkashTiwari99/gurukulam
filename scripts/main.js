// Enhanced Main Application Module
const CONTACT_EMAIL = 'a7333ji@gmail.com';

// ============================================================
// THEME MANAGER (Milestone 1 — Starlight Bronze Theming Engine)
// ============================================================
class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'theme';
        this.VALID_MODES = ['system', 'light', 'dark'];
        this.mediaQuery = (typeof window !== 'undefined' && window.matchMedia)
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : null;
        this.currentMode = this.getStoredMode();
        this.init();
    }

    /**
     * Safely reads the theme preference from localStorage.
     * Returns 'system', 'light', or 'dark'. Defaults to 'system'.
     */
    getStoredMode() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (this.VALID_MODES.includes(stored)) {
                return stored;
            }
        } catch (e) {
            // Storage access restricted (private browsing / security settings)
        }
        return 'system';
    }

    /**
     * Safely persists the theme mode to localStorage.
     */
    setStoredMode(mode) {
        try {
            localStorage.setItem(this.STORAGE_KEY, mode);
        } catch (e) {
            // Storage write restricted or quota exceeded
        }
    }

    /**
     * Resolves effective theme ('light' or 'dark') given mode ('system', 'light', 'dark').
     */
    resolveTheme(mode) {
        if (mode === 'dark') return 'dark';
        if (mode === 'light') return 'light';
        return (this.mediaQuery && this.mediaQuery.matches) ? 'dark' : 'light';
    }

    /**
     * Applies theme to documentElement and synchronizes UI.
     * @param {string} mode - 'system' | 'light' | 'dark'
     * @param {boolean} [persist=true] - Whether to persist to localStorage
     */
    applyTheme(mode, persist = true) {
        if (!this.VALID_MODES.includes(mode)) {
            mode = 'system';
        }
        this.currentMode = mode;

        if (persist) {
            this.setStoredMode(mode);
        }

        const resolvedTheme = this.resolveTheme(mode);
        const root = document.documentElement;

        // Set CSS attribute hooks
        root.setAttribute('data-theme', resolvedTheme);
        root.setAttribute('data-theme-mode', mode);

        // Inform browser engine / native controls (scrollbars, form inputs)
        try {
            root.style.colorScheme = resolvedTheme;
        } catch (e) {
            // Graceful fallback for older engines
        }

        // Synchronize switcher buttons
        this.syncUI();
    }

    /**
     * Public method to change mode and persist.
     */
    setTheme(mode) {
        this.applyTheme(mode, true);
    }

    /**
     * Synchronizes all .theme-btn elements across the page with current mode.
     */
    syncUI() {
        const mode = this.currentMode;
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            const val = btn.getAttribute('data-theme-val');
            const isActive = (val === mode);
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    /**
     * Attaches delegated click listeners, OS change listener, and storage synchronization.
     */
    setupListeners() {
        // Delegated click handler on document handles all current and dynamic .theme-btn elements
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-btn');
            if (!btn) return;
            e.preventDefault();
            const val = btn.getAttribute('data-theme-val');
            if (val && this.VALID_MODES.includes(val)) {
                this.setTheme(val);
            }
        });

        // Listen for OS media query changes
        if (this.mediaQuery) {
            const onOSChange = () => {
                // Only adapt when the user preference is set to 'system'
                if (this.currentMode === 'system') {
                    this.applyTheme('system', false);
                }
            };

            if (typeof this.mediaQuery.addEventListener === 'function') {
                this.mediaQuery.addEventListener('change', onOSChange);
            } else if (typeof this.mediaQuery.addListener === 'function') {
                this.mediaQuery.addListener(onOSChange);
            }
        }

        // Multi-tab synchronization
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY && e.newValue) {
                if (this.VALID_MODES.includes(e.newValue)) {
                    this.applyTheme(e.newValue, false);
                }
            }
        });
    }

    /**
     * Initializes ThemeManager state and event listeners.
     */
    init() {
        // Apply theme immediately (safe because documentElement is already available)
        this.applyTheme(this.currentMode, false);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.syncUI();
                this.setupListeners();
            });
        } else {
            this.syncUI();
            this.setupListeners();
        }
    }
}

class MainApp {
    constructor() {
        // Initialize ThemeManager and expose to global scope for tests / cross-component access
        this.themeManager = new ThemeManager();
        if (typeof window !== 'undefined') {
            window.themeManager = this.themeManager;
        }

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
            this.setupNavbarScroll();
            this.setupKeyboardDismiss();
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (this.sliderInterval) {
                clearInterval(this.sliderInterval);
            }
        });
    }

    // Navbar scroll shrink behavior (toggles .scrolled on .header)
    setupNavbarScroll() {
        const header = document.querySelector('.header');
        if (!header) return;

        const onScroll = () => {
            const scrolled = window.scrollY > 20;
            header.classList.toggle('scrolled', scrolled);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // Check scroll position immediately on page load/refresh
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

    createFeedbackIcon(isError) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('class', 'site-icon');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '1.2em');
        svg.setAttribute('height', '1.2em');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');

        if (isError) {
            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '10');
            const line1 = document.createElementNS(svgNS, 'line');
            line1.setAttribute('x1', '12');
            line1.setAttribute('y1', '8');
            line1.setAttribute('x2', '12');
            line1.setAttribute('y2', '12');
            const line2 = document.createElementNS(svgNS, 'line');
            line2.setAttribute('x1', '12');
            line2.setAttribute('y1', '16');
            line2.setAttribute('x2', '12.01');
            line2.setAttribute('y2', '16');
            svg.append(circle, line1, line2);
        } else {
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', '2');
            rect.setAttribute('y', '4');
            rect.setAttribute('width', '20');
            rect.setAttribute('height', '16');
            rect.setAttribute('rx', '2');
            const poly = document.createElementNS(svgNS, 'polyline');
            poly.setAttribute('points', '22,6 12,13 2,6');
            svg.append(rect, poly);
        }
        return svg;
    }

    createFeedbackElement(className, _iconType, message, mailtoUrl = null, isError = false) {
        const feedback = document.createElement('div');
        feedback.className = className;
        feedback.setAttribute('role', isError ? 'alert' : 'status');
        feedback.setAttribute('aria-live', isError ? 'assertive' : 'polite');

        const content = document.createElement('div');
        content.className = 'feedback-content';

        const icon = this.createFeedbackIcon(isError);

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
            'error',
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
            'envelope',
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
        const feedback = this.createFeedbackElement(
            `newsletter-feedback ${type}`,
            isError ? 'error' : 'envelope',
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
            if (navbar && navbar.classList.contains('active')) {
                this.closeNavbar(true);
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
        dots.forEach(dot => {
            dot.classList.remove('active');
            dot.setAttribute('aria-pressed', 'false');
        });

        this.currentSlide = n;
        if (slides[this.currentSlide]) slides[this.currentSlide].classList.add('active');
        if (dots[this.currentSlide]) {
            dots[this.currentSlide].classList.add('active');
            dots[this.currentSlide].setAttribute('aria-pressed', 'true');
        }
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

    setNavbarOpen(isOpen, returnFocus = false) {
        const navbar = document.getElementById('navbar');
        const hamburger = document.querySelector('.hamburger');
        const header = navbar ? navbar.closest('.header') : document.querySelector('.header');
        const backdrop = document.getElementById('navBackdrop');

        if (!navbar) return;

        navbar.classList.toggle('active', isOpen);
        if (hamburger) {
            hamburger.classList.toggle('active', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
        }
        if (backdrop) {
            backdrop.classList.toggle('active', isOpen);
        }
        if (header) {
            header.classList.toggle('nav-open', isOpen);
        }

        if (!isOpen && returnFocus && hamburger) {
            hamburger.focus();
        }
    }

    closeNavbar(returnFocus = false) {
        this.setNavbarOpen(false, returnFocus);
    }

    // Navbar toggle for mobile
    setupNavbarToggle() {
        const navbar = document.getElementById('navbar');
        const hamburger = document.querySelector('.hamburger');

        if (!navbar || !hamburger) return;

        // Ensure clickable backdrop exists inside .header (same stacking context as .navbar)
        let backdrop = document.getElementById('navBackdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'navBackdrop';
            backdrop.className = 'nav-backdrop';
            backdrop.setAttribute('aria-hidden', 'true');
            const header = navbar.closest('.header') || document.querySelector('.header');
            if (header) {
                header.insertBefore(backdrop, header.firstChild);
            } else {
                document.body.appendChild(backdrop);
            }
        }

        // Set initial aria-expanded
        hamburger.setAttribute('aria-expanded', 'false');

        hamburger.addEventListener('click', () => {
            const willOpen = !navbar.classList.contains('active');
            this.setNavbarOpen(willOpen, false);
        });

        // Wire .navbar-close button inside mobile drawer
        const closeBtn = navbar.querySelector('.navbar-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeNavbar(true);
            });
        }

        // Clicking outside #navbar (on backdrop) closes the drawer cleanly
        backdrop.addEventListener('click', () => {
            this.closeNavbar(true);
        });

        // Close drawer when navigating via a direct link inside #navbar
        navbar.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            const href = link.getAttribute('href') || '';
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                this.closeNavbar(false);
            }
        });

        // Close mobile drawer automatically if viewport widens past breakpoint
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900 && navbar.classList.contains('active')) {
                this.closeNavbar(false);
            }
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

// Initialize the Main App
new MainApp();
