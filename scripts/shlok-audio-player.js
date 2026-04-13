// shlok-audio-player.js
// Audio player for Shlok Mala using local MP3 files

(function() {
    'use strict';

    let currentAudio = null;
    let currentButton = null;
    let progressInterval = null;
    let isPlaying = false;
    
    // Configuration
    const config = {
        audioPath: './audio/', // Folder where MP3 files are stored
        filePrefix: 'shlok_', // Prefix for audio files
        fileExtension: '.mp3' // Audio file format (change to .wav, .m4a etc. if needed)
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
                resetPlayState();
                // Auto-play next shlok if available
                playNextShlok();
            });
            audio.addEventListener('play', () => {
                if (playBtn) {
                    playBtn.textContent = '⏸';
                    playBtn.classList.add('playing');
                }
                isPlaying = true;
            });
            audio.addEventListener('pause', () => {
                if (playBtn) {
                    playBtn.textContent = '▶';
                    playBtn.classList.remove('playing');
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

        // Stop current audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        if (currentButton) {
            currentButton.textContent = '▶';
            currentButton.classList.remove('playing');
        }

        // Check if this button is already playing
        const isCurrentlyPlaying = button.classList.contains('playing');
        
        if (!isCurrentlyPlaying) {
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
                console.error('Audio load error:', e);
                button.textContent = '▶';
                button.disabled = false;
                showNotification(`❌ Audio file missing: shlok_${shlokNumber}.mp3`, 'warning');
            });
            
            button.textContent = '⏳';
            button.disabled = true;
            
            currentAudio = audio;
            currentButton = button;
            
            // Start loading
            audio.load();
        } else {
            currentButton = null;
            const modal = document.getElementById('shlokAudioPlayer');
            if (modal) modal.classList.remove('show');
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

    // Add settings/info button
    function addInfoButton() {
        const container = document.querySelector('.container');
        if (!container || document.getElementById('audioInfoBtn')) return;
        
        const infoBtn = document.createElement('button');
        infoBtn.id = 'audioInfoBtn';
        infoBtn.innerHTML = '🎵';
        infoBtn.title = 'Audio Player Info';
        infoBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 30px;
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d4a574, #c4956a);
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(212, 165, 116, 0.4);
            z-index: 999;
            transition: all 0.3s ease;
        `;
        
        infoBtn.addEventListener('mouseenter', () => {
            infoBtn.style.transform = 'scale(1.1)';
        });
        
        infoBtn.addEventListener('mouseleave', () => {
            infoBtn.style.transform = 'scale(1)';
        });
        
        infoBtn.addEventListener('click', () => {
            showNotification('🎵 Audio files loaded from /audio/ folder | Space: Play/Pause | Ctrl+→: Next', 'info');
        });
        
        document.body.appendChild(infoBtn);
    }

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
        testAudio.addEventListener('loadedmetadata', () => {
            console.log('✅ Audio files detected successfully');
        });
        testAudio.addEventListener('error', () => {
            console.warn('⚠️ Audio files not found. Make sure they are in the /audio/ folder.');
            showNotification('📁 Place MP3 files in /audio/ folder as shlok_1.mp3, shlok_2.mp3, etc.', 'warning');
        });
        testAudio.load();
    }

    // Initialize everything
    function init() {
        addStyles();
        addPlayButtons();
        setupModalListeners();
        setupKeyboardShortcuts();
        addInfoButton();
        checkAudioAvailability();
        
        // Re-add buttons if DOM changes (for dynamic content)
        const observer = new MutationObserver(() => addPlayButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        
        console.log('🎵 Shlok Mala Audio Player initialized');
        console.log('📁 Place audio files in: /audio/shlok_1.mp3, /audio/shlok_2.mp3, etc.');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();