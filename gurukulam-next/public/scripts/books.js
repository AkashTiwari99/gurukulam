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

    // Check cache first
    if (contentCache.has(url)) {
        runDOMUpdate(contentCache.get(url));
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
        
        // Cache the successful response
        contentCache.set(url, cleanData);
        
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

// Add event listeners to all links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.sidebar a, .dropdown-menu a').forEach(link => {
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
    const currentPath = window.location.pathname;

    if (dropdownMenu) {
        dropdownMenu.innerHTML = ''; // Clear existing items

        // Determine the prefix based on current location
        let prefix = "";
        if (currentPath.includes("/Books/book_link/")) {
            // We are already inside the directory, so just link to the file
            prefix = "";
        } else if (currentPath.includes("/Books/")) {
            // We are in Books/ but not book_link/ (unlikely given structure, but safe)
            prefix = "book_link/";
        } else {
            // We are likely at root or elsewhere
            prefix = "./Books/book_link/";
        }

        kandaFiles.forEach(item => {
            const finalUrl = prefix + item.file;

            // Check if this is the current page to avoid linking to self (optional, but good UX)
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

// Call the function to initialize the dropdown
initKandaDropdown();

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
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            mainContainer.style.marginLeft = getComputedStyle(document.documentElement)
                .getPropertyValue('--sidebar-collapsed-width');
        } else {
            sidebar.classList.remove('collapsed');
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