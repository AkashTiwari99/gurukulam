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
async function loadContent(url, targetElementId, linkElement, isResumed = false) {
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
            // Add active class to the clicked link or find by URL
            let activeLink = linkElement;
            if (!activeLink) {
                const fileName = url.split('/').pop();
                activeLink = document.querySelector(`.sidebar a[href$="${fileName}"]`);
            }
            if (activeLink) {
                activeLink.classList.add('active');
                if (typeof activeLink.scrollIntoView === 'function') {
                    activeLink.scrollIntoView({ block: 'nearest' });
                }
            }

            // Update sidebar title based on the loaded content
            updateSidebarTitle(url);

            // Enhance reader content with toolbar, nav buttons, and bookmarks
            enhanceReaderView(url, isResumed);
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

        // Cache the successful response (bounded to 50 entries to prevent unbounded growth)
        if (contentCache.size >= 50) {
            contentCache.delete(contentCache.keys().next().value);
        }
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
                <svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1.5em" height="1.5em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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

    // Ensure chapter search box exists
    initChapterSearch(sidebar);

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
        link.setAttribute('data-chapter', String(i));

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

    const searchInput = sidebar.querySelector('#chapter-search');
    if (searchInput) searchInput.value = '';

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
        link.setAttribute('data-chapter', String(i));

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
    const dropdownContainer = document.querySelector('.kanda-dropdown-container');
    const dropdown = dropdownContainer ? dropdownContainer.querySelector('.dropdown') : null;
    const dropdownToggle = dropdownContainer ? dropdownContainer.querySelector('.dropdown-toggle') : null;
    const dropdownMenu = dropdownContainer ? dropdownContainer.querySelector('.dropdown-menu') : null;

    if (!dropdownToggle || !dropdownMenu) return;

    const setDropdownState = (isOpen) => {
        dropdownMenu.classList.toggle('open', isOpen);
        if (dropdown) {
            dropdown.classList.toggle('open', isOpen);
        }
        dropdownToggle.setAttribute('aria-expanded', String(isOpen));
    };

    dropdownToggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !dropdownMenu.classList.contains('open');
        setDropdownState(willOpen);
    });

    document.addEventListener('click', (event) => {
        if (dropdownContainer && !dropdownContainer.contains(event.target)) {
            setDropdownState(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dropdownMenu.classList.contains('open')) {
            setDropdownState(false);
            dropdownToggle.focus();
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
// Reader Enhancement Controller: Font Scaling, Bookmarks, Navigation
// ============================================================

let currentFontScale = 1.0;
try {
    const savedScale = localStorage.getItem('gurukulam_font_scale');
    if (savedScale) {
        currentFontScale = parseFloat(savedScale) || 1.0;
    }
} catch (e) {}

function toAsciiDigits(str) {
    const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(str || '').replace(/[०-९]/g, d => devanagariDigits.indexOf(d));
}

function initChapterSearch(sidebar) {
    let searchContainer = sidebar.querySelector('.chapter-search-container');
    const chapterList = sidebar.querySelector('#chapter-list') || sidebar;

    if (!searchContainer) {
        searchContainer = document.createElement('div');
        searchContainer.className = 'chapter-search-container';
        searchContainer.innerHTML = `
            <svg class="search-icon" aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="search" id="chapter-search" placeholder="सर्ग खोजें (उदा. 15)..." aria-label="सर्ग खोजें" autocomplete="off">
            <button type="button" class="search-clear-btn" aria-label="खोज साफ़ करें">&times;</button>
        `;
        const listEl = sidebar.querySelector('#chapter-list');
        if (listEl) {
            sidebar.insertBefore(searchContainer, listEl);
        } else {
            sidebar.appendChild(searchContainer);
        }
    }

    const searchInput = searchContainer.querySelector('#chapter-search');
    const clearBtn = searchContainer.querySelector('.search-clear-btn');
    if (!searchInput) return;

    function filterChapters() {
        const rawQuery = searchInput.value.trim();
        const normQuery = toAsciiDigits(rawQuery).toLowerCase();
        if (clearBtn) {
            clearBtn.style.display = rawQuery ? 'block' : 'none';
        }

        const links = chapterList.querySelectorAll('a[data-target]');
        let matchCount = 0;

        links.forEach(link => {
            const chapterNum = link.getAttribute('data-chapter') || '';
            const text = toAsciiDigits(link.textContent).toLowerCase();
            const matches = !normQuery || text.includes(normQuery) || chapterNum === normQuery;
            link.style.display = matches ? '' : 'none';
            if (matches) matchCount++;
        });

        let noResultEl = chapterList.querySelector('.no-chapters-found');
        if (matchCount === 0 && normQuery) {
            if (!noResultEl) {
                noResultEl = document.createElement('div');
                noResultEl.className = 'no-chapters-found';
                noResultEl.textContent = 'कोई सर्ग नहीं मिला';
                chapterList.appendChild(noResultEl);
            }
        } else if (noResultEl) {
            noResultEl.remove();
        }
    }

    if (!searchInput.dataset.initialized) {
        searchInput.dataset.initialized = 'true';
        searchInput.addEventListener('input', filterChapters);

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                filterChapters();
                searchInput.focus();
            });
        }

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                filterChapters();
            } else if (e.key === 'Enter') {
                const firstVisible = chapterList.querySelector('a[data-target]:not([style*="display: none"])');
                if (firstVisible) {
                    firstVisible.click();
                    searchInput.blur();
                }
            }
        });
    }
}

function applyFontScale(scale) {
    currentFontScale = Math.min(1.5, Math.max(0.85, Math.round(scale * 100) / 100));
    const contentElement = document.getElementById('content');
    if (contentElement) {
        contentElement.style.setProperty('--reader-scale', String(currentFontScale));
    }
    document.querySelectorAll('.font-size-indicator').forEach(ind => {
        ind.textContent = `${Math.round(currentFontScale * 100)}%`;
    });
    try {
        localStorage.setItem('gurukulam_font_scale', String(currentFontScale));
    } catch (e) {}
}

function getBookmarkedVerses() {
    try {
        const stored = localStorage.getItem('gurukulam_bookmarked_verses');
        return new Set(stored ? JSON.parse(stored) : []);
    } catch (e) {
        return new Set();
    }
}

function toggleVerseBookmark(verseId) {
    const set = getBookmarkedVerses();
    let isAdded = false;
    if (set.has(verseId)) {
        set.delete(verseId);
    } else {
        set.add(verseId);
        isAdded = true;
    }
    try {
        localStorage.setItem('gurukulam_bookmarked_verses', JSON.stringify([...set]));
    } catch (e) {}
    return isAdded;
}

function applyBookmarkFilter(contentElement, filterActive) {
    const verses = contentElement.querySelectorAll('.verse');
    let bookmarkedCount = 0;

    verses.forEach(v => {
        if (filterActive) {
            const isBm = v.classList.contains('bookmarked');
            v.style.display = isBm ? '' : 'none';
            if (isBm) bookmarkedCount++;
        } else {
            v.style.display = '';
        }
    });

    let msg = contentElement.querySelector('.no-bookmarks-msg');
    if (filterActive && bookmarkedCount === 0) {
        if (!msg) {
            msg = document.createElement('div');
            msg.className = 'no-bookmarks-msg';
            msg.textContent = 'इस सर्ग में कोई बुकमार्क किया गया श्लोक नहीं है। किसी श्लोक को बुकमार्क करने के लिए उसके दाहिने ओर बने सितारे पर क्लिक करें।';
            const page = contentElement.querySelector('.page');
            if (page) page.appendChild(msg);
        }
    } else if (msg) {
        msg.remove();
    }
}

function renderReaderToolbar(contentElement) {
    let toolbar = contentElement.querySelector('.reader-toolbar');
    if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.className = 'reader-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Reader tools');
        toolbar.innerHTML = `
            <div class="reader-tool-group font-controls">
                <span class="tool-label">फ़ॉन्ट आकार:</span>
                <button type="button" class="btn-reader-tool font-dec" title="छोटा आकार" aria-label="फ़ॉन्ट आकार छोटा करें">A−</button>
                <button type="button" class="btn-reader-tool font-reset" title="सामान्य आकार" aria-label="सामान्य फ़ॉन्ट आकार">A</button>
                <button type="button" class="btn-reader-tool font-inc" title="बड़ा आकार" aria-label="फ़ॉन्ट आकार बड़ा करें">A+</button>
                <span class="font-size-indicator" aria-live="polite">${Math.round(currentFontScale * 100)}%</span>
            </div>
            <div class="reader-tool-group bookmark-controls">
                <button type="button" class="btn-reader-tool bookmark-filter" id="toggleBookmarksFilter" title="केवल बुकमार्क दिखाएं" aria-pressed="false">
                    <svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span>बुकमार्क</span>
                </button>
            </div>
        `;
        contentElement.insertBefore(toolbar, contentElement.firstChild);

        toolbar.querySelector('.font-dec').addEventListener('click', () => applyFontScale(currentFontScale - 0.1));
        toolbar.querySelector('.font-reset').addEventListener('click', () => applyFontScale(1.0));
        toolbar.querySelector('.font-inc').addEventListener('click', () => applyFontScale(currentFontScale + 0.1));

        const filterBtn = toolbar.querySelector('#toggleBookmarksFilter');
        filterBtn.addEventListener('click', () => {
            const willBeActive = filterBtn.getAttribute('aria-pressed') !== 'true';
            filterBtn.setAttribute('aria-pressed', String(willBeActive));
            filterBtn.classList.toggle('active', willBeActive);
            applyBookmarkFilter(contentElement, willBeActive);
        });
    } else {
        const ind = toolbar.querySelector('.font-size-indicator');
        if (ind) ind.textContent = `${Math.round(currentFontScale * 100)}%`;
        const filterBtn = toolbar.querySelector('#toggleBookmarksFilter');
        if (filterBtn && filterBtn.getAttribute('aria-pressed') === 'true') {
            applyBookmarkFilter(contentElement, true);
        }
    }
}

function renderChapterNavFooter(pageElement, url) {
    let navFooter = pageElement.querySelector('.chapter-nav-footer');
    if (navFooter) navFooter.remove();

    const currentKanda = getCurrentKandaFile();
    const kandaInfo = getKandaInfo(currentKanda);
    if (!kandaInfo) return;

    const totalChapters = kandaInfo.chapters || getChapterCount(currentKanda);
    const fileName = url.split('/').pop();
    const match = fileName.match(/(\d+)\.html/);
    const currentChapter = match ? parseInt(match[1], 10) : 1;

    const hasPrev = currentChapter > 1;
    const hasNext = currentChapter < totalChapters;

    navFooter = document.createElement('nav');
    navFooter.className = 'chapter-nav-footer';
    navFooter.setAttribute('aria-label', 'Sarga navigation');
    navFooter.innerHTML = `
        <button type="button" class="btn-sarga-nav prev" ${hasPrev ? '' : 'disabled'} aria-label="Previous Sarga">
            <svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>पूर्व सर्गः</span>
        </button>
        <span class="sarga-nav-info">सर्गः ${currentChapter} / ${totalChapters}</span>
        <button type="button" class="btn-sarga-nav next" ${hasNext ? '' : 'disabled'} aria-label="Next Sarga">
            <span>अग्रिम सर्गः</span>
            <svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
    `;

    if (hasPrev) {
        navFooter.querySelector('.prev').addEventListener('click', () => {
            const prevChapter = currentChapter - 1;
            const prevUrl = `${kandaInfo.prefix}${kandaInfo.pattern}${prevChapter}.html`;
            loadContent(prevUrl, 'content', null);
            const contentEl = document.getElementById('content');
            if (contentEl) contentEl.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (hasNext) {
        navFooter.querySelector('.next').addEventListener('click', () => {
            const nextChapter = currentChapter + 1;
            const nextUrl = `${kandaInfo.prefix}${kandaInfo.pattern}${nextChapter}.html`;
            loadContent(nextUrl, 'content', null);
            const contentEl = document.getElementById('content');
            if (contentEl) contentEl.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    pageElement.appendChild(navFooter);
}

function attachVerseBookmarks(contentElement) {
    const bookmarks = getBookmarkedVerses();
    const verses = contentElement.querySelectorAll('.verse');

    verses.forEach((verse, idx) => {
        let verseId = verse.id;
        if (!verseId) {
            verseId = `v_${idx + 1}`;
            verse.id = verseId;
        }

        const isBookmarked = bookmarks.has(verseId);
        verse.classList.toggle('bookmarked', isBookmarked);

        let bookmarkBtn = verse.querySelector('.verse-bookmark-btn');
        if (!bookmarkBtn) {
            bookmarkBtn = document.createElement('button');
            bookmarkBtn.type = 'button';
            bookmarkBtn.className = 'verse-bookmark-btn' + (isBookmarked ? ' active' : '');
            bookmarkBtn.setAttribute('title', isBookmarked ? 'बुकमार्क हटाएं' : 'श्लोक बुकमार्क करें');
            bookmarkBtn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Bookmark verse');
            bookmarkBtn.setAttribute('data-verse-id', verseId);
            bookmarkBtn.innerHTML = `
                <svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            `;

            bookmarkBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const active = toggleVerseBookmark(verseId);
                bookmarkBtn.classList.toggle('active', active);
                verse.classList.toggle('bookmarked', active);
                bookmarkBtn.setAttribute('title', active ? 'बुकमार्क हटाएं' : 'श्लोक बुकमार्क करें');
                bookmarkBtn.setAttribute('aria-label', active ? 'Remove bookmark' : 'Bookmark verse');

                const filterBtn = document.getElementById('toggleBookmarksFilter');
                if (filterBtn && filterBtn.getAttribute('aria-pressed') === 'true') {
                    applyBookmarkFilter(contentElement, true);
                }
            });

            verse.appendChild(bookmarkBtn);
        } else {
            bookmarkBtn.classList.toggle('active', isBookmarked);
            bookmarkBtn.setAttribute('title', isBookmarked ? 'बुकमार्क हटाएं' : 'श्लोक बुकमार्क करें');
            bookmarkBtn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Bookmark verse');
        }
    });
}

function saveLastReadSarga(url) {
    const currentKanda = getCurrentKandaFile();
    try {
        localStorage.setItem(`gurukulam_last_sarga_${currentKanda}`, url);
    } catch (e) {}
}

function showResumeBanner(contentElement) {
    let banner = contentElement.querySelector('.resume-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.className = 'resume-banner';
        banner.setAttribute('role', 'status');
        banner.innerHTML = `
            <div class="resume-text">
                <svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                <span>पिछला पढ़ा हुआ सर्ग स्वतः लोड किया गया।</span>
            </div>
            <button type="button" class="resume-close" aria-label="Dismiss">&times;</button>
        `;
        banner.querySelector('.resume-close').addEventListener('click', () => banner.remove());
        const toolbar = contentElement.querySelector('.reader-toolbar');
        if (toolbar && toolbar.nextSibling) {
            contentElement.insertBefore(banner, toolbar.nextSibling);
        } else {
            contentElement.insertBefore(banner, contentElement.firstChild);
        }
        setTimeout(() => {
            if (banner && banner.parentNode) {
                banner.remove();
            }
        }, 5000);
    }
}

function enhanceReaderView(url, isResumed = false) {
    const contentElement = document.getElementById('content');
    if (!contentElement) return;

    applyFontScale(currentFontScale);
    renderReaderToolbar(contentElement);

    const pageElement = contentElement.querySelector('.page');
    if (pageElement) {
        renderChapterNavFooter(pageElement, url);
        attachVerseBookmarks(contentElement);
    }

    if (isResumed) {
        showResumeBanner(contentElement);
    }

    saveLastReadSarga(url);
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

    initChapterListDelegation();

    // Initialize Kanda dropdown after the menu is populated
    initKandaDropdown();
    initKandaDropdownToggle();

    // Auto-load chapter (resume previous or load first)
    const contentElement = document.getElementById('content');
    if (contentElement) {
        const hasChapterContent = contentElement.querySelector('.page, .error-message, .loader-container');
        if (!hasChapterContent) {
            const currentKanda = getCurrentKandaFile();
            const kandaInfo = getKandaInfo(currentKanda);
            const firstChapterUrl = kandaInfo.prefix + kandaInfo.pattern + '1.html';

            let targetUrl = firstChapterUrl;
            let isResumed = false;

            try {
                const savedUrl = localStorage.getItem(`gurukulam_last_sarga_${currentKanda}`);
                if (savedUrl) {
                    targetUrl = savedUrl;
                    if (savedUrl !== firstChapterUrl) {
                        isResumed = true;
                    }
                }
            } catch (e) {}

            loadContent(targetUrl, 'content', null, isResumed);
        }
    }

    // Initialize Sidebar Controller
    initSidebarController();
});