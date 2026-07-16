// DOM Elements (queried once; may be null on pages that don't include the gallery)
const galleryGrid = document.getElementById("gallery-grid");
const uploadForm = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const deleteBtn = document.getElementById("delete-btn");
const downloadBtn = document.getElementById("download-btn");
const showPhotosBtn = document.getElementById("show-photos");
const showVideosBtn = document.getElementById("show-videos");

// Array to store selected items
let selectedItems = [];

let galleryItems = [
    { url: "../images/BG Recitation _0.jpg", type: "image/jpeg" },
    { url: "../images/card1.jpg", type: "image/jpeg" },
    { url: "../images/card2.jpg", type: "image/jpeg" },
    { url: "../images/card3.jpg", type: "image/jpeg" },
    { url: "../images/card4.jpg", type: "image/jpeg" },
    { url: "../images/card5.jpg", type: "image/jpeg" },
    { url: "../images/card6-1080.webp", type: "image/webp" },
    { url: "../images/fire.webp", type: "image/webp" }
];

// Render gallery items into the DOM
function renderGallery(items) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = ""; // Clear the gallery
    items.forEach((item, index) => {
        const galleryItem = document.createElement("div");
        galleryItem.classList.add("gallery-item");

        const mediaElement = item.type && item.type.startsWith("image")
            ? `<img src="${item.url}" alt="Gallery Image">`
            : `<video controls><source src="${item.url}" type="${item.type}"></video>`;

        // Add checkbox for selecting items
        galleryItem.innerHTML = `
            ${mediaElement}
            <input type="checkbox" class="select-checkbox" data-index="${index}">
        `;
        galleryGrid.appendChild(galleryItem);
    });

    // Add event listeners to checkboxes
    const checkboxes = galleryGrid.querySelectorAll(".select-checkbox");
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
            const index = Number(e.target.dataset.index);
            if (e.target.checked) {
                if (!selectedItems.includes(index)) selectedItems.push(index);
            } else {
                selectedItems = selectedItems.filter((i) => i !== index);
            }
        });
    });
}

// Filter gallery items by type
function filterGallery(type) {
    const filteredItems = galleryItems.filter((item) => item.type && item.type.startsWith(type));
    renderGallery(filteredItems);
}

// Initialize gallery only when the page includes the gallery markup
function initGallery() {
    if (!galleryGrid) return; // Page doesn't include a gallery

    // Initial render (show all items)
    renderGallery(galleryItems);

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

    // Upload Form Submission
    if (uploadForm && fileInput) {
        uploadForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const files = fileInput.files;
            if (files && files.length > 0) {
                Array.from(files).forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        galleryItems.push({ url: ev.target.result, type: file.type });
                        renderGallery(galleryItems);
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
    }

    // Delete Selected Items
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
            // Remove by descending index so earlier splices don't affect later indexes
            selectedItems
                .map(i => Number(i))
                .sort((a, b) => b - a)
                .forEach((index) => {
                    if (index >= 0 && index < galleryItems.length) {
                        galleryItems.splice(index, 1);
                    }
                });
            selectedItems = [];
            renderGallery(galleryItems);
        });
    }

    // Download Selected Items
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            selectedItems.forEach((index) => {
                const item = galleryItems[Number(index)];
                if (!item) return;
                const link = document.createElement("a");
                link.href = item.url;
                link.download = item.url.split("/").pop();
                document.body.appendChild(link);
                link.click();
                link.remove();
            });
        });
    }
}

// Run init on DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', initGallery);