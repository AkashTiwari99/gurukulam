// ../script/keyboard.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const textInput = document.getElementById('text-input');
    const keyboardContainer = document.querySelector('.keyboard-container');
    const toggleKeyboardBtn = document.getElementById('toggle-keyboard');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const downloadBtn = document.getElementById('download-btn');
    const spaceBtn = document.getElementById('space-btn');
    const backspaceBtn = document.getElementById('backspace-btn');
    const enterBtn = document.getElementById('enter-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const notification = document.getElementById('notification');
    
    // Keyboard section elements
    const vowelsGroup = document.getElementById('vowels-group');
    const consonantsGroup = document.getElementById('consonants-group');
    const specialGroup = document.getElementById('special-group');
    const vedicGroup = document.getElementById('vedic-group');
    const samaGroup = document.getElementById('sama-group');
    const numbersGroup = document.getElementById('numbers-group');
    
    // Keyboard section containers
    const vowelsSection = document.getElementById('vowels-section');
    const consonantsSection = document.getElementById('consonants-section');
    const specialSection = document.getElementById('special-section');
    const vedicSection = document.getElementById('vedic-section');
    const samaSection = document.getElementById('sama-section');
    const numbersSection = document.getElementById('numbers-section');
    
    // State variables
    let storedTheme = null;
    try {
        storedTheme = localStorage.getItem('theme');
    } catch (_) {}
    let isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' ||
        storedTheme === 'dark' ||
        (storedTheme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    let activeSection = 'vowels'; // Default active section
    
    // Initialize the application
    function init() {
        // Set initial theme
        setTheme(isDarkMode);
        
        // Render keyboard keys
        renderKeyboard();
        
        // Create section toggle buttons
        createSectionToggles();
        
        // Setup event listeners
        setupEventListeners();
        
        // Make keyboard draggable
        makeDraggable(keyboardContainer);
        
        // Focus on text input
        textInput.focus();
        
        // Show default section
        showSection('vowels');
    }
    
    // Create section toggle buttons in keyboard header
    function createSectionToggles() {
        const keyboardHeader = document.querySelector('.keyboard-header');
        if (!keyboardHeader) return;
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'section-toggle-container';
        
        const sections = [
            { id: 'vowels', name: 'स्वर', icon: '🔤' },
            { id: 'consonants', name: 'व्यञ्जन', icon: '🔡' },
            { id: 'special', name: 'विशेष-स्वर', icon: '⭐' },
            { id: 'vedic', name: 'वैदिक-स्वर', icon: '📜' },
            { id: 'sama', name: 'साम-स्वर', icon: '🎵' },
            { id: 'numbers', name: 'संख्या', icon: '🔢' }
        ];
        
        sections.forEach(section => {
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'section-toggle-btn';
            toggleBtn.dataset.section = section.id;
            toggleBtn.textContent = `${section.icon} ${section.name}`;
            toggleBtn.title = `Show ${section.name} section`;
            toggleBtn.setAttribute('aria-pressed', 'false');
            toggleBtn.addEventListener('click', () => showSection(section.id));
            
            toggleContainer.appendChild(toggleBtn);
        });
        
        keyboardHeader.appendChild(toggleContainer);
    }
    
    // Show specific section and hide others
    function showSection(sectionId) {
        // Hide all sections
        vowelsSection.classList.add('hidden');
        consonantsSection.classList.add('hidden');
        specialSection.classList.add('hidden');
        vedicSection.classList.add('hidden');
        samaSection.classList.add('hidden');
        numbersSection.classList.add('hidden');
        
        // Remove active class from all buttons
        document.querySelectorAll('.section-toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Show selected section
        switch(sectionId) {
            case 'vowels':
                vowelsSection.classList.remove('hidden');
                break;
            case 'consonants':
                consonantsSection.classList.remove('hidden');
                break;
            case 'special':
                specialSection.classList.remove('hidden');
                break;
            case 'vedic':
                vedicSection.classList.remove('hidden');
                break;
            case 'sama':
                samaSection.classList.remove('hidden');
                break;
            case 'numbers':
                numbersSection.classList.remove('hidden');
                break;
        }
        
        // Add active class to clicked button
        const activeBtn = document.querySelector(`.section-toggle-btn[data-section="${sectionId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-pressed', 'true');
        }
        
        activeSection = sectionId;
    }
    
    // Render all keyboard sections
    function renderKeyboard() {
        renderVowels();
        renderConsonants();
        renderSpecialChars();
        renderVedicDiacritics();
        renderSamaSvara();
        renderNumbers();
    }
    
    // Render vowels with matra buttons
    function renderVowels() {
        if (typeof vowels !== 'undefined') {
            vowels.forEach(vowel => {
                const vowelKey = document.createElement('div');
                vowelKey.className = 'vowel-key';
                
                const mainBtn = document.createElement('button');
                mainBtn.className = 'vowel-main-btn';
                mainBtn.textContent = vowel.devanagari;
                mainBtn.title = `${vowel.roman} - ${vowel.devanagari}`;
                mainBtn.addEventListener('click', () => insertText(vowel.devanagari));
                
                vowelKey.appendChild(mainBtn);
                
                if (vowel.matra) {
                    const matraContainer = document.createElement('div');
                    matraContainer.className = 'matra-container';
                    
                    const matraBtn = document.createElement('button');
                    matraBtn.className = 'matra-btn';
                    matraBtn.textContent = vowel.matra;
                    matraBtn.title = `Matra for ${vowel.roman}`;
                    matraBtn.addEventListener('click', () => insertText(vowel.matra));
                    
                    matraContainer.appendChild(matraBtn);
                    vowelKey.appendChild(matraContainer);
                }
                
                vowelsGroup.appendChild(vowelKey);
            });
        }
    }
    
    // Render consonants
    function renderConsonants() {
        if (typeof consonants !== 'undefined') {
            consonants.forEach(consonant => {
                const key = document.createElement('button');
                key.type = 'button';
                key.className = 'key consonant-btn';
                key.textContent = consonant.devanagari;
                key.title = `${consonant.roman} - ${consonant.devanagari}`;
                key.addEventListener('click', () => insertText(consonant.devanagari));
                
                consonantsGroup.appendChild(key);
            });
        }
    }
    
    // Render special characters
    function renderSpecialChars() {
        if (typeof specialChars !== 'undefined') {
            specialChars.forEach(char => {
                const key = document.createElement('button');
                key.className = 'key';
                key.textContent = char.devanagari;
                key.title = `${char.title} - ${char.roman}`;
                key.addEventListener('click', () => insertText(char.devanagari));
                
                specialGroup.appendChild(key);
            });
        }
    }
    
    // Render Vedic diacritics
    function renderVedicDiacritics() {
        if (typeof vedicDiacritics !== 'undefined') {
            vedicDiacritics.forEach(diacritic => {
                const key = document.createElement('button');
                key.className = 'key accent-key';
                key.textContent = diacritic.char;
                key.title = diacritic.title;
                key.addEventListener('click', () => insertText(diacritic.char));
                
                vedicGroup.appendChild(key);
            });
        }
    }
    
    // Render SAMA_svara diacritics
    function renderSamaSvara() {
        if (typeof SAMA_svara !== 'undefined') {
            SAMA_svara.forEach(item => {
                const key = document.createElement('button');
                key.className = 'key';
                key.textContent = item.char;
                key.title = item.title;
                key.addEventListener('click', () => insertText(item.char));
                
                // Special styling for superscript numbers
                if (item.title.includes('superscript')) {
                    key.classList.add('super-btn');
                }
                
                samaGroup.appendChild(key);
            });
        }
    }
    
    // Render numbers
    function renderNumbers() {
        if (typeof numbers !== 'undefined') {
            numbers.forEach(number => {
                const numberContainer = document.createElement('div');
                numberContainer.className = 'number-container';
                
                const numberBtn = document.createElement('button');
                numberBtn.className = 'number-btn';
                numberBtn.textContent = number.devanagari;
                numberBtn.title = `${number.roman} - ${number.devanagari}`;
                numberBtn.addEventListener('click', () => insertText(number.devanagari));
                
                numberContainer.appendChild(numberBtn);
                numbersGroup.appendChild(numberContainer);
            });
        }
    }
    
    // Insert text at cursor position
    function insertText(text) {
        const startPos = textInput.selectionStart;
        const endPos = textInput.selectionEnd;
        const currentValue = textInput.value;
        
        textInput.value = currentValue.substring(0, startPos) + 
                          text + 
                          currentValue.substring(endPos, currentValue.length);
        
        // Set cursor position after inserted text
        textInput.selectionStart = textInput.selectionEnd = startPos + text.length;
        textInput.focus();
        
        // Trigger input event for any listeners
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Delete selected range or character immediately before cursor
    function deleteAtCursor() {
        const startPos = textInput.selectionStart;
        const endPos = textInput.selectionEnd;
        const currentValue = textInput.value;

        if (startPos !== endPos) {
            textInput.value = currentValue.substring(0, startPos) + currentValue.substring(endPos);
            textInput.selectionStart = textInput.selectionEnd = startPos;
        } else if (startPos > 0) {
            // Handle surrogate pairs cleanly if present
            let removeCount = 1;
            const prevCode = currentValue.charCodeAt(startPos - 1);
            if (prevCode >= 0xDC00 && prevCode <= 0xDFFF && startPos >= 2) {
                const highCode = currentValue.charCodeAt(startPos - 2);
                if (highCode >= 0xD800 && highCode <= 0xDBFF) {
                    removeCount = 2;
                }
            }
            const newPos = startPos - removeCount;
            textInput.value = currentValue.substring(0, newPos) + currentValue.substring(endPos);
            textInput.selectionStart = textInput.selectionEnd = newPos;
        }

        textInput.focus();
        textInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Toggle keyboard visibility
        if (toggleKeyboardBtn) toggleKeyboardBtn.addEventListener('click', toggleKeyboardVisibility);
        
        // Copy text to clipboard
        if (copyBtn) copyBtn.addEventListener('click', copyText);
        
        // Clear text area
        if (clearBtn) clearBtn.addEventListener('click', clearText);
        
        // Download text
        if (downloadBtn) downloadBtn.addEventListener('click', downloadText);
        
        // Insert space
        if (spaceBtn) spaceBtn.addEventListener('click', () => insertText(' '));

        // Virtual Backspace
        if (backspaceBtn) backspaceBtn.addEventListener('click', deleteAtCursor);

        // Virtual Enter (newline)
        if (enterBtn) enterBtn.addEventListener('click', () => insertText('\n'));
        
        // Toggle theme
        if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
        
        // Handle keyboard shortcuts
        textInput.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    // Toggle keyboard visibility
    function toggleKeyboardVisibility() {
        const keyboard = document.querySelector('.keyboard-container');
        if (!keyboard) return;
        const isHidden = keyboard.classList.toggle('hidden');
        toggleKeyboardBtn.setAttribute('aria-expanded', String(!isHidden));
        toggleKeyboardBtn.textContent = isHidden ? '⌨️ Show Keyboard' : '⌨️ Hide Keyboard';
    }
    
    // Copy text to clipboard (Clipboard API with execCommand fallback)
    async function copyText() {
        const value = textInput.value;
        if (value.trim() === '') {
            showNotification('Text area is empty', 'error');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(value);
                showNotification('Text copied to clipboard!', 'success');
                return;
            } catch (_) {
                // Fall back to legacy copy below
            }
        }

        try {
            textInput.focus();
            textInput.select();
            const copied = document.execCommand('copy');
            if (copied) {
                showNotification('Text copied to clipboard!', 'success');
            } else {
                showNotification('Unable to copy text. Please copy manually.', 'error');
            }
        } catch (_) {
            showNotification('Unable to copy text. Please copy manually.', 'error');
        }
    }
    
    // Clear text area
    function clearText() {
        if (textInput.value.trim() === '') return;
        
        if (confirm('Are you sure you want to clear the text?')) {
            textInput.value = '';
            textInput.focus();
            showNotification('Text cleared', 'success');
        }
    }
    
    // Download text as file
    function downloadText() {
        if (textInput.value.trim() === '') {
            showNotification('Text area is empty', 'error');
            return;
        }
        
        const blob = new Blob([textInput.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sanskrit-text.txt';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Text downloaded', 'success');
    }
    
    // Toggle between light and dark themes
    function toggleTheme() {
        isDarkMode = !isDarkMode;
        setTheme(isDarkMode);
        
        // Save preference to localStorage
        try {
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        } catch (_) {}
    }
    
    // Set theme based on boolean
    function setTheme(darkMode) {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.setAttribute('data-theme-mode', 'dark');
            try { document.documentElement.style.colorScheme = 'dark'; } catch (_) {}
            if (themeToggle) themeToggle.textContent = '☀️ Light Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            document.documentElement.setAttribute('data-theme-mode', 'light');
            try { document.documentElement.style.colorScheme = 'light'; } catch (_) {}
            if (themeToggle) themeToggle.textContent = '🌙 Dark Mode';
        }
    }

    // Coordinate with external storage events (ThemeManager / cross-tab changes)
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            const val = e.newValue;
            const dark = val === 'dark' || (val === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
            isDarkMode = dark;
            setTheme(dark);
        }
    });
    
    // Show notification
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = 'notification show ' + type;
        setTimeout(() => {
            notification.className = 'notification';
        }, 2000);
    }
    
    // Handle keyboard shortcuts
    function handleKeyboardShortcuts(e) {
        // Handle special keyboard shortcuts based on the instructions
        // This is a simplified version - you might want to expand this
        
        // For example, handle capital letters for retroflex consonants
        if (e.shiftKey) {
            switch(e.key) {
                case 'T': e.preventDefault(); insertText('ट'); break;
                case 'D': e.preventDefault(); insertText('ड'); break;
                case 'N': e.preventDefault(); insertText('ण'); break;
                case 'L': e.preventDefault(); insertText('ळ'); break;
                case 'S': e.preventDefault(); insertText('ष'); break;
                case 'M': e.preventDefault(); insertText('ं'); break;
                case 'H': e.preventDefault(); insertText('ः'); break;
            }
        }
        
        // Handle other special cases as needed
    }
    
    // Make element draggable via unified Pointer Events (mouse + touch + pen)
    function makeDraggable(element) {
        const header = element ? element.querySelector('.keyboard-header') : null;
        if (!header) return;

        let isDragging = false;
        let activePointerId = null;
        let startX = 0;
        let startY = 0;
        let initialX = 0;
        let initialY = 0;

        header.addEventListener('pointerdown', (e) => {
            // Do not hijack taps/clicks on section toggle buttons
            if (e.target.closest('.section-toggle-container, button')) {
                return;
            }
            if (e.pointerType === 'mouse' && e.button !== 0) {
                return;
            }

            isDragging = true;
            activePointerId = e.pointerId;
            startX = e.clientX;
            startY = e.clientY;

            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            element.classList.add('is-floating', 'dragging');
            element.style.left = `${initialX}px`;
            element.style.top = `${initialY}px`;
            element.style.width = `${rect.width}px`;
            element.style.bottom = 'auto';
            element.style.right = 'auto';

            if (header.setPointerCapture) {
                header.setPointerCapture(e.pointerId);
            }
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });

        header.addEventListener('pointermove', (e) => {
            if (!isDragging || e.pointerId !== activePointerId) return;

            e.preventDefault();

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;

            const padding = 10;
            const maxX = Math.max(padding, viewportWidth - elementWidth - padding);
            const maxY = Math.max(padding, viewportHeight - elementHeight - padding);

            const newX = Math.max(padding, Math.min(initialX + dx, maxX));
            const newY = Math.max(padding, Math.min(initialY + dy, maxY));

            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
        });

        function stopDrag(e) {
            if (!isDragging || (e.pointerId !== undefined && e.pointerId !== activePointerId)) return;
            isDragging = false;
            if (header.releasePointerCapture && activePointerId !== null) {
                try {
                    header.releasePointerCapture(activePointerId);
                } catch (_) {
                    // Pointer capture may already be released
                }
            }
            activePointerId = null;
            element.classList.remove('dragging');
            header.style.cursor = 'grab';
        }

        header.addEventListener('pointerup', stopDrag);
        header.addEventListener('pointercancel', stopDrag);
        header.style.cursor = 'grab';
    }
    
    // Initialize the application
    init();
});