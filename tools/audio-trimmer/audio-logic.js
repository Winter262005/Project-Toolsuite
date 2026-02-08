// Global Audio Variables
let audioContext;
let audioBuffer = null;
let sourceNode = null;
let isPlaying = false;

// DOM Elements
const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('waveform-canvas');
const ctx = canvas.getContext('2d');
const startSlider = document.getElementById('start-slider');
const endSlider = document.getElementById('end-slider');
const overlayLeft = document.getElementById('overlay-left');
const overlayRight = document.getElementById('overlay-right');
const startTimeDisplay = document.getElementById('start-time-display');
const endTimeDisplay = document.getElementById('end-time-display');
const durationDisplay = document.getElementById('duration-display');
const previewBtn = document.getElementById('btn-preview');
const downloadBtn = document.getElementById('btn-download');

// Event Listeners
fileInput.addEventListener('change', handleFileUpload);
startSlider.addEventListener('input', updateUI);
endSlider.addEventListener('input', updateUI);
previewBtn.addEventListener('click', togglePreview);
downloadBtn.addEventListener('click', downloadTrimmedAudio);

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset UI
    document.getElementById('waveform-ui').style.display = 'block';
    document.getElementById('slider-ui').style.display = 'block';
    document.getElementById('controls-ui').style.display = 'flex';
    previewBtn.innerText = "▶ Preview Trim";
    
    // Initialize Audio Context
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const arrayBuffer = await file.arrayBuffer();
    
    try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        drawWaveform();
        resetSliders();
        updateUI();
    } catch (error) {
        notify.error("Error decoding audio file. Please try a valid MP3 or WAV.");
        console.error(error);
    }
}

function drawWaveform() {
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    // Get raw data from left channel (usually enough for visualization)
    const rawData = audioBuffer.getChannelData(0); 
    const step = Math.ceil(rawData.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#007acc';
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        
        // Downsample for canvas width
        for (let j = 0; j < step; j++) {
            const datum = rawData[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        // Draw vertical bar for this pixel column
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
}

function resetSliders() {
    startSlider.value = 0;
    endSlider.value = 100;
}

function updateUI() {
    if (!audioBuffer) return;

    let startVal = parseFloat(startSlider.value);
    let endVal = parseFloat(endSlider.value);

    // Prevent cross-over
    if (startVal >= endVal) {
        startVal = endVal - 0.1;
        startSlider.value = startVal;
    }

    // Update Overlays
    overlayLeft.style.width = startVal + "%";
    overlayRight.style.width = (100 - endVal) + "%";

    // Update Text
    const duration = audioBuffer.duration;
    const startTime = (duration * startVal) / 100;
    const endTime = (duration * endVal) / 100;

    startTimeDisplay.innerText = `Start: ${startTime.toFixed(2)}s`;
    endTimeDisplay.innerText = `End: ${endTime.toFixed(2)}s`;
    durationDisplay.innerText = `Total: ${duration.toFixed(2)}s`;
}

function togglePreview() {
    if (isPlaying) {
        if (sourceNode) sourceNode.stop();
        isPlaying = false;
        previewBtn.innerText = "▶ Preview Trim";
        return;
    }

    if (!audioBuffer) return;

    const duration = audioBuffer.duration;
    const startVal = parseFloat(startSlider.value);
    const endVal = parseFloat(endSlider.value);
    
    const startTime = (duration * startVal) / 100;
    const endTime = (duration * endVal) / 100;
    const playDuration = endTime - startTime;

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);
    
    sourceNode.start(0, startTime, playDuration);
    isPlaying = true;
    previewBtn.innerText = "⏹ Stop Preview";

    sourceNode.onended = () => {
        isPlaying = false;
        previewBtn.innerText = "▶ Preview Trim";
    };
}

function downloadTrimmedAudio() {
    if (!audioBuffer) return;

    const duration = audioBuffer.duration;
    const startVal = parseFloat(startSlider.value);
    const endVal = parseFloat(endSlider.value);

    const startTime = (duration * startVal) / 100;
    const endTime = (duration * endVal) / 100;

    // 1. Create a new buffer for the trimmed section
    const sampleRate = audioBuffer.sampleRate;
    const startFrame = Math.floor(startTime * sampleRate);
    const endFrame = Math.floor(endTime * sampleRate);
    const frameCount = endFrame - startFrame;
    const channels = audioBuffer.numberOfChannels;

    const trimmedBuffer = audioContext.createBuffer(channels, frameCount, sampleRate);

    // 2. Copy data
    for (let i = 0; i < channels; i++) {
        const channelData = audioBuffer.getChannelData(i);
        const trimmedData = trimmedBuffer.getChannelData(i);
        // Optimized copy
        trimmedData.set(channelData.subarray(startFrame, endFrame));
    }

    // 3. Encode to WAV (Native JS)
    const wavBlob = bufferToWave(trimmedBuffer, frameCount);
    
    // 4. Trigger Download
    const url = URL.createObjectURL(wavBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'trimmed_audio.wav';
    anchor.click();
    URL.revokeObjectURL(url);
}

// Helper: Convert AudioBuffer to WAV Blob
function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // Write WAV Header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this encoder)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // Interleave channels (LRLRLR...)
    for(i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while(pos < len) {
        for(i = 0; i < numOfChan; i++) {
            // Clamp value between -1 and 1
            sample = Math.max(-1, Math.min(1, channels[i][pos]));
            // Convert to 16-bit PCM
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
            view.setInt16(44 + offset, sample, true); 
            offset += 2;
        }
        pos++;
    }

    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}