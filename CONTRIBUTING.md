## Contributing to Gurukulam

Thanks for helping improve Gurukulam. This file contains quick, practical steps to get started, run the site locally, and open a focused PR.

1) Read and learn
- Open `index.html` and `styles/global.css` to understand the main layout.
- Read `scripts/main.js`, `scripts/books.js`, and `scripts/Gallery.js` to learn interactive patterns (nav highlighting, dynamic fragment loading, gallery mock API).

2) Run locally (quick)
- Recommended: run the included helper from the repo root on Windows:

```cmd
dev\serve-windows.bat
```

- Cross-platform alternative:

```cmd
python -m http.server 8000
```

Then open: http://localhost:8000/gurukulam/index.html

3) Small, safe edits
- Prefer small commits with one clear change (UI fix, one page content update, or a single script tweak).
- If editing book fragments used by `books.js`, create plain HTML fragments (no <html>/<head>) and add links with `data-target` attributes.

4) Conventions & gotchas
- Filenames may contain spaces; use exact filenames when linking.
- Paths are often absolute (start with `/gurukulam/`); preserve that style unless you know the hosting path will change.
- There is no backend: features requiring persistence must either be simulated client-side or introduce a documented API and server.

5) PR checklist (what to include in the description)
- Short summary of the change.
- Files changed and rationale.
- How to run locally to verify.
- Screenshots for visual changes (if applicable).

If you'd like mentorship, add a comment describing what you want to work on and I (or the repo owner) can assign an issue or a small starter task.
