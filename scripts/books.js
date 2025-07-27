// Function to load content dynamically with enhanced error handling
async function loadContent(url, targetElementId, linkElement) {
    const contentElement = document.getElementById(targetElementId);
    if (!contentElement) return;

    // Show loading state
    contentElement.innerHTML = `
        <div class="loader-container" style="
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 60vh;
        ">
            <div class="loader" style="
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            "></div>
        </div>
    `;
    contentElement.style.opacity = '0.8';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        
        // Success - insert content
        contentElement.innerHTML = data;
        contentElement.style.opacity = '1';

        // Update active link
        document.querySelectorAll('.sidebar a, .dropdown-menu a').forEach(link => {
            link.classList.remove('active');
        });
        linkElement.classList.add('active');

        // Scroll to top of content
        contentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (error) {
        console.error('Content loading failed:', error);
        
        // Centered error display
        contentElement.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 500px;
                text-align: center;
                padding: 30px;
                background: #fff8f8;
                border: 1px solid #ffcccc;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            ">
                <div style="
                    font-size: 24px;
                    color: #d32f2f;
                    margin-bottom: 15px;
                ">
                    <i class="fa fa-exclamation-triangle"></i> Error
                </div>
                <p style="
                    color: #5f2120;
                    margin-bottom: 20px;
                    line-height: 1.5;
                ">
                    Failed to load content: ${error.message}
                </p>
                <div style="display: flex; justify-content: center; gap: 15px;">
                    <button onclick="window.location.reload()" style="
                        padding: 8px 20px;
                        background: #f0f0f0;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        <i class="fa fa-refresh"></i> Retry
                    </button>
                    <button onclick="this.closest('#${targetElementId}').innerHTML=''" style="
                        padding: 8px 20px;
                        background: #d32f2f;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">
                        <i class="fa fa-times"></i> Dismiss
                    </button>
                </div>
            </div>
        `;
        contentElement.style.opacity = '1';
    }
}

// Add animation for loader
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Add event listeners to all links
document.querySelectorAll('.sidebar a, .dropdown-menu a').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const url = link.getAttribute('href');
        const targetElementId = link.getAttribute('data-target');
        loadContent(url, targetElementId, link);
    });
});

// Initialize Kanda dropdown
function initKandaDropdown() {
    const kandaLinks = [
        { url: "/gurukulam/Books/book_link/Bala_Srga.html", name: "बालकाण्डः" },
        { url: "/gurukulam/Books/book_link/Ay_Sarga.html", name: "अयोध्याकाण्डः" },
        { url: "/gurukulam/Books/book_link/Ara_sarga.html", name: "अरण्यकाण्डः" },
        { url: "/gurukulam/Books/book_link/KIs_Sraga.html", name: "किष्किन्धाकाण्डः" },
        { url: "/gurukulam/Books/book_link/SU_Sraga.html", name: "सुन्दरकाण्डः" },
        { url: "/gurukulam/Books/book_link/YU_Sarga.html", name: "युद्धकाण्डः" },
        { url: "/gurukulam/Books/book_link/utt_sarga.html", name: "उत्तरकाण्डः"}
    ];

    const dropdownMenu = document.getElementById("kanda-dropdown-menu");
    const currentPage = window.location.pathname;

    if (dropdownMenu) {
        dropdownMenu.innerHTML = '';
        kandaLinks.forEach(link => {
            if (link.url !== currentPage) {
                const listItem = document.createElement("li");
                const anchor = document.createElement("a");
                anchor.href = link.url;
                anchor.textContent = link.name;
                anchor.setAttribute('data-target', 'content-area'); // Add data-target attribute
                listItem.appendChild(anchor);
                dropdownMenu.appendChild(listItem);
            }
        });
    }
}

// Dynamic sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const header = document.querySelector('.header');
    
    if (!sidebar || !content || !sidebarToggle || !header) return;
    
    const headerHeight = header.offsetHeight;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    
    function isMobile() {
        return window.matchMedia('(max-width: 992px)').matches;
    }
    
    let sidebarCollapsed = isMobile();
    
    if (!isMobile()) {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
            sidebarCollapsed = savedState === 'true';
        }
    }
    
    function toggleSidebar() {
        sidebarCollapsed = !sidebarCollapsed;
        updateSidebar();
        
        if (!isMobile()) {
            localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
        }
    }
    
    function updateSidebar() {
        if (sidebarCollapsed) {
            sidebar.classList.add('collapsed');
            content.style.marginLeft = getComputedStyle(document.documentElement)
                .getPropertyValue('--sidebar-collapsed-width');
        } else {
            sidebar.classList.remove('collapsed');
            content.style.marginLeft = getComputedStyle(document.documentElement)
                .getPropertyValue('--sidebar-width');
        }
    }
    
    function updateContentHeight() {
        content.style.minHeight = `calc(100vh - ${headerHeight}px)`;
    }
    
    sidebarToggle.addEventListener('click', toggleSidebar);
    
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
    
    function handleResize() {
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
    }
    
    window.addEventListener('resize', handleResize);
    
    // Initialize
    updateSidebar();
    updateContentHeight();
    initKandaDropdown(); // Initialize dropdown after DOM is loaded
});

// Toggle navbar for mobile
function toggleNavbar() {
    const navbar = document.querySelector('.navbar-collapse');
    if (navbar) {
        navbar.classList.toggle('show');
    }
    
    const hamburger = document.querySelector('.navbar-toggler');
    if (hamburger) {
        hamburger.classList.toggle('active');
    }
}

// Initialize everything when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set click handlers for all navigation links
    document.querySelectorAll('.sidebar a, .dropdown-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) return;
            e.preventDefault();
            loadContent(
                this.getAttribute('href'),
                this.getAttribute('data-target') || 'content-area',
                this
            );
        });
    });
});