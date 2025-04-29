// DOM Elements
const galleryGrid = document.getElementById("gallery-grid");
const uploadForm = document.getElementById("upload-form");
const fileInput = document.getElementById("file-input");
const deleteBtn = document.getElementById("delete-btn");
const downloadBtn = document.getElementById("download-btn");
const showPhotosBtn = document.getElementById("show-photos");
const showVideosBtn = document.getElementById("show-videos");

// Array to store selected items
let selectedItems = [];

// Mock data for gallery (replace with data from the server)
let galleryItems = [
    { url: "image1.jpg", type: "image/jpeg" },
    { url: "image2.jpg", type: "image/jpeg" },
    { url: "video1.mp4", type: "video/mp4" },
    { url: "video2.mp4", type: "video/mp4" },
];

// Function to render gallery items
function renderGallery(items) {
    galleryGrid.innerHTML = ""; // Clear the gallery
    items.forEach((item, index) => {
        const galleryItem = document.createElement("div");
        galleryItem.classList.add("gallery-item");

        const mediaElement = item.type.startsWith("image")
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
    const checkboxes = document.querySelectorAll(".select-checkbox");
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", (e) => {
            const index = e.target.dataset.index;
            if (e.target.checked) {
                selectedItems.push(index);
            } else {
                selectedItems = selectedItems.filter((i) => i !== index);
            }
        });
    });
}

// Function to filter gallery items by type
function filterGallery(type) {
    const filteredItems = galleryItems.filter((item) => item.type.startsWith(type));
    renderGallery(filteredItems);
}

// Initial render (show all items)
renderGallery(galleryItems);

// Event Listeners for Filter Buttons
showPhotosBtn.addEventListener("click", () => {
    filterGallery("image");
    showPhotosBtn.classList.add("active");
    showVideosBtn.classList.remove("active");
});

showVideosBtn.addEventListener("click", () => {
    filterGallery("video");
    showVideosBtn.classList.add("active");
    showPhotosBtn.classList.remove("active");
});

// Upload Form Submission
uploadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const files = fileInput.files;
    if (files.length > 0) {
        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                galleryItems.push({ url: e.target.result, type: file.type });
                renderGallery(galleryItems);
            };
            reader.readAsDataURL(file);
        });
    }
});

// Delete Selected Items
deleteBtn.addEventListener("click", () => {
    selectedItems.forEach((index) => {
        galleryItems.splice(index, 1);
    });
    selectedItems = [];
    renderGallery(galleryItems);
});

// Download Selected Items
downloadBtn.addEventListener("click", () => {
    selectedItems.forEach((index) => {
        const item = galleryItems[index];
        const link = document.createElement("a");
        link.href = item.url;
        link.download = item.url.split("/").pop();
        link.click();
    });
});