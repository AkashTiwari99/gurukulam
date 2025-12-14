const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'Books', 'book_link');
const destDir = path.join(__dirname, 'public', 'Books', 'book_link');

console.log(`Source: ${sourceDir}`);
console.log(`Dest: ${destDir}`);

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
        const srcFile = path.join(sourceDir, file);
        const destFile = path.join(destDir, file);
        try {
            if (fs.statSync(srcFile).isFile()) {
                fs.copyFileSync(srcFile, destFile);
                console.log(`Copied: ${file}`);
            }
        } catch (err) {
            console.error(`Error copying ${file}:`, err);
        }
    });
} else {
    console.error('Source directory book_link not found!');
}
