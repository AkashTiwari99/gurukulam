# Graph Report - gurukulam  (2026-11-12)

## Corpus Check
- 26 files · ~824,309 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: .css 18, (none) 2, .bak 1)

## Summary
- 270 nodes · 383 edges · 22 communities (16 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9fec6f23`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- re
- keyboard.js
- Responsive Design Improvements - Mobile, Tablet & Desktop
- shlok-audio-player.js
- Critical Issues (Fix Required Immediately)
- Website Audit Report - Gurukulam
- steps
- MainApp
- Key Improvements Made
- books.js
- constants.js
- Gallery.js
- initHamburger
- initSidebarController
- Character_data.js
- gurukulam-static-site.agent.md
- PULL_REQUEST_TEMPLATE.md
- CONTRIBUTING.md
- copilot-instructions.md
- RESPONSIVE-QUICK-REFERENCE.md

## God Nodes (most connected - your core abstractions)
1. `MainApp` - 15 edges
2. `Responsive Design Improvements - Mobile, Tablet & Desktop` - 14 edges
3. `setupEventListeners()` - 11 edges
4. `playShlokFromDiv()` - 11 edges
5. `Website Audit Report - Gurukulam` - 11 edges
6. `Key Improvements Made` - 11 edges
7. `insertText()` - 9 edges
8. `init()` - 8 edges
9. `renderKeyboard()` - 8 edges
10. `initSidebarController()` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (22 total, 6 thin omitted)

### Community 0 - "re"
Cohesion: 0.08
Nodes (15): normalize_name(), fix_chapter_file(), main(), fix_chapter_file(), main(), fix_chapter_file(), main(), fix_chapter_file() (+7 more)

### Community 1 - "keyboard.js"
Cohesion: 0.14
Nodes (24): clearText(), copyText(), createSectionToggles(), downloadText(), handleKeyboardShortcuts(), hideInstructions(), init(), initializeKeyboardPosition() (+16 more)

### Community 2 - "Responsive Design Improvements - Mobile, Tablet & Desktop"
Cohesion: 0.07
Nodes (28): Accessibility Improvements, Breakpoint Strategy, Browser Support, Cross-browser Testing, CSS Features Used, Desktop Testing (> 1024px), Extra Large (>1440px), Extra Small (<320px) (+20 more)

### Community 3 - "shlok-audio-player.js"
Cohesion: 0.26
Nodes (20): addPlayButtons(), addStyles(), checkAudioAvailability(), createModalPlayer(), formatTime(), getAudioPath(), getShlokNumber(), getShlokTitle() (+12 more)

### Community 4 - "Critical Issues (Fix Required Immediately)"
Cohesion: 0.11
Nodes (18): 1. HTML Structure Problems, 2. File Path Issues, 3. Navigation Inconsistencies, 4. Missing CSS Dependencies, 5. JavaScript Issues, 6. CSS Variable Issues, `about.html`, `books.html` (Line 126) (+10 more)

### Community 5 - "Website Audit Report - Gurukulam"
Cohesion: 0.12
Nodes (16): 1. Inconsistent Navigation Pattern, 2. Missing Current Page Indicators, 3. Incomplete Footer Implementation, Accessibility Issues, Browser Compatibility, Executive Summary, Files Requiring Updates, Notes (+8 more)

### Community 6 - "steps"
Cohesion: 0.13
Nodes (14): runs-on, steps, jobs, checks, name, on, pull_request, push (+6 more)

### Community 8 - "Key Improvements Made"
Cohesion: 0.18
Nodes (11): 10. Tablet-Specific Improvements, 1. CSS Variables Enhancement, 2. Mobile-First Responsive Framework, 3. Touch-Friendly Design, 4. Typography Improvements, 5. Form & Input Optimization, 6. Navigation Enhancement, 7. Grid & Layout Optimization (+3 more)

### Community 9 - "books.js"
Cohesion: 0.27
Nodes (5): closeMobileSidebar(), contentCache, initChapterListDelegation(), loadContent(), updateSidebarTitle()

### Community 10 - "constants.js"
Cohesion: 0.20
Nodes (5): KANDA_DATA, KANDA_FILES, kandaChapterCountMap, kandaInfoMap, kandaNameMap

### Community 11 - "Gallery.js"
Cohesion: 0.31
Nodes (8): filterGallery(), galleryGrid, galleryItems, initGallery(), renderGallery(), selectedItems, showPhotosBtn, showVideosBtn

### Community 12 - "initHamburger"
Cohesion: 0.33
Nodes (5): initHamburger(), closeMenu(), openMenu(), toggleMenu(), ViewportRealignmentController

### Community 13 - "initSidebarController"
Cohesion: 0.68
Nodes (8): initSidebarController(), closeSidebarController(), handleResize(), isMobile(), toggleSidebar(), updateBackdrop(), updateContentHeight(), updateSidebar()

### Community 14 - "Character_data.js"
Cohesion: 0.29
Nodes (6): consonants, numbers, SAMA_svara, specialChars, vedicDiacritics, vowels

### Community 15 - "gurukulam-static-site.agent.md"
Cohesion: 0.33
Nodes (5): Approach, Commit Instructions, Constraints, Output Format, Priority when constraints conflict

### Community 16 - "PULL_REQUEST_TEMPLATE.md"
Cohesion: 0.40
Nodes (4): Changes, Checklist, How to test, Summary

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Critical Issues (Fix Required Immediately)` connect `Critical Issues (Fix Required Immediately)` to `Website Audit Report - Gurukulam`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `setupEventListeners()` (e.g. with `clearText()` and `copyText()`) actually correct?**
  _`setupEventListeners()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `re` be split into smaller, more focused modules?**
  _Cohesion score 0.07926829268292683 - nodes in this community are weakly interconnected._
- **Why does `MainApp` connect `MainApp` to `initHamburger`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `keyboard.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14482758620689656 - nodes in this community are weakly interconnected._
- **Should `Responsive Design Improvements - Mobile, Tablet & Desktop` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Critical Issues (Fix Required Immediately)` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._