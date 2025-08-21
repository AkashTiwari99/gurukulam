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
    const themeToggle = document.getElementById('theme-toggle');
    const notification = document.getElementById('notification');
    const toggleInstructionsBtn = document.getElementById('toggle-instructions');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    const instructions = document.getElementById('instructions');
    
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
    let isDarkMode = localStorage.getItem('theme') === 'dark';
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
        
        // Initialize keyboard position
        initializeKeyboardPosition();
    }
    
    // Initialize keyboard position
    function initializeKeyboardPosition() {
        // Convert from bottom/left positioning to top/left positioning
        const rect = keyboardContainer.getBoundingClientRect();
        keyboardContainer.style.position = 'fixed';
        keyboardContainer.style.top = rect.top + 'px';
        keyboardContainer.style.left = rect.left + 'px';
        keyboardContainer.style.bottom = 'auto';
    }
    
    // Create section toggle buttons in keyboard header
    function createSectionToggles() {
        const keyboardHeader = document.querySelector('.keyboard-header');
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
            toggleBtn.className = 'section-toggle-btn';
            toggleBtn.dataset.section = section.id;
            toggleBtn.innerHTML = `${section.icon} ${section.name}`;
            toggleBtn.title = `Show ${section.name} section`;
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
                key.className = 'key';
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
    
    // Setup all event listeners
    function setupEventListeners() {
        // Toggle keyboard visibility
        toggleKeyboardBtn.addEventListener('click', toggleKeyboardVisibility);
        
        // Copy text to clipboard
        copyBtn.addEventListener('click', copyText);
        
        // Clear text area
        clearBtn.addEventListener('click', clearText);
        
        // Download text
        downloadBtn.addEventListener('click', downloadText);
        
        // Insert space
        spaceBtn.addEventListener('click', () => insertText(' '));
        
        // Toggle theme
        themeToggle.addEventListener('click', toggleTheme);
        
        // Toggle instructions
        if (toggleInstructionsBtn) {
            toggleInstructionsBtn.addEventListener('click', toggleInstructions);
        }
        
        // Close instructions
        if (closeInstructionsBtn) {
            closeInstructionsBtn.addEventListener('click', hideInstructions);
        }
        
        // Handle keyboard shortcuts
        textInput.addEventListener('keydown', handleKeyboardShortcuts);
    }
    
    // Toggle instructions visibility
    function toggleInstructions() {
        if (instructions) {
            instructions.classList.toggle('hidden');
            
            if (instructions.classList.contains('hidden')) {
                toggleInstructionsBtn.textContent = '📋 Keyboard Shortcuts';
            } else {
                toggleInstructionsBtn.textContent = '📋 Hide Shortcuts';
            }
        }
    }
    
    // Hide instructions
    function hideInstructions() {
        if (instructions) {
            instructions.classList.add('hidden');
            toggleInstructionsBtn.textContent = '📋 Keyboard Shortcuts';
        }
    }
    
    // Toggle keyboard visibility
    function toggleKeyboardVisibility() {
        const keyboard = document.querySelector('.keyboard-container');
        keyboard.classList.toggle('hidden');
        
        if (keyboard.classList.contains('hidden')) {
            toggleKeyboardBtn.textContent = '⌨️ Show Keyboard';
        } else {
            toggleKeyboardBtn.textContent = '⌨️ Hide Keyboard';
        }
    }
    
    // Copy text to clipboard
    function copyText() {
        if (textInput.value.trim() === '') {
            showNotification('Text area is empty', 'error');
            return;
        }
        
        textInput.select();
        document.execCommand('copy');
        
        // Show notification
        showNotification('Text copied to clipboard!', 'success');
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
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
    
    // Set theme based on boolean
    function setTheme(darkMode) {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️ Light Mode';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.textContent = '🌙 Dark Mode';
        }
    }
    
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
    
    // Make element draggable - FIXED VERSION
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const header = element.querySelector('.keyboard-header');
        
        if (!header) return; // Safety check
        
        // Mouse events
        header.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        // Touch events for mobile support
        header.addEventListener('touchstart', startDragTouch, { passive: false });
        document.addEventListener('touchmove', dragTouch, { passive: false });
        document.addEventListener('touchend', stopDrag);
        
        function startDrag(e) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            // Change cursor style
            header.style.cursor = 'grabbing';
            
            // Prevent text selection while dragging
            e.preventDefault();
        }
        
        function startDragTouch(e) {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            
            // Change cursor style
            header.style.cursor = 'grabbing';
            
            // Prevent default behavior
            e.preventDefault();
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // Calculate new position
            let newX = initialX + dx;
            let newY = initialY + dy;
            
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;
            
            // Constrain to viewport with some padding
            const padding = 20;
            newX = Math.max(padding, Math.min(newX, viewportWidth - elementWidth - padding));
            newY = Math.max(padding, Math.min(newY, viewportHeight - elementHeight - padding));
            
            // Apply new position
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            element.style.bottom = 'auto'; // Remove bottom positioning
            element.style.right = 'auto';  // Remove right positioning
        }
        
        function dragTouch(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            
            // Calculate new position
            let newX = initialX + dx;
            let newY = initialY + dy;
            
            // Get viewport dimensions
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const elementWidth = element.offsetWidth;
            const elementHeight = element.offsetHeight;
            
            // Constrain to viewport with some padding
            const padding = 20;
            newX = Math.max(padding, Math.min(newX, viewportWidth - elementWidth - padding));
            newY = Math.max(padding, Math.min(newY, viewportHeight - elementHeight - padding));
            
            // Apply new position
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            element.style.bottom = 'auto'; // Remove bottom positioning
            element.style.right = 'auto';  // Remove right positioning
        }
        
        function stopDrag() {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
            }
        }
        
        // Set initial cursor style
        header.style.cursor = 'grab';
    }
    
    // Initialize the application
    init();
});