// DOM Elements
const galleryGrid = document.getElementById("gallery-grid");
const uploadForm = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const deleteBtn = document.getElementById("delete-btn");
const downloadBtn = document.getElementById("download-btn");
const showAllBtn = document.getElementById("show-all");
const showPhotosBtn = document.getElementById("show-photos");
const showVideosBtn = document.getElementById("show-videos");

const isAdminMode = Boolean(deleteBtn);

// Track selected items by object reference to avoid index-shift bugs on multi-delete
const selectedItems = new Set();
let activeFilter = showPhotosBtn ? "image" : "all";

let galleryItems = [
    {
        url: "../images/BG Recitation _0.webp",
        srcset: "../images/BG%20Recitation%20_0-480.webp 480w, ../images/BG%20Recitation%20_0.webp 762w",
        sizes: "(max-width: 600px) 92vw, 360px",
        width: 762,
        height: 563,
        type: "image/webp",
        alt: "Bhagavad Gita recitation at Gurukulam"
    },
    { url: "../images/card1.jpg", width: 318, height: 159, type: "image/jpeg", alt: "Gurukulam campus activity 1" },
    { url: "../images/card2.jpg", width: 216, height: 234, type: "image/jpeg", alt: "Gurukulam campus activity 2" },
    { url: "../images/card3.jpg", width: 310, height: 162, type: "image/jpeg", alt: "Gurukulam campus activity 3" },
    { url: "../images/card4.jpg", width: 257, height: 196, type: "image/jpeg", alt: "Gurukulam campus activity 4" },
    { url: "../images/card5.jpg", width: 600, height: 450, type: "image/jpeg", alt: "Gurukulam campus activity 5" },
    { url: "../images/card6-1080.webp", width: 1080, height: 610, type: "image/webp", alt: "Gurukulam learning session" },
    {
        url: "../images/fire.webp",
        srcset: "../images/fire-480.webp 480w, ../images/fire.webp 1200w",
        sizes: "(max-width: 600px) 92vw, 360px",
        width: 1200,
        height: 808,
        type: "image/webp",
        alt: "Sacred yajna fire ceremony at Gurukulam"
    }
];

// Return items matching the current filter
function getFilteredItems(filter = activeFilter) {
    if (filter === "all") return galleryItems;
    return galleryItems.filter((item) => item.type.startsWith(filter));
}

// Function to render gallery items safely with DOM APIs
function renderGallery(items) {
    if (!galleryGrid) return;

    galleryGrid.textContent = "";

    if (items.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "gallery-empty-state";
        emptyState.textContent = activeFilter === "video"
            ? "No videos available yet."
            : "No gallery items available yet.";
        galleryGrid.appendChild(emptyState);
        return;
    }

    items.forEach((item, index) => {
        const galleryItem = document.createElement("div");
        galleryItem.className = "gallery-item";

        if (item.type.startsWith("image")) {
            const img = document.createElement("img");
            img.src = item.url;
            if (item.srcset) {
                img.srcset = item.srcset;
            }
            if (item.sizes) {
                img.sizes = item.sizes;
            }
            img.alt = item.alt || `Gurukulam gallery photo ${index + 1}`;
            img.width = item.width || 400;
            img.height = item.height || 300;
            if (index === 0) {
                img.fetchPriority = "high";
            } else {
                img.loading = "lazy";
            }
            img.decoding = "async";
            galleryItem.appendChild(img);
        } else {
            const video = document.createElement("video");
            video.controls = true;
            video.preload = "metadata";
            const source = document.createElement("source");
            source.src = item.url;
            source.type = item.type;
            video.appendChild(source);
            galleryItem.appendChild(video);
        }

        // Only render selection checkboxes in admin mode (when deleteBtn exists)
        if (isAdminMode) {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.className = "select-checkbox";
            checkbox.checked = selectedItems.has(item);
            checkbox.setAttribute("aria-label", `Select ${item.alt || "gallery item"}`);
            checkbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    selectedItems.add(item);
                } else {
                    selectedItems.delete(item);
                }
            });
            galleryItem.appendChild(checkbox);
        }

        galleryGrid.appendChild(galleryItem);
    });
}

// Helper to synchronize active filter button state and aria-pressed
function setActiveFilterButton(activeBtn) {
    [showAllBtn, showPhotosBtn, showVideosBtn].forEach((btn) => {
        if (!btn) return;
        const isActive = btn === activeBtn;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });
}

// Function to filter gallery items by type
function filterGallery(type) {
    activeFilter = type;
    renderGallery(getFilteredItems(type));
}

// Initial render & default active filter button state
setActiveFilterButton(showPhotosBtn || showAllBtn);
if (galleryGrid) {
    renderGallery(getFilteredItems(activeFilter));
}

// Event Listeners for Filter Buttons
if (showAllBtn) {
    showAllBtn.addEventListener("click", () => {
        filterGallery("all");
        setActiveFilterButton(showAllBtn);
    });
}

if (showPhotosBtn) {
    showPhotosBtn.addEventListener("click", () => {
        filterGallery("image");
        setActiveFilterButton(showPhotosBtn);
    });
}

if (showVideosBtn) {
    showVideosBtn.addEventListener("click", () => {
        filterGallery("video");
        setActiveFilterButton(showVideosBtn);
    });
}

// Upload Form Submission (admin mode)
if (uploadForm && fileInput) {
    uploadForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const files = fileInput.files;
        if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (loadEvent) => {
                    galleryItems.push({
                        url: loadEvent.target.result,
                        type: file.type || "application/octet-stream",
                        alt: file.name
                    });
                    renderGallery(getFilteredItems());
                };
                reader.readAsDataURL(file);
            });
        }
    });
}

// Delete Selected Items (filter by item reference, never forward splice)
if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
        if (selectedItems.size === 0) return;
        galleryItems = galleryItems.filter((item) => !selectedItems.has(item));
        selectedItems.clear();
        renderGallery(getFilteredItems());
    });
}

// Download Selected Items
if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
        selectedItems.forEach((item) => {
            const link = document.createElement("a");
            link.href = item.url;
            link.download = item.alt || item.url.split("/").pop() || "gallery-media";
            link.click();
        });
    });
}
