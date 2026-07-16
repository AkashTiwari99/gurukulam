Empowering Research and Knowledge Sharing in Sanatan Dharma
This platform is dedicated to fostering a community of educated individuals who share a passion for exploring and understanding Sanatan Dharma. Our mission is to provide a space where researchers can share their findings, insights, and perspectives, contributing to a richer and more nuanced understanding of this ancient tradition.

Our Purpose
We aim to:

1. Facilitate knowledge sharing: Encourage researchers to share their work, experiences, and insights related to Sanatan Dharma.
2. Promote critical thinking: Foster a culture of critical inquiry and analysis, where researchers can engage with diverse perspectives and ideas.
3. Support academic excellence: Provide a platform for high-quality research and scholarship, promoting academic excellence and rigor.

Join Our Community
We invite scholars, researchers, and enthusiasts to join our community and contribute to our mission. Together, we can:

1. Advance knowledge: Expand our understanding of Sanatan Dharma through rigorous research and analysis.
2. Foster dialogue: Engage in respectful and thoughtful discussions, exploring diverse perspectives and ideas.
3. Build a community: Connect with like-minded individuals, sharing knowledge and insights that promote a deeper understanding of Sanatan Dharma.

By joining our community, you can be part of a dynamic and collaborative effort to explore and understand Sanatan Dharma, contributing to a richer and more nuanced appreciation of this ancient tradition.

Developer notes
---------------

- Canonical content: The authoritative book fragments live under `Books/` at the repository root. Other copies (for example under `gurukulam-next/public/Books/` or `onepage-website-2/`) are derivatives and may be stale. When in doubt, update `Books/` and then copy to other targets as needed.

- Book fragment contract: Fragments loaded dynamically by `scripts/books.js` must be HTML snippets (no `<html>`/`<head>`/`<body>` wrappers) and should include a top-level container with class `page` that contains the fragment markup. Example minimal fragment:

```html
<div class="page">
	<h2>Sarga Title</h2>
	<p>Content...</p>
</div>
```

- Asset naming: Use lowercase, hyphen-separated filenames for images and assets (e.g., `student-1.jpg`). Avoid spaces and special characters. There is a helper script at `tools/normalize_assets.py` that will list problematic filenames and optionally rename references.

- Local preview: Use the provided helper `dev\\serve-windows.bat` on Windows, or run a simple static server from the repo root:

```bash
python -m http.server 8000
# then open http://localhost:8000/gurukulam/index.html
```

- Running the normalizer (dry run first):

```bash
python tools/normalize_assets.py
```

To apply renames and update references (review dry-run output first):

```bash
python tools/normalize_assets.py --apply
```

If you'd like me to run normalization and apply changes in a PR, say so and I'll proceed with the changes and a follow-up verification plan.
