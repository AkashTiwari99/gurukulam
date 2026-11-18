// Content cache to avoid repeated fetches (bounded to prevent unbounded memory growth)
const MAX_CACHE_ENTRIES = 50;
const contentCache = new Map();

function cacheContent(url, html) {
    if (contentCache.has(url)) {
        contentCache.delete(url);
    } else if (contentCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = contentCache.keys().next().value;
        contentCache.delete(oldestKey);
    }
    contentCache.set(url, html);
}

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
            // Remove active class from all dynamic content links
            document.querySelectorAll('.sidebar a[data-target], .dropdown-menu a[data-target]').forEach(link => {
                link.classList.remove('active');
            });
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

    // Check cache first
    if (contentCache.has(url)) {
        const cached = contentCache.get(url);
        // Refresh recency in LRU order
        cacheContent(url, cached);
        runDOMUpdate(cached);
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

        // Parse html to extract only the actual content wrapper (.page)
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const pageContent = doc.querySelector('.page');
        const cleanData = pageContent ? pageContent.outerHTML : doc.body.innerHTML;

        // Cache the successful response (bounded to MAX_CACHE_ENTRIES)
        cacheContent(url, cleanData);

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

// Add event listeners only to dynamic-target links so normal Kanda navigation links work
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.sidebar a[data-target], .dropdown-menu a[data-target]').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const url = link.getAttribute('href');
            const targetElementId = link.getAttribute('data-target');

            if (!url || !targetElementId) {
                console.warn('Link missing href or data-target attribute');
                return;
            }

            loadContent(url, targetElementId, link);
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
    const currentPath = decodeURIComponent(window.location.pathname);

    if (dropdownMenu) {
        dropdownMenu.textContent = '';

        // Determine relative prefix based on current directory (works on localhost and GitHub Pages /gurukulam/Books/book_link/)
        let prefix = "";
        if (/\/books\/book_link\//i.test(currentPath)) {
            prefix = "";
        } else if (/\/books\//i.test(currentPath)) {
            prefix = "book_link/";
        } else {
            prefix = "./Books/book_link/";
        }

        const currentLower = currentPath.toLowerCase();
        kandaFiles.forEach(item => {
            const finalUrl = prefix + item.file;

            // Skip linking to the current page
            if (!currentLower.endsWith('/' + item.file.toLowerCase()) && !currentLower.endsWith(item.file.toLowerCase())) {
                const listItem = document.createElement("li");
                const anchor = document.createElement("a");
                anchor.setAttribute("href", finalUrl);
                anchor.textContent = item.name;
                listItem.appendChild(anchor);
                dropdownMenu.appendChild(listItem);
            }
        });
    }

    const dropdownToggle = document.querySelector('.kanda-dropdown-container .dropdown-toggle');
    const dropdown = dropdownToggle ? dropdownToggle.closest('.dropdown') : null;

    if (dropdownToggle && dropdown && !dropdownToggle.dataset.kandaDropdownBound) {
        dropdownToggle.dataset.kandaDropdownBound = 'true';

        const closeDropdown = () => {
            dropdown.classList.remove('open');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        };

        dropdownToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = dropdown.classList.toggle('open');
            dropdownToggle.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (dropdown.classList.contains('open') && !dropdown.contains(event.target)) {
                closeDropdown();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && dropdown.classList.contains('open')) {
                closeDropdown();
                dropdownToggle.focus();
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKandaDropdown);
} else {
    initKandaDropdown();
}

// dynamic-sidebar.js logic included
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const mainContainer = document.querySelector('.main-container');
    const sidebarToggle = document.getElementById('sidebarToggle') || document.querySelector('.sidebar-toggle');
    const header = document.querySelector('.header');

    if (!sidebar || !content || !sidebarToggle || !header || !mainContainer) return;

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

    // Toggle function
    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        updateSidebar();

        // Save state (only for desktop)
        if (!isMobile()) {
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
        }
    }

    // Update sidebar state
    function updateSidebar() {
        content.style.marginLeft = '0'; // Clear any direct content margin
        sidebar.classList.toggle('collapsed', sidebarCollapsed);
        sidebar.classList.toggle('active', !sidebarCollapsed);
        sidebarToggle.setAttribute('aria-expanded', String(!sidebarCollapsed));

        if (sidebarCollapsed) {
            mainContainer.style.marginLeft = getComputedStyle(document.documentElement)
                .getPropertyValue('--sidebar-collapsed-width');
        } else {
            mainContainer.style.marginLeft = getComputedStyle(document.documentElement)
                .getPropertyValue('--sidebar-width');
        }
    }

    // Adjust content height
    function updateContentHeight() {
        content.style.minHeight = `calc(100vh - ${headerHeight}px)`;
    }

    // Event listeners
    sidebarToggle.addEventListener('click', toggleSidebar);

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
