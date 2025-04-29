// Function to load content dynamically
async function loadContent(url, targetElementId, linkElement) {
    const contentElement = document.getElementById(targetElementId);
    if (!contentElement) return;

    contentElement.innerHTML = '<div class="loader"></div>'; // Show loading spinner
    contentElement.style.opacity = '0.5'; // Dim the content area

    try {
        const response = await fetch(url); // Fetch the content
        if (!response.ok) {
            throw new Error(`Failed to load content: ${response.statusText}`);
        }
        const data = await response.text(); // Get the HTML content
        contentElement.innerHTML = data; // Insert into the target element
        contentElement.style.opacity = '1'; // Restore opacity

        // Remove active class from all links
        document.querySelectorAll('.sidebar a, .dropdown-menu a').forEach(link => link.classList.remove('active'));
        // Add active class to the clicked link
        linkElement.classList.add('active');
    } catch (error) {
        console.error(error);
        contentElement.innerHTML = `<p>Error loading content: ${error.message}</p>`;
        contentElement.style.opacity = '1'; // Restore opacity
    }
}

// Add event listeners to all links
document.querySelectorAll('.sidebar a, .dropdown-menu a').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link behavior
        const url = link.getAttribute('href'); // Get the URL from the href attribute
        const targetElementId = link.getAttribute('data-target'); // Get the target element ID
        loadContent(url, targetElementId, link); // Load the content
    });
});

// Initialize Kanda dropdown
function initKandaDropdown() {
    const kandaLinks = [
        { url: "/Books/book_link/Bala_Srga.html", name: "बालकाण्डः" },
        { url: "/Books/book_link/Ay_Sarga.html", name: "अयोध्याकाण्डः" },
        { url: "/Books/book_link/Ara_sarga.html", name: "अरण्यकाण्डः" },
        { url: "/Books/book_link/KIs_Sraga.html", name: "किष्किन्धाकाण्डः" },
        { url: "/Books/book_link/SU_Sraga.html", name: "सुन्दरकाण्डः" },
        { url: "/Books/book_link/YU_Sarga.html", name: "युद्धकाण्डः" }
    ];

    const dropdownMenu = document.getElementById("kanda-dropdown-menu");
    const currentPage = window.location.pathname;

    if (dropdownMenu) {
        dropdownMenu.innerHTML = ''; // Clear existing items
        kandaLinks.forEach(link => {
            if (link.url !== currentPage) {
                const listItem = document.createElement("li");
                const anchor = document.createElement("a");
                anchor.href = link.url;
                anchor.textContent = link.name;
                listItem.appendChild(anchor);
                dropdownMenu.appendChild(listItem);
            }
        });
    }
}

// Call the function to initialize the dropdown
initKandaDropdown();

// dynamic-sidebar.js
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const header = document.querySelector('.header');
    
    if (!sidebar || !content || !sidebarToggle || !header) return;
    
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
function toggleNavbar() {
    const navbar = document.querySelector('.navbar-collapse');
    if (navbar) {
        navbar.classList.toggle('show');
    }
    
    // Optional: Toggle hamburger icon animation
    const hamburger = document.querySelector('.navbar-toggler');
    if (hamburger) {
        hamburger.classList.toggle('active');
    }
}