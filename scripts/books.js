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

    contentElement.innerHTML = '<div class="loader"><p>Loading...</p></div>';
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
            <div class="error-message" style="padding: 20px; background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p style="font-size: 0.9em; margin-top: 10px;">If the problem persists, try refreshing the page.</p>
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
        dropdownMenu.classList.toggle('open');
        const expanded = dropdownMenu.classList.contains('open');
        dropdownToggle.setAttribute('aria-expanded', String(expanded));
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.kanda-dropdown-container')) {
            dropdownMenu.classList.remove('open');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// Call the function to initialize the dropdown
initKandaDropdown();
initKandaDropdownToggle();

// dynamic-sidebar.js logic included
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const mainContainer = document.querySelector('.main-container');
    const sidebarToggles = Array.from(document.querySelectorAll('.chapter-sidebar-toggle')) || [];
    const header = document.querySelector('.header');
    const navbar = document.getElementById('navbar');
    const hamburger = document.querySelector('.hamburger');
    const backdrop = document.getElementById('mobileDrawerBackdrop');

    if (!sidebar || !content || !header || !mainContainer) return;

    // If no toggle buttons found, try to create a basic one for mobile
    if (sidebarToggles.length === 0) {
        const btn = document.createElement('button');
        btn.className = 'sidebar-toggle';
        btn.id = 'sidebarToggle';
        btn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(btn);
        sidebarToggles.push(btn);
    }

    const headerHeight = header.offsetHeight;

    // Set CSS variables
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

    function closeNavbarDrawer() {
        if (navbar) {
            navbar.classList.remove('active');
        }
        if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    }

    function updateBackdrop() {
        if (!backdrop) return;
        const anyOpen = isMobile() && (!sidebarCollapsed || (navbar && navbar.classList.contains('active')));
        backdrop.classList.toggle('active', anyOpen);
        document.body.classList.toggle('drawer-open', anyOpen);
    }

    // Toggle function
    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        updateSidebar();

        // Update aria-expanded on toggles
        sidebarToggles.forEach(t => t.setAttribute('aria-expanded', String(!sidebarCollapsed)));

        // Save state (only for desktop)
        if (!isMobile()) {
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
        }

        // When opening on mobile, focus first link
        if (!sidebarCollapsed && isMobile()) {
            closeNavbarDrawer();
            const firstLink = sidebar.querySelector('a');
            if (firstLink) firstLink.focus();
        }
    }

    // Update sidebar state
    function updateSidebar() {
        content.style.marginLeft = '0'; // Clear any direct content margin

        if (isMobile()) {
            if (sidebarCollapsed) {
                sidebar.classList.remove('active');
                mainContainer.classList.remove('sidebar-open');
            } else {
                sidebar.classList.add('active');
                mainContainer.classList.add('sidebar-open');
            }
            updateBackdrop();
        } else {
            if (sidebarCollapsed) {
                sidebar.classList.add('collapsed');
                mainContainer.classList.add('sidebar-collapsed');
            } else {
                sidebar.classList.remove('collapsed');
                mainContainer.classList.remove('sidebar-collapsed');
            }
            if (backdrop) {
                backdrop.classList.remove('active');
                document.body.classList.remove('drawer-open');
            }
        }
    }

    // Adjust content height
    function updateContentHeight() {
        content.style.minHeight = `calc(100vh - ${headerHeight}px)`;
    }

    // Event listeners
    sidebarToggles.forEach(btn => {
        // make the toggle keyboard accessible
        btn.setAttribute('aria-controls', 'sidebar');
        btn.setAttribute('aria-expanded', String(!sidebarCollapsed));
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSidebar();
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSidebar();
            }
        });
    });

    // Close the chapter drawer when a chapter is chosen
    sidebar.querySelectorAll('a[data-target]').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobile()) {
                sidebarCollapsed = true;
                updateSidebar();
            }
        });
    });

    // Close both drawers when backdrop is tapped
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            if (isMobile()) {
                sidebarCollapsed = true;
                updateSidebar();
                closeNavbarDrawer();
            }
        });
    }

    // Hover effect for desktop
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

    // Close sidebar on Escape (mobile)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMobile() && !sidebarCollapsed) {
            sidebarCollapsed = true;
            updateSidebar();
            sidebarToggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
        }
    });

    // Click outside to close on mobile
    document.addEventListener('click', (e) => {
        if (!isMobile()) return;
        if (sidebarCollapsed) return; // already closed
        const target = e.target;
        if (!sidebar.contains(target) && !sidebarToggles.some(t => t.contains(target)) && !navbar?.contains(target) && !hamburger?.contains(target)) {
            sidebarCollapsed = true;
            updateSidebar();
            sidebarToggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
        }
    });

    // Handle resize
    function handleResize() {
        if (isMobile()) {
            if (!sidebarCollapsed) {
                sidebarCollapsed = true;
                updateSidebar();
            }
        } else {
            // Restore saved state on desktop
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState !== null) {
                sidebarCollapsed = savedState === 'true';
                updateSidebar();
            }
        }
        updateContentHeight();
    }

    window.addEventListener('resize', handleResize);

    // Initialize
    updateSidebar();
    updateContentHeight();
});
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.getElementById('sidebar');

    if (hamburger && sidebar) {
        // Core click execution block
        hamburger.addEventListener('click', (event) => {
            event.stopPropagation(); // Event bubble block logic
            
            // Current boolean check
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            
            // State synchronization
            hamburger.setAttribute('aria-expanded', !isExpanded);
            sidebar.classList.toggle('open', !isExpanded);
        });

        // Safe UX Logic: Sidebar ke bahar screen par kahin bhi click karne par auto-close system
        document.addEventListener('click', (event) => {
            if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
                hamburger.setAttribute('aria-expanded', 'false');
                sidebar.classList.remove('open');
            }
        });
    }
});