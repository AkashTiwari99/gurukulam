// Enhanced Main Application Module
class MainApp {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.highlightCurrentPage();
            this.setupContactForm();
            this.setupDropdownBehavior();
            this.setupTestimonialSlider();
            this.setupNavbarToggle();
        });
    }

    // Highlight current page in navigation
    highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-list li a, .navbar ul li a');

        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href').split('/').pop();
            if (linkHref === currentPage) {
                link.classList.add('current-page');
                
                // Highlight dropdown parent if applicable
                const parent = link.closest('.has-dropdown');
                if (parent) {
                    parent.querySelector('> a').classList.add('current-page');
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
                    alert('Please fill in all required fields.');
                    return;
                }
                
                // Simulate form submission
                this.showFormSubmissionFeedback();
                contactForm.reset();
            });
        }
    }

    showFormSubmissionFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'form-feedback';
        feedback.innerHTML = `
            <div class="feedback-content">
                <i class="fas fa-check-circle"></i>
                <p>Thank you for your message! We will get back to you soon.</p>
            </div>
        `;
        
        const contactSection = document.querySelector('.contact-section');
        if (contactSection) {
            contactSection.appendChild(feedback);
            setTimeout(() => feedback.remove(), 3000);
        } else {
            alert('Thank you for your message!');
        }
    }

    // Setup dropdown behavior
    setupDropdownBehavior() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (event) => {
            const dropdowns = document.querySelectorAll('.has-dropdown');
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(event.target)) {
                    dropdown.querySelector('.dropdown-content').style.display = 'none';
                }
            });
        });

        // Toggle dropdowns on click
        document.querySelectorAll('.has-dropdown > a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const dropdown = e.target.closest('.has-dropdown');
                const content = dropdown.querySelector('.dropdown-content');
                content.style.display = content.style.display === 'block' ? 'none' : 'block';
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
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.addEventListener('click', () => {
                clearInterval(this.sliderInterval);
                this.showTestimonial(index);
                this.sliderInterval = setInterval(() => this.nextTestimonial(), 5000);
            });
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
            hamburger.addEventListener('click', () => {
                navbar.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
        }
    }
}

// Initialize the Main App
new MainApp();