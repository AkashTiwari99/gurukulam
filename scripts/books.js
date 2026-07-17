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

    contentElement.innerHTML = '<div class="loader-container"><div class="loader"></div><p>Loading...</p></div>';
    contentElement.style.opacity = '0.5';

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, { signal: controller.signal });
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
        doc.querySelectorAll('.header, header, .sidebar, .main-container > .sidebar, .kanda-dropdown-container, .sidebar-toggle, #sidebarToggle, .chapter-sidebar-toggle, .footer, footer').forEach(el => el.remove());

        // Get ONLY the .page content
        let pageContent = doc.querySelector('.page');
        
        // If no .page found, try to get main content
        if (!pageContent) {
            pageContent = doc.querySelector('main .content, .content-area, #content');
        }
        
        // If still no content, get body but remove header, nav, sidebar
        if (!pageContent) {
            const bodyClone = doc.body.cloneNode(true);
            bodyClone.querySelectorAll('.header, header, .sidebar, nav, .kanda-dropdown-container, .sidebar-toggle, #sidebarToggle, .chapter-sidebar-toggle, .footer, footer').forEach(el => el.remove());
            pageContent = bodyClone;
        }

        const cleanData = pageContent ? pageContent.outerHTML : '<p>Content not found.</p>';

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

// Function to update sidebar title based on loaded content
function updateSidebarTitle(url) {
    const sidebarTitle = document.querySelector('.sidebar h1');
    if (!sidebarTitle) return;
    
    // Map URLs to Kanda names
    const kandaMap = {
        'Bala_Srga.html': 'बालकाण्डः',
        'Ay_Sarga.html': 'अयोध्याकाण्डः',
        'Ara_sarga.html': 'अरण्यकाण्डः',
        'KIs_Sraga.html': 'किष्किन्धाकाण्डः',
        'SU_Sraga.html': 'सुन्दरकाण्डः',
        'YU_Sarga.html': 'युद्धकाण्डः',
        'utt_sarga.html': 'उत्तरकाण्डः'
    };
    
    // Extract filename from URL
    const fileName = url.split('/').pop();
    const kandaName = kandaMap[fileName];
    
    if (kandaName) {
        sidebarTitle.textContent = kandaName;
    }
}

// Add event listeners to sidebar links AND dropdown links
document.addEventListener('DOMContentLoaded', function() {
    // Sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar a[data-target]');
    // Dropdown menu links (Kanda dropdown)
    const dropdownLinks = document.querySelectorAll('.dropdown-menu a[data-target], #kanda-dropdown-menu a[data-target]');
    // All links combined
    const allLinks = [...sidebarLinks, ...dropdownLinks];
    
    if (allLinks.length === 0) return;

    allLinks.forEach(link => {
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
            
            // Close dropdown after selection on mobile
            const dropdownMenu = document.querySelector('.kanda-dropdown-container .dropdown-menu');
            const dropdownToggle = document.querySelector('.kanda-dropdown-container .dropdown-toggle');
            if (dropdownMenu && window.innerWidth <= 992) {
                dropdownMenu.classList.remove('open');
                if (dropdownToggle) {
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                }
            }
            
            // Close sidebar on mobile
            if (window.innerWidth <= 992) {
                const sidebar = document.querySelector('.sidebar');
                const sidebarToggle = document.querySelector('.chapter-sidebar-toggle, #sidebarToggle, .sidebar-toggle');
                if (sidebar) {
                    sidebar.classList.remove('active');
                }
                if (sidebarToggle) {
                    sidebarToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
});

// Initialize Kanda dropdown with dynamic loading
function initKandaDropdown() {
    const kandaFiles = [
        { file: "Bala_Srga.html", name: "बालकाण्डः", chapters: 77 },
        { file: "Ay_Sarga.html", name: "अयोध्याकाण्डः", chapters: 119 },
        { file: "Ara_sarga.html", name: "अरण्यकाण्डः", chapters: 75 },
        { file: "KIs_Sraga.html", name: "किष्किन्धाकाण्डः", chapters: 67 },
        { file: "SU_Sraga.html", name: "सुन्दरकाण्डः", chapters: 68 },
        { file: "YU_Sarga.html", name: "युद्धकाण्डः", chapters: 131 },
        { file: "utt_sarga.html", name: "उत्तरकाण्डः", chapters: 111 }
    ];

    const dropdownMenu = document.getElementById("kanda-dropdown-menu");
    const currentPath = window.location.pathname;

    if (dropdownMenu) {
        dropdownMenu.innerHTML = '';

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

            // Don't show current page in dropdown
            if (!currentPath.endsWith(item.file)) {
                const listItem = document.createElement("li");
                const anchor = document.createElement("a");
                anchor.href = finalUrl;
                anchor.textContent = item.name;
                anchor.setAttribute('data-target', 'content');
                anchor.setAttribute('data-chapters', item.chapters);
                anchor.setAttribute('data-kanda', item.file);
                
                // Add click handler for loading content
                anchor.addEventListener('click', (event) => {
                    event.preventDefault();
                    
                    // Load the content dynamically
                    loadContent(finalUrl, 'content', anchor);
                    
                    // Close the dropdown
                    const dropdownMenu = document.querySelector('.kanda-dropdown-container .dropdown-menu');
                    const dropdownToggle = document.querySelector('.kanda-dropdown-container .dropdown-toggle');
                    if (dropdownMenu) {
                        dropdownMenu.classList.remove('open');
                        if (dropdownToggle) {
                            dropdownToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                    
                    // Update sidebar links based on the loaded Kanda
                    updateSidebarLinks(item.file, prefix, item.chapters);
                });
                
                listItem.appendChild(anchor);
                dropdownMenu.appendChild(listItem);
            }
        });
    }
}

// Function to update sidebar links when a Kanda is loaded
function updateSidebarLinks(kandaFile, prefix, totalChapters) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Get all existing sidebar links except the title
    const existingLinks = sidebar.querySelectorAll('a[data-target]');
    
    // Remove existing links (keep the title)
    existingLinks.forEach(link => link.remove());
    
    // Map of Kanda files to their chapter file naming patterns
    const kandaPatterns = {
        'Bala_Srga.html': { prefix: '../BALAKANDA/', pattern: 'sarga_1' },
        'Ay_Sarga.html': { prefix: '../AYODHYAKANDA/', pattern: 'Asarga_' },
        'Ara_sarga.html': { prefix: '../ARANAYKANDA/', pattern: 'Ar_sarga_' },
        'KIs_Sraga.html': { prefix: '../KISHKINDAKANDA/', pattern: 'ki_sarga_' },
        'SU_Sraga.html': { prefix: '../SUNDARAKANDA/', pattern: 'Su_sarga_' },
        'YU_Sarga.html': { prefix: '../YUDDHAKANDA/', pattern: 'Yu_sarga_' },
        'utt_sarga.html': { prefix: '../UTTARAKANDA/', pattern: 'utt_sarga_' }
    };
    
    const kandaInfo = kandaPatterns[kandaFile];
    if (!kandaInfo) return;
    
    // Update the sidebar title
    const titleElement = sidebar.querySelector('h1');
    if (titleElement) {
        const kandaNames = {
            'Bala_Srga.html': 'बालकाण्डः',
            'Ay_Sarga.html': 'अयोध्याकाण्डः',
            'Ara_sarga.html': 'अरण्यकाण्डः',
            'KIs_Sraga.html': 'किष्किन्धाकाण्डः',
            'SU_Sraga.html': 'सुन्दरकाण्डः',
            'YU_Sarga.html': 'युद्धकाण्डः',
            'utt_sarga.html': 'उत्तरकाण्डः'
        };
        titleElement.textContent = kandaNames[kandaFile] || 'बालकाण्डः';
        titleElement.textContent = kandaNames[kandaFile] || 'अयोध्याकाण्डः';
        titleElement.textContent = kandaNames[kandaFile] || 'अरण्यकाण्डः';
        titleElement.textContent = kandaNames[kandaFile] || 'किष्किन्धाकाण्डः';
        titleElement.textContent = kandaNames[kandaFile] || 'सुन्दरकाण्डः';
        titleElement.textContent = kandaNames[kandaFile] || 'युद्धकाण्डः';
        titleElement.textContent = kandaNames[kandaFile] || 'उत्तरकाण्डः';
    }
    
    // Generate chapter links
    const basePrefix = kandaInfo.prefix;
    const pattern = kandaInfo.pattern;
    
    // Add chapter links
    for (let i = 1; i <= totalChapters; i++) {
        const chapterFileName = `${pattern}${i}.html`;
        const chapterUrl = basePrefix + chapterFileName;
        
        const link = document.createElement('a');
        link.href = chapterUrl;
        link.textContent = `सर्गः ${i}`;
        link.setAttribute('data-target', 'content');
        
        // Add click handler for chapter loading
        link.addEventListener('click', (event) => {
            event.preventDefault();
            loadContent(chapterUrl, 'content', link);
            
            // Close sidebar on mobile
            if (window.innerWidth <= 992) {
                const sidebar = document.querySelector('.sidebar');
                const sidebarToggle = document.querySelector('.chapter-sidebar-toggle, #sidebarToggle, .sidebar-toggle');
                if (sidebar) {
                    sidebar.classList.remove('active');
                }
                if (sidebarToggle) {
                    sidebarToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
        
        sidebar.appendChild(link);
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

    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        updateSidebar();

        sidebarToggles.forEach(t => t.setAttribute('aria-expanded', String(!sidebarCollapsed)));

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

    // Close sidebar on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isMobile() && !sidebarCollapsed) {
                sidebarCollapsed = true;
                updateSidebar();
                sidebarToggles.forEach(t => t.setAttribute('aria-expanded', 'false'));
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
        const isInsideBackdrop = backdrop && backdrop.contains(target);

        if (isInsideBackdrop) return;

        if (!sidebarCollapsed && !isInsideSidebar && !isToggle) {
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
});