// DOM Elements
const galleryGrid = document.getElementById("gallery-grid");
const uploadForm = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const deleteBtn = document.getElementById("delete-btn");
const downloadBtn = document.getElementById("download-btn");
const showPhotosBtn = document.getElementById("show-photos");
const showVideosBtn = document.getElementById("show-videos");

const isAdminMode = Boolean(deleteBtn);

// Track selected items by object reference to avoid index-shift bugs on multi-delete
const selectedItems = new Set();
let activeFilter = "all";

let galleryItems = [
    { url: "../images/BG Recitation _0.jpg", type: "image/jpeg", alt: "Bhagavad Gita recitation at Gurukulam" },
    { url: "../images/card1.jpg", type: "image/jpeg", alt: "Gurukulam campus activity 1" },
    { url: "../images/card2.jpg", type: "image/jpeg", alt: "Gurukulam campus activity 2" },
    { url: "../images/card3.jpg", type: "image/jpeg", alt: "Gurukulam campus activity 3" },
    { url: "../images/card4.jpg", type: "image/jpeg", alt: "Gurukulam campus activity 4" },
    { url: "../images/card5.jpg", type: "image/jpeg", alt: "Gurukulam campus activity 5" },
    { url: "../images/card6-1080.webp", type: "image/webp", alt: "Gurukulam learning session" },
    { url: "../images/fire.webp", type: "image/webp", alt: "Sacred yajna fire ceremony at Gurukulam" }
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
            img.alt = item.alt || `Gurukulam gallery photo ${index + 1}`;
            img.width = 400;
            img.height = 300;
            img.loading = "lazy";
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

// Function to filter gallery items by type
function filterGallery(type) {
    activeFilter = type;
    renderGallery(getFilteredItems(type));
}

// Initial render (show all items)
if (galleryGrid) {
    renderGallery(galleryItems);
}

// Event Listeners for Filter Buttons
if (showPhotosBtn) {
    showPhotosBtn.addEventListener("click", () => {
        filterGallery("image");
        showPhotosBtn.classList.add("active");
        if (showVideosBtn) showVideosBtn.classList.remove("active");
    });
}

if (showVideosBtn) {
    showVideosBtn.addEventListener("click", () => {
        filterGallery("video");
        showVideosBtn.classList.add("active");
        if (showPhotosBtn) showPhotosBtn.classList.remove("active");
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
