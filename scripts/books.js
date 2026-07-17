// Content cache to avoid repeated fetches
const contentCache = new Map();

// Function to load content dynamically
async function loadContent(url, targetElementId, linkElement) {
    const contentElement = document.getElementById(targetElementId);
    if (!contentElement) {
        console.warn(`Target element not found: ${targetElementId}`);
        return;
    }

    const updateDOM = (htmlContent, isError = false) => {
        contentElement.innerHTML = htmlContent;
        contentElement.style.opacity = '1';
        
        if (!isError) {
            // Remove active class from all links
            document.querySelectorAll('.sidebar a, .dropdown-menu a').forEach(link => link.classList.remove('active'));
            // Add active class to the clicked link
            if (linkElement) {
                linkElement.classList.add('active');
            }
        }
    };

    const runDOMUpdate = (htmlContent, isError = false) => {
        if (document.startViewTransition) {
            document.startViewTransition(() => updateDOM(htmlContent, isError));
        } else {
            updateDOM(htmlContent, isError);
        }
    };

    // Resolve the URL relative to the current location and use the resolved URL as cache key
    let resolvedUrl;
    try {
        resolvedUrl = new URL(url, window.location.href).href;
    } catch (e) {
        // If URL constructor fails, fall back to original
        resolvedUrl = url;
    }

    // Check cache first
    if (contentCache.has(resolvedUrl)) {
        runDOMUpdate(contentCache.get(resolvedUrl));
        return;
    }

    contentElement.innerHTML = '<div class="loader-container"><div class="loader"></div><p>Loading...</p></div>';
    contentElement.style.opacity = '0.5';

    try {
        // Create AbortController for timeout handling (5 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.text();

        // Parse html to extract only the actual content wrapper (.page) and sanitize scripts
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');

        // Remove any <script> tags to avoid accidental execution
        doc.querySelectorAll('script').forEach(s => s.remove());

        const pageContent = doc.querySelector('.page');
        const cleanData = pageContent ? pageContent.outerHTML : doc.body.innerHTML;

        // Cache the successful response
        contentCache.set(resolvedUrl, cleanData);

        runDOMUpdate(cleanData);
    } catch (error) {
        console.error('Content loading error:', error);
        
        let errorMessage = 'Unable to load content. ';
        if (error.name === 'AbortError') {
            errorMessage += 'The request took too long. Please check your connection and try again.';
        } else if (error instanceof TypeError) {
            errorMessage += 'Network error. Please check your internet connection.';
        } else {
            errorMessage += error.message || 'Please try again later.';
        }
        
        const errorHtml = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p style="font-size: 0.9em; margin-top: 10px;">If the problem persists, try refreshing the page.</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 10px;">Refresh Page</button>
            </div>
        `;
        runDOMUpdate(errorHtml, true);
    }
}

// Add event listeners to sidebar links only
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.sidebar a[data-target], .dropdown-menu a[data-target]');
    if (!links || links.length === 0) return;

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const url = link.getAttribute('href');
            const targetElementId = link.getAttribute('data-target');

            if (!url || !targetElementId) {
                console.warn('Link missing href or data-target attribute');
                return;
            }

            // Use resolved URL so cache keys are consistent
            let resolvedUrl;
            try {
                resolvedUrl = new URL(url, window.location.href).href;
            } catch (e) {
                resolvedUrl = url;
            }

            loadContent(resolvedUrl, targetElementId, link);
        });
    });
});

// Initialize Kanda dropdown
function initKandaDropdown() {
    // Define files with their basenames since they all reside in Books/book_link/
    const kandaFiles = [
        { file: "Bala_Srga.html", name: "बालकाण्डः" },
        { file: "Ay_Sarga.html", name: "अयोध्याकाण्डः" },
        { file: "Ara_sarga.html", name: "अरण्यकाण्डः" },
        { file: "KIs_Sraga.html", name: "किष्किन्धाकाण्डः" },
        { file: "SU_Sraga.html", name: "सुन्दरकाण्डः" },
        { file: "YU_Sarga.html", name: "युद्धकाण्डः" },
        { file: "utt_sarga.html", name: "उत्तरकाण्डः" }
    ];

    const dropdownMenu = document.getElementById("kanda-dropdown-menu");
    const currentPath = window.location.pathname;

    if (dropdownMenu) {
        dropdownMenu.innerHTML = ''; // Clear existing items

        // Determine the prefix based on current location
        let prefix = "";
        if (currentPath.includes("/Books/book_link/")) {
            prefix = "";
        } else if (currentPath.includes("/Books/")) {
            prefix = "book_link/";
        } else {
            prefix = "./Books/book_link/";
        }

        kandaFiles.forEach(item => {
            const finalUrl = prefix + item.file;

            if (!currentPath.endsWith(item.file)) {
                const listItem = document.createElement("li");
                const anchor = document.createElement("a");
                anchor.href = finalUrl;
                anchor.textContent = item.name;
                anchor.setAttribute('data-target', 'content');
                listItem.appendChild(anchor);
                dropdownMenu.appendChild(listItem);
            }
        });
    }
}

function initKandaDropdownToggle() {
    const dropdownToggle = document.querySelector('.kanda-dropdown-container .dropdown-toggle');
    const dropdownMenu = document.querySelector('.kanda-dropdown-container .dropdown-menu');

    if (!dropdownToggle || !dropdownMenu) return;

    dropdownToggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        dropdownMenu.classList.toggle('open');
        const expanded = dropdownMenu.classList.contains('open');
        dropdownToggle.setAttribute('aria-expanded', String(expanded));
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const container = document.querySelector('.kanda-dropdown-container');
        if (container && !container.contains(event.target)) {
            dropdownMenu.classList.remove('open');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Close dropdown on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            dropdownMenu.classList.remove('open');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Call the function to initialize the dropdown
initKandaDropdown();
initKandaDropdownToggle();

// Sidebar Controller - Handles sidebar toggle and interaction
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const mainContainer = document.querySelector('.main-container');
    const sidebarToggles = Array.from(document.querySelectorAll('.chapter-sidebar-toggle, #sidebarToggle, .sidebar-toggle'));
    const header = document.querySelector('.header');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    const navbar = document.getElementById('navbar');
    const hamburger = document.querySelector('.hamburger');

    if (!sidebar || !content || !header || !mainContainer) return;

    // Get header height
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

    // Mobile detection
    function isMobile() {
        return window.matchMedia('(max-width: 992px)').matches;
    }

    // Initialize sidebar state
    let sidebarCollapsed = isMobile();

    // Try to get saved state from localStorage (only for desktop)
    if (!isMobile()) {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            sidebarCollapsed = savedState === 'true';
        }
    }

    // Close navbar drawer (hamburger menu)
    function closeNavbarDrawer() {
        if (navbar) {
            navbar.classList.remove('active', 'open');
        }
        if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
        if (backdrop) {
            backdrop.classList.remove('active');
            document.body.classList.remove('drawer-open');
        }
    }

    // Update backdrop visibility
    function updateBackdrop() {
        if (!backdrop) return;
        const isSidebarOpen = !sidebarCollapsed && isMobile();
        const isNavbarOpen = navbar && navbar.classList.contains('active');
        const anyOpen = isSidebarOpen || isNavbarOpen;
        
        backdrop.classList.toggle('active', anyOpen);
        document.body.classList.toggle('drawer-open', anyOpen);
    }

    // Toggle sidebar
    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        updateSidebar();

        // Update aria-expanded on toggles
        sidebarToggles.forEach(t => t.setAttribute('aria-expanded', String(!sidebarCollapsed)));

        // Save state (only for desktop)
        if (!isMobile()) {
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
        }

        // When opening on mobile, close navbar drawer and focus first link
        if (!sidebarCollapsed && isMobile()) {
            closeNavbarDrawer();
            const firstLink = sidebar.querySelector('a');
            if (firstLink) firstLink.focus();
        }
        
        updateBackdrop();
    }

    // Update sidebar state
    function updateSidebar() {
        content.style.marginLeft = '0';

        if (isMobile()) {
            if (sidebarCollapsed) {
                sidebar.classList.remove('active');
                mainContainer.classList.remove('sidebar-open');
            } else {
                sidebar.classList.add('active');
                mainContainer.classList.add('sidebar-open');
            }
        } else {
            if (sidebarCollapsed) {
                sidebar.classList.add('collapsed');
                mainContainer.classList.add('sidebar-collapsed');
            } else {
                sidebar.classList.remove('collapsed');
                mainContainer.classList.remove('sidebar-collapsed');
            }
        }
        updateBackdrop();
    }

    // Adjust content height
    function updateContentHeight() {
        const headerHeight = header.offsetHeight;
        content.style.minHeight = `calc(100vh - ${headerHeight}px)`;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }

    // Set up sidebar toggle buttons
    sidebarToggles.forEach(btn => {
        btn.setAttribute('aria-controls', 'sidebar');
        btn.setAttribute('aria-expanded', String(!sidebarCollapsed));
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
        
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
            }
        });
    });

    // Close sidebar when a chapter link is clicked (mobile only)
    sidebar.querySelectorAll('a[data-target]').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobile()) {
                sidebarCollapsed = true;
                updateSidebar();
                updateBackdrop();
            }
        });
    });

    // Close drawers when backdrop is clicked
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            if (isMobile()) {
                if (!sidebarCollapsed) {
                    sidebarCollapsed = true;
                    updateSidebar();
                }
                closeNavbarDrawer();
                updateBackdrop();
            }
        });
    }

    // Desktop hover effect for sidebar
    if (!isMobile()) {
        sidebar.addEventListener('mouseenter', () => {
            if (sidebarCollapsed) {
                sidebarCollapsed = false;
                updateSidebar();
            }
        });

        sidebar.addEventListener('mouseleave', () => {
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (!sidebarCollapsed && savedState === 'true') {
                sidebarCollapsed = true;
                updateSidebar();
            }
        });
    }

    // Close sidebar on Escape key (mobile)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isMobile() && !sidebarCollapsed) {
                sidebarCollapsed = true;
                updateSidebar();
                sidebarToggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
                updateBackdrop();
            }
            // Also close navbar if open
            if (navbar && navbar.classList.contains('active')) {
                closeNavbarDrawer();
                updateBackdrop();
            }
        }
    });

    // Click outside to close on mobile
    document.addEventListener('click', (e) => {
        if (!isMobile()) return;
        
        const target = e.target;
        const isInsideSidebar = sidebar.contains(target);
        const isToggle = sidebarToggles.some(t => t.contains(target));
        const isInsideNavbar = navbar && navbar.contains(target);
        const isInsideHamburger = hamburger && hamburger.contains(target);
        const isInsideBackdrop = backdrop && backdrop.contains(target);

        // If clicking on backdrop, handled above
        if (isInsideBackdrop) return;

        // If clicking outside sidebar and sidebar is open, close it
        if (!sidebarCollapsed && !isInsideSidebar && !isToggle && !isInsideNavbar && !isInsideHamburger) {
            sidebarCollapsed = true;
            updateSidebar();
            sidebarToggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
            updateBackdrop();
        }
    });

    // Handle window resize
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (isMobile()) {
                if (!sidebarCollapsed) {
                    sidebarCollapsed = true;
                    updateSidebar();
                }
                // Close navbar on resize to mobile
                if (navbar && navbar.classList.contains('active')) {
                    closeNavbarDrawer();
                }
            } else {
                // Restore saved state on desktop
                const savedState = localStorage.getItem('sidebarCollapsed');
                if (savedState !== null) {
                    sidebarCollapsed = savedState === 'true';
                    updateSidebar();
                }
                // Ensure navbar is visible on desktop
                if (navbar) {
                    navbar.classList.remove('active', 'open');
                }
                if (hamburger) {
                    hamburger.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                }
                if (backdrop) {
                    backdrop.classList.remove('active');
                    document.body.classList.remove('drawer-open');
                }
            }
            updateContentHeight();
        }, 250);
    }

    window.addEventListener('resize', handleResize);

    // Initialize
    updateSidebar();
    updateContentHeight();
});

// --- Fix: Ensure navbar toggle works with hamburger ---
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navbar = document.getElementById('navbar');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    const navbarClose = document.querySelector('.navbar-close');

    if (!hamburger || !navbar) return;

    // Remove any existing click listeners to avoid duplicates
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);

    // Get the new reference
    const freshHamburger = document.querySelector('.hamburger');

    // Toggle navbar on hamburger click
    freshHamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = navbar.classList.contains('active');
        
        if (isOpen) {
            navbar.classList.remove('active', 'open');
            freshHamburger.classList.remove('active');
            freshHamburger.setAttribute('aria-expanded', 'false');
            if (backdrop) {
                backdrop.classList.remove('active');
                document.body.classList.remove('drawer-open');
            }
        } else {
            navbar.classList.add('active', 'open');
            freshHamburger.classList.add('active');
            freshHamburger.setAttribute('aria-expanded', 'true');
            if (backdrop) {
                backdrop.classList.add('active');
                document.body.classList.add('drawer-open');
            }
            // Close sidebar if open on mobile
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                // Close sidebar via its toggle
                const sidebarToggle = document.querySelector('.chapter-sidebar-toggle, #sidebarToggle, .sidebar-toggle');
                if (sidebarToggle) {
                    sidebarToggle.click();
                }
            }
        }
    });

    // Close navbar with close button
    if (navbarClose) {
        navbarClose.addEventListener('click', function(e) {
            e.stopPropagation();
            navbar.classList.remove('active', 'open');
            freshHamburger.classList.remove('active');
            freshHamburger.setAttribute('aria-expanded', 'false');
            if (backdrop) {
                backdrop.classList.remove('active');
                document.body.classList.remove('drawer-open');
            }
        });
    }

    // Keyboard support for hamburger
    freshHamburger.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            freshHamburger.click();
        }
    });
});