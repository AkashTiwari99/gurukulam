const fs = require('fs');
const path = require('path');

const copyRecursiveSync = (src, dest) => {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        console.log(`Directory: ${src}`);
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        if (!fs.existsSync(path.dirname(dest))) {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
        }
        fs.copyFileSync(src, dest);
        console.log(`Copied: ${dest}`);
    }
};

const srcDirs = ['Books', 'styles', 'scripts'];

// Correct path resolution:
// gurukulam-next is at c:\akash tiwari\gurukulam\gurukulam-next
// Books is at c:\akash tiwari\gurukulam\Books
// So sourceRoot is ..
const sourceRoot = path.join(__dirname, '..');
const destRoot = path.join(__dirname, 'public');

console.log(`Source Root: ${sourceRoot}`);
console.log(`Dest Root: ${destRoot}`);

srcDirs.forEach(dir => {
    const src = path.join(sourceRoot, dir);
    const dest = path.join(destRoot, dir);
    console.log(`Copying ${src} to ${dest}...`);
    try {
        if (fs.existsSync(src)) {
            copyRecursiveSync(src, dest);
            console.log(`Successfully copied ${dir}`);
        } else {
            console.error(`Source directory not found: ${src}`);
        }
    } catch (err) {
        console.error(`Error copying ${dir}:`, err);
    }
});
