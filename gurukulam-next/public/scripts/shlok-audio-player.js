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
    
    // Configuration
    const config = {
        audioPath: 'Shlok_audio/', // Folder where audio files are stored relative to this page
        filePrefix: 'shlok_', // Prefix for audio files
        fileExtension: '.m4a' // Audio file format (this page uses .m4a files)
    };

    // Create floating audio player modal
    function createModalPlayer() {
        const modal = document.createElement('div');
        modal.className = 'audio-player-modal';
        modal.id = 'shlokAudioPlayer';
        modal.innerHTML = `
            <button class="modal-play-btn" id="modalPlayBtn">▶</button>
            <div class="modal-info">
                <div class="modal-title" id="modalTitle">Select a Shlok</div>
                <div class="modal-progress">
                    <div class="modal-progress-bar" id="modalProgressBar"></div>
                </div>
                <div class="modal-time">
                    <span id="modalCurrentTime">0:00</span>
                    <span id="modalDuration">0:00</span>
                </div>
                <div class="modal-controls">
                    <button class="modal-speed-btn" id="modalSpeedBtn">1.0x</button>
                    <div class="modal-autoplay">
                        <input type="number" id="modalAutoStart" min="1" max="120" placeholder="Start" />
                        <input type="number" id="modalAutoEnd" min="1" max="120" placeholder="End" />
                        <button id="modalAutoBtn" class="modal-auto-btn">Auto</button>
                        <button id="modalStopAutoBtn" class="modal-stop-btn" style="display:none">Stop</button>
                    </div>
                </div>
            </div>
            <button class="modal-close" id="modalCloseBtn">✕</button>
        `;
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
                }
            };

            audio.addEventListener('loadedmetadata', updateProgress);
            audio.addEventListener('timeupdate', updateProgress);
            audio.addEventListener('ended', () => {
                if (!autoPlayActive) {
                    resetPlayState();
                    // Auto-play next shlok if available
                    playNextShlok();
                }
                // when autoPlayActive is true, the auto flow is handled by the playShlokFromDiv ended handler
            });
            audio.addEventListener('play', () => {
                if (playBtn) {
                    playBtn.textContent = '⏸';
                    playBtn.classList.add('playing');
                }
                if (currentButton) {
                    currentButton.textContent = '⏸';
                    currentButton.classList.add('playing');
                }
                isPlaying = true;
            });
            audio.addEventListener('pause', () => {
                if (playBtn) {
                    playBtn.textContent = '▶';
                    playBtn.classList.remove('playing');
                }
                if (currentButton) {
                    currentButton.textContent = '▶';
                    currentButton.classList.remove('playing');
                }
                isPlaying = false;
            });
            audio.addEventListener('error', (e) => {
                console.error('Audio error:', e);
                showNotification('⚠️ Audio file not found: ' + audio.src, 'warning');
                resetPlayState();
            });

            updateProgress();
        }
    }

    // Reset play state
    function resetPlayState() {
        const playBtn = document.getElementById('modalPlayBtn');
        if (playBtn) {
            playBtn.textContent = '▶';
            playBtn.classList.remove('playing');
        }
        if (currentButton) {
            currentButton.textContent = '▶';
            currentButton.classList.remove('playing');
            currentButton.disabled = false;
            currentButton = null;
        }
        isPlaying = false;
        clearInterval(progressInterval);
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
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'warning' ? '#f39c12' : '#d4a574'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Noto Sans', sans-serif;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Play next shlok in sequence
    function playNextShlok() {
        if (!currentButton) return;
        
        const currentDiv = currentButton.closest('[id^="SH_S"]');
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
            currentButton.textContent = '▶';
            currentButton.classList.remove('playing');
            currentButton.disabled = false;
        }

        // Create new audio
        const audio = new Audio(audioPath);

        audio.addEventListener('canplaythrough', () => {
            button.textContent = '⏸';
            button.classList.add('playing');
            button.disabled = false;

            showModal(audio, title);
            audio.play();
            showNotification(`🎵 Playing: ${title}`, 'success');
        });

        audio.addEventListener('error', (e) => {
            console.error('Audio load error:', e, 'audio src:', audio.src);
            button.textContent = '▶';
            button.disabled = false;
            showNotification(`❌ Audio file missing: ${audio.src.split('/').pop()}`, 'warning');
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

        button.textContent = '⏳';
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

    function stopAutoPlay() {
        autoPlayActive = false;
        autoPlayEnd = null;
        const autoBtn = document.getElementById('modalAutoBtn');
        const stopBtn = document.getElementById('modalStopAutoBtn');
        if (autoBtn) autoBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'none';
        showNotification('⏹️ Auto play stopped', 'info');
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
            button.className = 'shlok-play-btn';
            button.innerHTML = '▶';
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
                if (currentAudio) {
                    currentAudio.pause();
                }
                resetPlayState();
                modal.classList.remove('show');
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
                if (currentAudio) {
                    const speeds = [1.0, 1.25, 1.5, 0.75];
                    const currentSpeed = currentAudio.playbackRate;
                    const nextIndex = (speeds.indexOf(currentSpeed) + 1) % speeds.length;
                    currentAudio.playbackRate = speeds[nextIndex];
                    speedBtn.textContent = speeds[nextIndex] + 'x';
                }
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
            // Space: Play/Pause (if not typing in input)
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (currentAudio) {
                    if (isPlaying) {
                        currentAudio.pause();
                    } else {
                        currentAudio.play();
                    }
                }
            }
            
            // Arrow Right: Next shlok
            if (e.code === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                playNextShlok();
            }
        });
    }

    // (Removed: floating audio info button)

    // Add required CSS styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
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
            
            .tts-notification.warning {
                background: #f39c12 !important;
            }
            
            .modal-controls {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }
            
            .modal-speed-btn {
                padding: 4px 10px;
                background: rgba(212, 175, 55, 0.2);
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 15px;
                font-size: 12px;
                color: #5c3a21;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .modal-speed-btn:hover {
                background: rgba(212, 175, 55, 0.3);
            }

            .modal-autoplay input[type="number"] {
                width: 64px;
                padding: 4px 6px;
                border-radius: 6px;
                border: 1px solid rgba(0,0,0,0.08);
                font-size: 12px;
            }

            .modal-auto-btn, .modal-stop-btn {
                padding: 4px 8px;
                border-radius: 8px;
                border: none;
                background: #d4a574;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
            }

            .modal-stop-btn {
                background: #c94b4b;
            }
            
            .shlok-play-btn:disabled {
                opacity: 0.6;
                cursor: wait;
            }
        `;
        document.head.appendChild(style);
    }

    // Check if audio files exist (optional)
    async function checkAudioAvailability() {
        const firstShlok = document.querySelector('[id="SH_S1"]');
        if (!firstShlok) return;
        
        const testAudio = new Audio(getAudioPath('1'));
        console.log('🔎 Testing audio path:', getAudioPath('1'));
        testAudio.addEventListener('loadedmetadata', () => {
            console.log('✅ Audio file found at:', testAudio.src);
        });
        testAudio.addEventListener('error', () => {
            console.warn('⚠️ Audio files not found. Make sure they are in the Shlok_audio/ folder relative to this page.');
            showNotification(`📁 Cannot load ${getAudioPath('1')}. Place audio files in Shlok_audio/ folder as shlok_1.m4a, shlok_2.m4a, etc.`, 'warning');
        });
        testAudio.load();
    }

    // Initialize everything
    function init() {
        addStyles();
        addPlayButtons();
        setupModalListeners();
        setupKeyboardShortcuts();
        checkAudioAvailability();
        
        // Re-add buttons if DOM changes (for dynamic content)
        const observer = new MutationObserver(() => addPlayButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        
        console.log('🎵 Shlok Mala Audio Player initialized');
console.log('📁 Place audio files in: ./Shlok_audio/shlok_1.m4a, ./Shlok_audio/shlok_2.m4a, etc.');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();