let mediaRecorder;
let recordedChunks = [];
let stream;
let timerInterval;
let startTime;

// DOM Elements
const previewVideo = document.getElementById('previewVideo');
const playbackVideo = document.getElementById('playbackVideo');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const setupPanel = document.getElementById('setupPanel'); // For disabling during record
const downloadPanel = document.getElementById('downloadPanel');
const recordingStatus = document.getElementById('recordingStatus');
const timerDisplay = document.getElementById('timerDisplay');
const micToggle = document.getElementById('micToggle');

async function startRecording() {
    try {
        // 1. Get Screen Stream (Standard)
        const displayMediaOptions = {
            video: { cursor: "always" },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        };
        
        const screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
        
        // Handle user cancelling the browser picker
        screenStream.getVideoTracks()[0].onended = () => {
            stopRecording();
        };

        // 2. Prepare Final Stream
        let finalStream = screenStream;

        // 3. Audio Mixing Logic (If Mic is requested)
        if (micToggle.checked) {
            try {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                finalStream = await mixAudioStreams(screenStream, micStream);
            } catch (err) {
                console.warn("Mic permission denied or error:", err);
                notify.info("Could not access microphone. Recording screen only.");
            }
        }

        // 4. Setup Video Preview (Muted to prevent feedback loop)
        previewVideo.srcObject = finalStream;
        previewVideo.classList.remove('hidden');
        playbackVideo.classList.add('hidden');
        downloadPanel.classList.add('hidden');

        // 5. Initialize Recorder
        // Use standard webm, supported by all major browsers
        const options = { mimeType: 'video/webm;codecs=vp9,opus' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm'; // Fallback
        }

        mediaRecorder = new MediaRecorder(finalStream, options);
        recordedChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = finishRecording;

        // 6. Start
        mediaRecorder.start();
        stream = finalStream; // Save reference to stop later
        
        // UI Updates
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        recordingStatus.classList.remove('hidden');
        startTimer();

    } catch (err) {
        console.error("Error starting capture:", err);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    
    // Stop all tracks (screen & mic) to turn off hardware indicators
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    stopTimer();
    
    // UI Updates
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    recordingStatus.classList.add('hidden');
}

function finishRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    
    // Switch to playback view
    previewVideo.classList.add('hidden');
    playbackVideo.classList.remove('hidden');
    playbackVideo.src = url;
    
    downloadPanel.classList.remove('hidden');
}

function downloadVideo() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = `recording-${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function resetRecorder() {
    playbackVideo.pause();
    playbackVideo.src = "";
    playbackVideo.classList.add('hidden');
    previewVideo.classList.remove('hidden');
    downloadPanel.classList.add('hidden');
}

// Helper: Mix Screen Audio + Mic Audio
async function mixAudioStreams(screenStream, micStream) {
    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();

    // Add Screen Audio (if available)
    if (screenStream.getAudioTracks().length > 0) {
        const screenSource = ctx.createMediaStreamSource(screenStream);
        screenSource.connect(dest);
    }

    // Add Mic Audio
    if (micStream.getAudioTracks().length > 0) {
        const micSource = ctx.createMediaStreamSource(micStream);
        micSource.connect(dest);
    }

    const mixedAudioTrack = dest.stream.getAudioTracks()[0];
    const combinedStream = new MediaStream([
        screenStream.getVideoTracks()[0],
        mixedAudioTrack
    ]);

    return combinedStream;
}

// Timer Logic
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = Date.now() - startTime;
        const seconds = Math.floor((diff / 1000) % 60);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerDisplay.textContent = "00:00";
}