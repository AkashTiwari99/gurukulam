// ============================================================
// books.js - Dynamic Book Content Loader & Sidebar Manager
// Depends on scripts/constants.js (loaded first) for KANDA_DATA
// ============================================================

// Content cache to avoid repeated fetches
const contentCache = new Map();
// Track active AbortController to cancel stale requests
let activeFetchController = null;

// Shared breakpoint used for mobile drawer behavior
const MOBILE_DRAWER_BREAKPOINT = 1024;
const MOBILE_DRAWER_MEDIA_QUERY = `(max-width: ${MOBILE_DRAWER_BREAKPOINT}px)`;
let mobileDrawerControllerClose = null;

// ============================================================
// Function to load content dynamically
// ============================================================
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
            // Remove active class from all sidebar links and dropdown links
            document.querySelectorAll('.sidebar a, .dropdown-menu a, #kanda-dropdown-menu a').forEach(link => {
                link.classList.remove('active');
            });
            // Add active class to the clicked link
            if (linkElement) {
                linkElement.classList.add('active');
            }

            // Update sidebar title based on the loaded content
            updateSidebarTitle(url);
        }
    };

    const runDOMUpdate = (htmlContent, isError = false) => {
        if (document.startViewTransition) {
            document.startViewTransition(() => updateDOM(htmlContent, isError));
        } else {
            updateDOM(htmlContent, isError);
        }
    };

    // Resolve the URL relative to the current location
    let resolvedUrl;
    try {
        resolvedUrl = new URL(url, window.location.href).href;
    } catch (e) {
        resolvedUrl = url;
    }

    // Check cache first
    if (contentCache.has(resolvedUrl)) {
        runDOMUpdate(contentCache.get(resolvedUrl));
        return;
    }

    // Show loading state
    contentElement.innerHTML = '<div class="loader-container"><div class="loader"></div><p>Loading...</p></div>';
    contentElement.style.opacity = '0.5';

    // Cancel any previous in-flight request
    if (activeFetchController) {
        activeFetchController.abort();
    }

    const controller = new AbortController();
    activeFetchController = controller;

    try {
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, { signal: controller.signal });

        // If this request was superseded, bail out silently
        if (activeFetchController !== controller) {
            return;
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        const data = await response.text();

        // Parse html to extract ONLY the content wrapper (.page)
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');

        // Remove ALL script tags
        doc.querySelectorAll('script').forEach(s => s.remove());

        // Remove header, navbar, sidebar from loaded content
        const removeSelectors = '.header, header, .sidebar, .main-container > .sidebar, ' +
            '.kanda-dropdown-container, .sidebar-toggle, #sidebarToggle, ' +
            '.chapter-sidebar-toggle, .footer, footer';
        doc.querySelectorAll(removeSelectors).forEach(el => el.remove());

        // Get ONLY the .page content
        let pageContent = doc.querySelector('.page');

        // If no .page found, try to get main content
        if (!pageContent) {
            pageContent = doc.querySelector('main .content, .content-area, #content');
        }

        // If still no content, get body but remove header, nav, sidebar
        if (!pageContent) {
            const bodyClone = doc.body.cloneNode(true);
            bodyClone.querySelectorAll(removeSelectors + ', nav').forEach(el => el.remove());
            pageContent = bodyClone;
        }

        const cleanData = pageContent ? pageContent.outerHTML : '<p>Content not found.</p>';

        // Cache the successful response
        contentCache.set(resolvedUrl, cleanData);

        // If this request was superseded, bail out
        if (activeFetchController !== controller) {
            return;
        }

        runDOMUpdate(cleanData);
    } catch (error) {
        // If this request was superseded, bail out silently
        if (activeFetchController !== controller) {
            return;
        }

        console.error('Content loading error:', error);

        let errorMessage = 'Unable to load content. ';
        if (error.name === 'AbortError') {
            errorMessage += 'The request took too long or was cancelled. Please check your connection and try again.';
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
    } finally {
        if (activeFetchController === controller) {
            activeFetchController = null;
        }
    }
}

// ============================================================
// Function to update sidebar title based on loaded content URL
// ============================================================
function updateSidebarTitle(url) {
    const sidebarTitle = document.querySelector('.sidebar h1');
    if (!sidebarTitle) return;

    const fileName = url.split('/').pop();
    const isKandaPage = KANDA_FILES.includes(fileName);
    const kandaName = isKandaPage ? getKandaName(fileName) : getKandaName(getCurrentKandaFile());

    sidebarTitle.textContent = kandaName;
}

function closeMobileSidebar() {
    if (typeof mobileDrawerControllerClose === 'function') {
        mobileDrawerControllerClose();
        return;
    }

    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    const toggles = Array.from(document.querySelectorAll('.chapter-sidebar-toggle, #sidebarToggle, .sidebar-toggle'));
    const mainContainer = document.querySelector('.main-container');

    if (sidebar) {
        sidebar.classList.remove('active');
    }
    if (backdrop) {
        backdrop.classList.remove('active');
    }
    if (mainContainer) {
        mainContainer.classList.remove('sidebar-open');
    }
    toggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'false'));
    document.body.classList.remove('drawer-open');
}

// ============================================================
// Function to initialize sidebar with current Kanda chapters
// ============================================================
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const currentKanda = getCurrentKandaFile();
    const chapterCount = getChapterCount(currentKanda);
    const kandaInfo = getKandaInfo(currentKanda);

    // Update title
    const titleElement = sidebar.querySelector('h1');
    if (titleElement) {
        titleElement.textContent = getKandaName(currentKanda);
    }

    // Remove existing links
    const existingLinks = sidebar.querySelectorAll('a[data-target]');
    existingLinks.forEach(link => link.remove());

    const chapterList = sidebar.querySelector('#chapter-list') || sidebar;

    // Generate chapter links
    const basePrefix = kandaInfo.prefix;
    const pattern = kandaInfo.pattern;

    for (let i = 1; i <= chapterCount; i++) {
        const chapterFileName = `${pattern}${i}.html`;
        const chapterUrl = basePrefix + chapterFileName;

        const link = document.createElement('a');
        link.href = chapterUrl;
        link.textContent = `सर्गः ${i}`;
        link.setAttribute('data-target', 'content');

        chapterList.appendChild(link);
    }
}

// ============================================================
// Initialize Kanda dropdown with dynamic loading
// ============================================================
function initKandaDropdown() {
    const dropdownMenu = document.getElementById('kanda-dropdown-menu');
    const currentPath = window.location.pathname;

    if (dropdownMenu) {
        dropdownMenu.innerHTML = '';

        // Determine the prefix based on current location
        let prefix = '';
        if (currentPath.includes('/Books/book_link/')) {
            prefix = '';
        } else if (currentPath.includes('/Books/')) {
            prefix = 'book_link/';
        } else {
            prefix = './Books/book_link/';
        }

        KANDA_DATA.forEach(item => {
            const finalUrl = prefix + item.file;

            // Don't show current page in dropdown
            if (!currentPath.endsWith(item.file)) {
                const listItem = document.createElement('li');
                const anchor = document.createElement('a');
                anchor.href = finalUrl;
                anchor.textContent = item.name;
                anchor.setAttribute('data-target', 'content');
                anchor.setAttribute('data-chapters', item.chapters);
                anchor.setAttribute('data-kanda', item.file);

                // Add click handler - navigate to the Kanda page
                anchor.addEventListener('click', (event) => {
                    event.preventDefault();
                    // Navigate to the Kanda page
                    window.location.href = finalUrl;
                });

                listItem.appendChild(anchor);
                dropdownMenu.appendChild(listItem);
            }
        });
    }
}

// ============================================================
// Function to update sidebar links when a Kanda is loaded
// ============================================================
function updateSidebarLinks(kandaFile, prefix, totalChapters) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Get all existing sidebar links except the title
    const existingLinks = sidebar.querySelectorAll('a[data-target]');

    // Remove existing links (keep the title)
    existingLinks.forEach(link => link.remove());

    const kandaInfo = getKandaInfo(kandaFile);
    if (!kandaInfo) return;

    // Update the sidebar title
    const titleElement = sidebar.querySelector('h1');
    if (titleElement) {
        titleElement.textContent = getKandaName(kandaFile);
    }

    const chapterList = sidebar.querySelector('#chapter-list') || sidebar;

    // Generate chapter links
    const basePrefix = kandaInfo.prefix;
    const pattern = kandaInfo.pattern;

    for (let i = 1; i <= totalChapters; i++) {
        const chapterFileName = `${pattern}${i}.html`;
        const chapterUrl = basePrefix + chapterFileName;

        const link = document.createElement('a');
        link.href = chapterUrl;
        link.textContent = `सर्गः ${i}`;
        link.setAttribute('data-target', 'content');

        chapterList.appendChild(link);
    }
}

function initChapterListDelegation() {
    const chapterList = document.getElementById('chapter-list') || document.querySelector('.sidebar');
    if (!chapterList) return;

    chapterList.addEventListener('click', (event) => {
        const anchor = event.target.closest('a[data-target]');
        if (!anchor || !chapterList.contains(anchor)) return;

        event.preventDefault();

        const url = anchor.getAttribute('href');
        const targetElementId = anchor.getAttribute('data-target');
        if (!url || !targetElementId) return;

        let resolvedUrl;
        try {
            resolvedUrl = new URL(url, window.location.href).href;
        } catch (e) {
            resolvedUrl = url;
        }

        loadContent(resolvedUrl, targetElementId, anchor);

        document.querySelectorAll('.sidebar a[data-target]').forEach(link => link.classList.remove('active'));
        anchor.classList.add('active');

        if (window.matchMedia(MOBILE_DRAWER_MEDIA_QUERY).matches) {
            closeMobileSidebar();
        }
    });
}

// ============================================================
// Kanda Dropdown Toggle
// ============================================================
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

    document.addEventListener('click', (event) => {
        const container = document.querySelector('.kanda-dropdown-container');
        if (container && !container.contains(event.target)) {
            dropdownMenu.classList.remove('open');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            dropdownMenu.classList.remove('open');
            dropdownToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// ============================================================
// Sidebar Controller - Handles sidebar toggle and interaction
// ============================================================
function initSidebarController() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const mainContainer = document.querySelector('.main-container');
    const sidebarToggles = Array.from(document.querySelectorAll('.chapter-sidebar-toggle, #sidebarToggle, .sidebar-toggle'));
    const header = document.querySelector('.header');
    const backdrop = document.getElementById('mobileDrawerBackdrop');

    if (!sidebar || !content || !header || !mainContainer) return;

    // Get header height
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);

    // Mobile detection
    function isMobile() {
        return window.matchMedia(MOBILE_DRAWER_MEDIA_QUERY).matches;
    }

    // Initialize sidebar state
    let sidebarCollapsed = isMobile();

    if (!isMobile()) {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            sidebarCollapsed = savedState === 'true';
        }
    }

    function updateBackdrop() {
        if (!backdrop) return;
        const isSidebarOpen = !sidebarCollapsed && isMobile();
        const anyOpen = isSidebarOpen;

        backdrop.classList.toggle('active', anyOpen);
        document.body.classList.toggle('drawer-open', anyOpen);
    }

    function closeSidebarController() {
        if (!sidebarCollapsed) {
            sidebarCollapsed = true;
            updateSidebar();
            sidebarToggles.forEach(t => {
                t.setAttribute('aria-expanded', 'false');
                t.classList.remove('active');
            });
        }
        updateBackdrop();
    }

    mobileDrawerControllerClose = closeSidebarController;

    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        updateSidebar();

        sidebarToggles.forEach(t => {
            t.setAttribute('aria-expanded', String(!sidebarCollapsed));
            t.classList.toggle('active', !sidebarCollapsed);
        });

        if (!isMobile()) {
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
        }

        if (!sidebarCollapsed && isMobile()) {
            const firstLink = sidebar.querySelector('a');
            if (firstLink) firstLink.focus();
        }

        updateBackdrop();
    }

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

    function updateContentHeight() {
        const hHeight = header.offsetHeight;
        content.style.minHeight = `calc(100vh - ${hHeight}px)`;
        document.documentElement.style.setProperty('--header-height', `${hHeight}px`);
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

    // Close drawers when backdrop is clicked
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            if (isMobile()) {
                closeSidebarController();
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

    // Close sidebar on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isMobile()) {
                closeSidebarController();
            }
        }
    });

    // Click outside to close on mobile
    document.addEventListener('click', (e) => {
        if (!isMobile()) return;

        const target = e.target;
        const isInsideSidebar = sidebar.contains(target);
        const isToggle = sidebarToggles.some(t => t.contains(target));
        const isInsideBackdrop = backdrop && backdrop.contains(target);

        if (isInsideBackdrop) return;

        if (!sidebarCollapsed && !isInsideSidebar && !isToggle) {
            closeSidebarController();
        }
    });

    // Handle window resize
    let resizeTimeout;
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (isMobile()) {
                closeSidebarController();
            } else {
                const savedState = localStorage.getItem('sidebarCollapsed');
                if (savedState !== null) {
                    sidebarCollapsed = savedState === 'true';
                    updateSidebar();
                }
            }
            updateContentHeight();
        }, 250);
    }

    window.addEventListener('resize', handleResize);

    // Initialize
    updateSidebar();
    updateContentHeight();
}

// ============================================================
// Add event listeners to sidebar links AND dropdown links
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    // First ensure constants are available
    if (typeof KANDA_DATA === 'undefined') {
        console.error('constants.js must be loaded before books.js');
        return;
    }

    // Initialize sidebar with current Kanda
    initSidebar();

    // Dropdown menu links (Kanda dropdown)
    const dropdownLinks = document.querySelectorAll('.kanda-dropdown-container .dropdown-menu a[data-target], #kanda-dropdown-menu a[data-target]');

    if (dropdownLinks.length > 0) {
        dropdownLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const url = link.getAttribute('href');
                const targetElementId = link.getAttribute('data-target');

                if (!url || !targetElementId) {
                    console.warn('Link missing href or data-target attribute');
                    return;
                }

                let resolvedUrl;
                try {
                    resolvedUrl = new URL(url, window.location.href).href;
                } catch (e) {
                    resolvedUrl = url;
                }

                loadContent(resolvedUrl, targetElementId, link);

                const dropdownMenu = document.querySelector('.kanda-dropdown-container .dropdown-menu');
                const dropdownToggle = document.querySelector('.kanda-dropdown-container .dropdown-toggle');
                if (dropdownMenu && window.matchMedia(MOBILE_DRAWER_MEDIA_QUERY).matches) {
                    dropdownMenu.classList.remove('open');
                    if (dropdownToggle) {
                        dropdownToggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    }

    initChapterListDelegation();

    // Auto-load first chapter if no content loaded
    const contentElement = document.getElementById('content');
    if (contentElement) {
        const hasChapterContent = contentElement.querySelector('.page, .error-message, .loader-container');
        if (!hasChapterContent) {
            const currentKanda = getCurrentKandaFile();
            const kandaInfo = getKandaInfo(currentKanda);
            const firstChapterUrl = kandaInfo.prefix + kandaInfo.pattern + '1.html';

            // Load first chapter
            loadContent(firstChapterUrl, 'content', null);
        }
    }

    // Initialize Kanda dropdown & toggle
    initKandaDropdown();
    initKandaDropdownToggle();

    // Initialize Sidebar Controller
    initSidebarController();
});