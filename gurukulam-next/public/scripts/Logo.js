// ==========================================
// Logo Animation
// ==========================================
function animateLogo() {
    const logoCircle = document.querySelector('.logo-circle');
    if (logoCircle) {
        logoCircle.addEventListener('mouseenter', () => {
            logoCircle.style.transform = 'rotate(360deg)';
            logoCircle.style.transition = 'transform 1s ease-in-out';
        });

        logoCircle.addEventListener('mouseleave', () => {
            logoCircle.style.transform = 'rotate(0deg)';
        });
    }
}

// Initialize logo animation on page load
document.addEventListener('DOMContentLoaded', animateLogo);