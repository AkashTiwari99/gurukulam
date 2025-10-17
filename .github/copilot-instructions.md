## Quick orientation for AI coding agents

This repository is a static website (HTML/CSS/JS) called "Gurukulam" focused on Sanatan Dharma content. The site is primarily file-based — no backend, build system, or package manager present. Treat this as a plain web project where edits modify static files under the project root.

Key locations
- Root HTML pages: `index.html`, `about.html`, `books.html`, `programs.html`, `Campus.html`, `contact.html` — these are the main entry points.
- Scripts: `scripts/` (notably `main.js`, `books.js`, `Gallery.js`, `Logo.js`) contain front-end behaviors (nav highlighting, dynamic content loading, gallery mock data). Prefer minimal, unobtrusive JS changes.
- Styles: `styles/` (e.g., `global.css`, `home.css`, `books.css`, `shlok-mala-styles.css`, `shlok-mala2-styles.css`) control site layout and components.
- Content: `assets/Books/`, `Gallery/`, `images/` hold book pages and media. Many book sections are replicated under both top-level and the `onepage-website-2/RAMAYANA/` folder — be careful when editing duplicated content.

Big-picture architecture and conventions
- Static site with client-side JS for interactive behavior. There is no Node/NPM or build step; changes should be made directly to HTML/CSS/JS files.
- Paths are often absolute (e.g., `/gurukulam/styles/global.css`) — preserve path style when adding new assets or links.
- Navigation state: `scripts/main.js` highlights current page by comparing the last path segment. When adding new pages, ensure their filenames match link hrefs exactly.
- Dynamic book loading: `scripts/books.js` uses `fetch()` to load other HTML snippets into a target element. When adding book pages intended for dynamic loading, ensure they return fragment HTML (no <html>/<head> duplicates) and that links include `data-target` attributes.
- Gallery: `scripts/Gallery.js` uses a local `galleryItems` array as mock data. If connecting to a real backend, preserve the render API shape: { url: string, type: string }.

Developer workflows and debugging tips
- No tests or build commands present. To preview changes, open `index.html` (or other HTML) in a browser. Use Live Server or a simple static server (e.g., `python -m http.server`) to avoid CORS/fetch issues when `fetch()`ing local files.
- When `fetch()` returns errors while loading local HTML fragments, run a local HTTP server rather than opening files via `file://`.
- Use the browser DevTools console to inspect JS errors. Key entrypoints for behavior: `new MainApp()` in `scripts/main.js` and modules in `scripts/*.js`.

Project-specific patterns and gotchas
- Duplicate content: There are multiple copies of Ramayana/Aranaya Kanda files across `assets/Books/` and `onepage-website-2/RAMAYANA/`. Prefer editing the copy referenced by the pages you intend to change — check link hrefs in the HTML that will be loaded at runtime.
- Filenames and spaces: Several filenames contain spaces (e.g., `Sanatan Dharma_Vision & Mission.html`, `student 1.jpg`). When linking or scripting, prefer using the exact filename; consider normalizing names when adding new files.
- CSS scope: Global variables and CSS custom properties are used by `books.js` to compute layout (`--header-height`, `--sidebar-width`). If changing header markup or sizes, update both CSS and script assumptions.
- Minimal form handling: `scripts/main.js` simulates contact form submission client-side. There is no backend; avoid adding features that assume server endpoints unless you also add them and document the API.

How to edit safely (examples)
- Add a new page: create `newpage.html` in root, add a link in the nav with href `/gurukulam/newpage.html`, and ensure `main.js` will mark it as active by matching the filename.
- Add a book fragment for dynamic loading: create `Books/book_link/my_sarga.html` containing only the fragment HTML (content to inject), add a sidebar link like `<a href="/gurukulam/Books/book_link/my_sarga.html" data-target="book-content">My Sarga</a>` and the `books.js` loader will fetch it.
- Update gallery mock data: edit `scripts/Gallery.js`'s `galleryItems` array; keep objects shaped like `{ url: "image1.jpg", type: "image/jpeg" }`.

Style and commit guidance for AI edits
- Make minimal, atomic edits per PR (1 feature/fix per commit). Because there's no build, avoid large refactors that move many files at once.
- Preserve existing path styles (leading `/gurukulam/`) unless changing site hosting layout. Update only the files that are actually served to avoid accidental stale duplicates.

Files to reference when working
- `index.html`, `scripts/main.js`, `scripts/books.js`, `scripts/Gallery.js`, `styles/global.css`, `styles/home.css`, `assets/Books/` (example fragments)

If something isn't discoverable
- Ask the repo owner before introducing backend endpoints, package managers, or changing the hosting path. State the exact files you plan to change and why.

Quick checklist for PRs
1. Confirm which HTML files are canonical (search link hrefs). 2. Run a local static server and smoke-test navigation, book loading, and gallery. 3. Verify filenames and paths for spaces/special characters. 4. Keep changes small and document them in the PR description.

---
If you'd like, I can further tailor this file with explicit examples of duplicated file paths or generate a short script to launch a local server on Windows for testing. What would you like next?

Try it (local preview)

- Windows (cmd.exe): included helper `dev\\serve-windows.bat` starts a simple static server on port 8000. Run it from the repo root and open http://localhost:8000 in your browser.

```cmd
dev\\serve-windows.bat
```

- Manual alternatives:

```cmd
python -m http.server 8000
# or
py -3 -m http.server 8000
```
