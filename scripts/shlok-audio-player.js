// shlok-audio-player.js
// Audio player for Shlok Mala using local MP3 files

(function() {
    'use strict';

    let currentAudio = null;
    let currentButton = null;
    let progressInterval = null;
    let isPlaying = false;
    let currentShlokNumber = null;
    let autoPlayActive = false;
    let autoPlayEnd = null;
    let currentSpeed = 1.0;
    
    // Keyboard navigation helper for audio progress slider
    function attachProgressKeydownListener(container) {
        if (!container || container._hasKeydown) return;
        container._hasKeydown = true;
        container.addEventListener('keydown', (e) => {
            if (!currentAudio || !Number.isFinite(currentAudio.duration) || currentAudio.duration <= 0) return;
            const step = 5;
            let handled = false;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                currentAudio.currentTime = Math.min(currentAudio.duration, currentAudio.currentTime + step);
                handled = true;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                currentAudio.currentTime = Math.max(0, currentAudio.currentTime - step);
                handled = true;
            } else if (e.key === 'Home') {
                e.preventDefault();
                currentAudio.currentTime = 0;
                handled = true;
            } else if (e.key === 'End') {
                e.preventDefault();
                currentAudio.currentTime = currentAudio.duration;
                handled = true;
            }
            if (handled) {
                const ratio = currentAudio.currentTime / currentAudio.duration;
                const progressBar = document.getElementById('modalProgressBar');
                const currentTimeEl = document.getElementById('modalCurrentTime');
                if (progressBar) progressBar.style.width = `${ratio * 100}%`;
                if (currentTimeEl) currentTimeEl.textContent = formatTime(currentAudio.currentTime);
                container.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
            }
        });
    }
    
    // Configuration
    const config = {
        audioPath: 'Shlok_audio/', // Folder where audio files are stored relative to this page
        filePrefix: 'shlok_', // Prefix for audio files
        fileExtension: '.m4a' // Audio file format (this page uses .m4a files)
    };

    // Inline SVG icons (zero external CDN dependency)
    const ICONS = {
        play: '<svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>',
        pause: '<svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
        close: '<svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
        loading: '<svg class="site-icon" aria-hidden="true" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="8" stroke-dasharray="32 16"/></svg>'
    };

    // Create floating audio player modal
    function createModalPlayer() {
        const modal = document.createElement('div');
        modal.className = 'audio-player-modal';
        modal.id = 'shlokAudioPlayer';
        modal.setAttribute('role', 'region');
        modal.setAttribute('aria-label', 'Shlok audio player');
        modal.innerHTML = `
            <button type="button" class="modal-play-btn" id="modalPlayBtn" aria-label="Play or pause audio">${ICONS.play}</button>
            <div class="modal-info">
                <div class="modal-title" id="modalTitle">Select a Shlok</div>
                <div class="modal-progress" id="modalProgressContainer" role="slider" aria-label="Seek audio progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">
                    <div class="modal-progress-bar" id="modalProgressBar"></div>
                </div>
                <div class="modal-time">
                    <span id="modalCurrentTime">0:00</span>
                    <span id="modalDuration">0:00</span>
                </div>
                <div class="modal-controls">
                    <button type="button" class="modal-speed-btn" id="modalSpeedBtn" aria-label="Playback speed">${currentSpeed === 1 ? '1.0' : currentSpeed}x</button>
                    <div class="modal-autoplay">
                        <input type="number" id="modalAutoStart" min="1" max="120" placeholder="Start" aria-label="Auto-play start shlok" />
                        <input type="number" id="modalAutoEnd" min="1" max="120" placeholder="End" aria-label="Auto-play end shlok" />
                        <button type="button" id="modalAutoBtn" class="modal-auto-btn">Auto</button>
                        <button type="button" id="modalStopAutoBtn" class="modal-stop-btn" style="display:none">Stop</button>
                    </div>
                </div>
            </div>
            <button type="button" class="modal-close" id="modalCloseBtn" aria-label="Close audio player">${ICONS.close}</button>
        `;
        const progressContainer = modal.querySelector('#modalProgressContainer');
        attachProgressKeydownListener(progressContainer);
        document.body.appendChild(modal);
        return modal;
    }

    // Format time as MM:SS
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Extract shlok number from element ID
    function getShlokNumber(elementId) {
        const match = elementId.match(/SH_S(\d+)/);
        return match ? match[1] : null;
    }

    // Get audio file path for a shlok
    function getAudioPath(shlokNumber) {
        return `${config.audioPath}${config.filePrefix}${shlokNumber}${config.fileExtension}`;
    }

    // Get shlok title from the page
    function getShlokTitle(shlokDiv) {
        // Find the nearest h3 heading before this shlok
        let prevElement = shlokDiv.previousElementSibling;
        while (prevElement) {
            if (prevElement.tagName === 'H3') {
                return prevElement.textContent.trim();
            }
            prevElement = prevElement.previousElementSibling;
        }
        return `Shlok ${getShlokNumber(shlokDiv.id)}`;
    }

    // Update modal UI with current audio state
    function updateModalUI(audio, title) {
        const modal = document.getElementById('shlokAudioPlayer') || createModalPlayer();
        const titleEl = document.getElementById('modalTitle');
        const progressBar = document.getElementById('modalProgressBar');
        const currentTimeEl = document.getElementById('modalCurrentTime');
        const durationEl = document.getElementById('modalDuration');
        const playBtn = document.getElementById('modalPlayBtn');

        if (titleEl) titleEl.textContent = title || 'Shlok';
        
        if (audio) {
            const updateProgress = () => {
                if (progressBar && currentTimeEl && durationEl && audio.duration) {
                    const percent = (audio.currentTime / audio.duration) * 100;
                    progressBar.style.width = percent + '%';
                    currentTimeEl.textContent = formatTime(audio.currentTime);
                    durationEl.textContent = formatTime(audio.duration);
                    const progressContainer = document.getElementById('modalProgressContainer');
                    if (progressContainer) {
                        progressContainer.setAttribute('aria-valuenow', String(Math.round(percent)));
                    }
                }
            };

            audio.addEventListener('loadedmetadata', updateProgress);
            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('ended', () => {
                if (!autoPlayActive) {
                    const finishedButton = currentButton;
                    resetPlayState();
                    // Auto-play next shlok if available
                    playNextShlok(finishedButton);
                }
                // when autoPlayActive is true, the auto flow is handled by the playShlokFromDiv ended handler
            });
            audio.addEventListener('play', () => {
                if (playBtn) {
                    playBtn.innerHTML = ICONS.pause;
                    playBtn.classList.add('playing');
                }
                if (currentButton) {
                    currentButton.innerHTML = ICONS.pause;
                    currentButton.classList.add('playing');
                }
                isPlaying = true;
            });
            audio.addEventListener('pause', () => {
                if (playBtn) {
                    playBtn.innerHTML = ICONS.play;
                    playBtn.classList.remove('playing');
                }
                if (currentButton) {
                    currentButton.innerHTML = ICONS.play;
                    currentButton.classList.remove('playing');
                }
                isPlaying = false;
            });
            audio.addEventListener('error', (e) => {
                console.error('Audio error:', e);
                if (currentAudio === audio) {
                    currentAudio = null;
                }
                showNotification('Audio file not found: ' + audio.src.split('/').pop(), 'warning');
                resetPlayState();
            });

            updateProgress();
        }
    }

    // Reset play state
    function resetPlayState() {
        const playBtn = document.getElementById('modalPlayBtn');
        if (playBtn) {
            playBtn.innerHTML = ICONS.play;
            playBtn.classList.remove('playing');
        }
        if (currentButton) {
            currentButton.innerHTML = ICONS.play;
            currentButton.classList.remove('playing');
            currentButton.disabled = false;
            currentButton = null;
        }
        isPlaying = false;
        clearInterval(progressInterval);
    }

    // Close modal cleanly and stop any active autoplay
    function closeModal() {
        const modal = document.getElementById('shlokAudioPlayer');
        if (autoPlayActive) {
            stopAutoPlay(true);
        } else {
            // Ensure UI controls are always reset cleanly
            const autoBtn = document.getElementById('modalAutoBtn');
            const stopBtn = document.getElementById('modalStopAutoBtn');
            if (autoBtn) autoBtn.style.display = 'inline-block';
            if (stopBtn) stopBtn.style.display = 'none';
        }
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        resetPlayState();
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Show modal
    function showModal(audio, title) {
        const modal = document.getElementById('shlokAudioPlayer') || createModalPlayer();
        modal.classList.add('show');
        updateModalUI(audio, title);
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `tts-notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'status');
        notification.setAttribute('aria-live', 'polite');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            font-weight: 500;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Play next shlok in sequence
    function playNextShlok(fromButton = currentButton) {
        if (!fromButton) return;
        
        const currentDiv = fromButton.closest('[id^="SH_S"]');
        if (!currentDiv) return;
        
        // Find next shlok div
        let nextDiv = currentDiv.nextElementSibling;
        while (nextDiv) {
            if (nextDiv.id && nextDiv.id.startsWith('SH_S')) {
                const nextButton = nextDiv.querySelector('.shlok-play-btn');
                if (nextButton) {
                    setTimeout(() => {
                        playShlokFromDiv(nextDiv, nextButton);
                    }, 500);
                }
                break;
            }
            nextDiv = nextDiv.nextElementSibling;
        }
    }

    // Play shlok from specific div
    function playShlokFromDiv(shlokDiv, button) {
        const shlokNumber = getShlokNumber(shlokDiv.id);
        if (!shlokNumber) {
            showNotification('❌ Cannot identify shlok', 'warning');
            return;
        }

        const audioPath = getAudioPath(shlokNumber);
        const title = getShlokTitle(shlokDiv);
        const isSameButton = currentButton === button;
        const isAudioPlaying = currentAudio && !currentAudio.paused && !currentAudio.ended;

        if (isSameButton && currentAudio) {
            if (isAudioPlaying) {
                currentAudio.pause();
            } else {
                currentAudio.play();
            }
            return;
        }

        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        if (currentButton) {
            currentButton.innerHTML = ICONS.play;
            currentButton.classList.remove('playing');
            currentButton.disabled = false;
        }

        // Create new audio
        const audio = new Audio(audioPath);
        audio.playbackRate = currentSpeed;

        audio.addEventListener('canplaythrough', () => {
            if (currentAudio !== audio) return; // Guard against canceled loads
            audio.playbackRate = currentSpeed;
            button.innerHTML = ICONS.pause;
            button.classList.add('playing');
            button.disabled = false;

            showModal(audio, title);
            audio.play();
            showNotification(`Playing: ${title}`, 'success');
        }, { once: true });

        audio.addEventListener('error', (e) => {
            console.error('Audio load error:', e, 'audio src:', audio.src);
            if (currentAudio === audio) {
                currentAudio = null;
            }
            if (currentButton === button) {
                currentButton = null;
            }
            button.innerHTML = ICONS.play;
            button.classList.remove('playing');
            button.disabled = false;
            isPlaying = false;
            showNotification(`Audio file missing: ${audio.src.split('/').pop()}`, 'warning');
        });

        // Track current shlok number for autoplay handling
        currentShlokNumber = parseInt(shlokNumber, 10);

        // When audio ends while in autoplay mode, advance to the next number until end
        audio.addEventListener('ended', () => {
            if (autoPlayActive) {
                const nextNum = currentShlokNumber + 1;
                if (autoPlayEnd && nextNum <= autoPlayEnd) {
                    playShlokByNumber(nextNum);
                } else {
                    stopAutoPlay();
                    resetPlayState();
                }
            }
        });

        button.innerHTML = ICONS.loading;
        button.disabled = true;

        currentAudio = audio;
        currentButton = button;

        // Start loading
        audio.load();
    }

    // Play a shlok by its number (e.g., 1..120)
    function playShlokByNumber(n) {
        const num = parseInt(n, 10);
        if (isNaN(num)) {
            showNotification('❌ Invalid shlok number', 'warning');
            stopAutoPlay();
            return;
        }
        const div = document.querySelector(`#SH_S${num}`);
        if (!div) {
            showNotification(`❌ Shlok not found: ${num}`, 'warning');
            stopAutoPlay();
            return;
        }
        const btn = div.querySelector('.shlok-play-btn');
        if (!btn) {
            showNotification(`❌ No audio button for shlok: ${num}`, 'warning');
            stopAutoPlay();
            return;
        }
        playShlokFromDiv(div, btn);
    }

    // Start autoplay from start->end (inclusive)
    function startAutoPlay(start, end) {
        const s = parseInt(start, 10);
        const e = parseInt(end, 10);
        if (isNaN(s) || isNaN(e) || s < 1 || e < s) {
            showNotification('❌ Invalid autoplay range', 'warning');
            return;
        }
        autoPlayActive = true;
        autoPlayEnd = e;
        // toggle modal controls
        const autoBtn = document.getElementById('modalAutoBtn');
        const stopBtn = document.getElementById('modalStopAutoBtn');
        if (autoBtn) autoBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'inline-block';
        playShlokByNumber(s);
    }

    function stopAutoPlay(silent = false) {
        autoPlayActive = false;
        autoPlayEnd = null;
        const autoBtn = document.getElementById('modalAutoBtn');
        const stopBtn = document.getElementById('modalStopAutoBtn');
        if (autoBtn) autoBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'none';
        if (!silent) {
            showNotification('Auto play stopped', 'info');
        }
    }

    // Add play buttons to all shloks
    function addPlayButtons() {
        const shlokDivs = document.querySelectorAll('[id^="SH_S"]');
        
        shlokDivs.forEach(div => {
            // Skip if button already exists
            if (div.querySelector('.shlok-play-btn')) return;
            
            const shlokNumber = getShlokNumber(div.id);
            if (!shlokNumber) return;
            
            // Create play button
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'shlok-play-btn';
            button.innerHTML = ICONS.play;
            button.setAttribute('aria-label', `Play Shlok ${shlokNumber}`);
            button.setAttribute('title', `Listen to Shlok ${shlokNumber}`);
            button.dataset.shlokId = shlokNumber;
            
            // Add click handler
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                playShlokFromDiv(div, button);
            });
            
            // Wrap content for proper layout
            div.style.position = 'relative';
            div.style.display = 'flex';
            div.style.alignItems = 'flex-start';
            div.style.gap = '10px';
            
            const contentWrapper = document.createElement('div');
            contentWrapper.style.flex = '1';
            
            // Move existing content into wrapper
            while (div.firstChild) {
                contentWrapper.appendChild(div.firstChild);
            }
            
            div.appendChild(button);
            div.appendChild(contentWrapper);
        });
    }

    // Setup modal event listeners
    function setupModalListeners() {
        const progressContainer = document.getElementById('modalProgressContainer');
        if (progressContainer) {
            attachProgressKeydownListener(progressContainer);
        }

        // Delegated keydown for progress bar seeking
        document.addEventListener('keydown', (e) => {
            const container = e.target && (e.target.id === 'modalProgressContainer' || (e.target.closest && e.target.closest('.modal-progress')));
            if (container) {
                attachProgressKeydownListener(container);
            }
        });

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('shlokAudioPlayer');
            if (!modal) return;
            
            const closeBtn = document.getElementById('modalCloseBtn');
            const playBtn = document.getElementById('modalPlayBtn');
            const speedBtn = document.getElementById('modalSpeedBtn');
            const autoBtn = document.getElementById('modalAutoBtn');
            const stopAutoBtn = document.getElementById('modalStopAutoBtn');
            const autoStartInput = document.getElementById('modalAutoStart');
            const autoEndInput = document.getElementById('modalAutoEnd');
            
            // Close modal
            if (closeBtn && closeBtn.contains(e.target)) {
                closeModal();
                return;
            }

            // Seek on progress bar click
            const progressContainer = e.target.closest('.modal-progress');
            if (progressContainer && modal.contains(progressContainer) && currentAudio && Number.isFinite(currentAudio.duration) && currentAudio.duration > 0) {
                const rect = progressContainer.getBoundingClientRect();
                if (rect.width > 0) {
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    currentAudio.currentTime = currentAudio.duration * ratio;
                    const progressBar = document.getElementById('modalProgressBar');
                    const currentTimeEl = document.getElementById('modalCurrentTime');
                    if (progressBar) progressBar.style.width = `${ratio * 100}%`;
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentAudio.currentTime);
                    progressContainer.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
                }
                return;
            }
            
            // Play/Pause toggle
            if (playBtn && playBtn.contains(e.target)) {
                if (currentAudio) {
                    if (isPlaying) {
                        currentAudio.pause();
                    } else {
                        currentAudio.play();
                    }
                }
            }
            
            // Speed control
            if (speedBtn && speedBtn.contains(e.target)) {
                const speeds = [1.0, 1.25, 1.5, 0.75];
                const currentIndex = speeds.indexOf(currentSpeed);
                const nextIndex = (currentIndex + 1) % speeds.length;
                currentSpeed = speeds[nextIndex];
                if (currentAudio) {
                    currentAudio.playbackRate = currentSpeed;
                }
                speedBtn.textContent = (currentSpeed === 1 ? '1.0' : currentSpeed) + 'x';
            }

            // Autoplay start
            if (autoBtn && autoBtn.contains(e.target)) {
                const s = autoStartInput ? autoStartInput.value : '';
                const en = autoEndInput ? autoEndInput.value : '';
                // default to full range if end not provided
                const startVal = s || '1';
                const endVal = en || '120';
                startAutoPlay(startVal, endVal);
            }

            // Autoplay stop
            if (stopAutoBtn && stopAutoBtn.contains(e.target)) {
                stopAutoPlay();
                if (currentAudio) currentAudio.pause();
                resetPlayState();
            }
        });
    }

    // Add global keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape: Close audio player modal
            if (e.key === 'Escape') {
                const modal = document.getElementById('shlokAudioPlayer');
                if (modal && modal.classList.contains('show')) {
                    e.preventDefault();
                    closeModal();
                    return;
                }
            }

            // Space: Play/Pause only when audio is active and focus is not on an interactive element
            const activeEl = document.activeElement;
            const isInteractive = activeEl && activeEl.matches('input, textarea, select, button, a, [contenteditable="true"]');
            if (e.code === 'Space' && currentAudio && !isInteractive) {
                e.preventDefault();
                if (isPlaying) {
                    currentAudio.pause();
                } else {
                    currentAudio.play();
                }
            }
            
            // Arrow Right: Next shlok
            if (e.code === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                playNextShlok();
            }
        });
    }

    // Add required CSS styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .site-icon {
                width: 1em;
                height: 1em;
                display: inline-block;
                vertical-align: -0.125em;
                flex-shrink: 0;
                fill: currentColor;
            }

            .site-icon[fill="none"] {
                fill: none;
            }

            .modal-progress {
                cursor: pointer;
                height: 8px;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .tts-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 13px;
                font-weight: 500;
            }

            .tts-notification.success {
                background: var(--status-success, #2E6F40) !important;
                color: #FFFFFF !important;
            }
            
            .tts-notification.warning {
                background: var(--status-warning, #9A6318) !important;
                color: #FFFFFF !important;
            }

            .tts-notification.info {
                background: var(--accent-primary, #8C5E32) !important;
                color: var(--text-on-accent, #FAF9F6) !important;
            }

            [data-theme="dark"] .tts-notification.warning {
                color: #111110 !important;
            }

            [data-theme="dark"] .tts-notification.success {
                color: #111110 !important;
            }

            [data-theme="dark"] .tts-notification.info {
                color: #111110 !important;
            }

            @media (prefers-color-scheme: dark) {
                :root:not([data-theme="light"]) .tts-notification.warning,
                :root:not([data-theme="light"]) .tts-notification.success,
                :root:not([data-theme="light"]) .tts-notification.info {
                    color: #111110 !important;
                }
            }
            
            .modal-controls {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }
            
            .modal-speed-btn {
                padding: 4px 10px;
                background: var(--accent-soft, rgba(140, 94, 50, 0.10));
                border: 1px solid var(--border-subtle, rgba(28, 27, 25, 0.12));
                border-radius: 15px;
                font-size: 12px;
                color: var(--accent-primary, #8C5E32);
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .modal-speed-btn:hover {
                background: var(--accent-hover, #734B26);
                color: var(--text-on-accent, #FAF9F6);
            }

            .modal-autoplay input[type="number"] {
                width: 64px;
                padding: 4px 6px;
                border-radius: 6px;
                border: 1px solid var(--border-subtle, rgba(28, 27, 25, 0.15));
                background: var(--bg-surface, #FFFFFF);
                color: var(--text-primary, #1C1B19);
                font-size: 12px;
            }

            .modal-auto-btn, .modal-stop-btn {
                padding: 4px 8px;
                border-radius: 8px;
                border: none;
                background: var(--accent-primary, #8C5E32);
                color: var(--text-on-accent, #FAF9F6);
                cursor: pointer;
                font-size: 12px;
            }

            .modal-stop-btn {
                background: var(--status-danger, #B43B32);
                color: #FFFFFF;
            }

            [data-theme="dark"] .modal-stop-btn {
                color: #111110 !important;
            }

            @media (prefers-color-scheme: dark) {
                :root:not([data-theme="light"]) .modal-stop-btn {
                    color: #111110 !important;
                }
            }
            
            .shlok-play-btn:disabled {
                opacity: 0.6;
                cursor: wait;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize everything
    function init() {
        addStyles();
        addPlayButtons();
        setupModalListeners();
        setupKeyboardShortcuts();
        
        // Re-add buttons if DOM changes (for dynamic content)
        const observer = new MutationObserver(() => addPlayButtons());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();