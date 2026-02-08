// Audio Context & Global Variables
let audioCtx;
let isPlaying = false;
let currentStep = 0;
let nextNoteTime = 0.0;
let timerID;
let lookahead = 25.0; // ms
let scheduleAheadTime = 0.1; // seconds
let tempo = 120;

// Notes Configuration (Pentatonic Scale for pleasant sounds)
const notes = [
    { name: "C5", freq: 523.25 },
    { name: "A4", freq: 440.00 },
    { name: "G4", freq: 392.00 },
    { name: "E4", freq: 329.63 },
    { name: "D4", freq: 293.66 },
    { name: "C4", freq: 261.63 }
];
const STEPS = 16;
const gridData = Array(STEPS).fill().map(() => Array(notes.length).fill(false));

// DOM Elements
const gridContainer = document.getElementById('sequencer-grid');
const labelsContainer = document.getElementById('note-labels');
const playBtn = document.getElementById('btn-play');
const stopBtn = document.getElementById('btn-stop');
const clearBtn = document.getElementById('btn-clear');
const waveformSelect = document.getElementById('waveform-select');
const bpmInput = document.getElementById('bpm-input');
const canvas = document.getElementById('scope');
const canvasCtx = canvas.getContext('2d');

// Analyzer for Visuals
let analyser;
let dataArray;

// --- Initialization ---

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        drawScope();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function createGrid() {
    // Create Note Labels
    notes.forEach(note => {
        const label = document.createElement('div');
        label.innerText = note.name;
        labelsContainer.appendChild(label);
    });

    // Create 16 columns
    for (let i = 0; i < STEPS; i++) {
        const col = document.createElement('div');
        col.classList.add('step-col');
        col.dataset.step = i;

        // Create rows for each note
        for (let j = 0; j < notes.length; j++) {
            const btn = document.createElement('div');
            btn.classList.add('note-btn');
            btn.dataset.note = j; // Row index
            btn.onclick = () => toggleNote(i, j, btn);
            col.appendChild(btn);
        }
        gridContainer.appendChild(col);
    }
}

function toggleNote(step, noteIndex, btnElement) {
    gridData[step][noteIndex] = !gridData[step][noteIndex];
    btnElement.classList.toggle('active');
    
    // Preview sound if enabling
    if (gridData[step][noteIndex]) {
        if (!audioCtx) initAudio();
        playTone(notes[noteIndex].freq, audioCtx.currentTime, 0.1);
    }
}

// --- Scheduler Engine ---

function nextNote() {
    const secondsPerBeat = 60.0 / tempo;
    nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
    currentStep++;
    if (currentStep === STEPS) currentStep = 0;
}

function scheduleNote(stepNumber, time) {
    // Visual Feedback Queue
    requestAnimationFrame(() => updateVisuals(stepNumber));

    // Audio Trigger
    const activeNotes = gridData[stepNumber];
    activeNotes.forEach((isActive, index) => {
        if (isActive) {
            playTone(notes[index].freq, time, 0.2); // 0.2s duration
        }
    });
}

function playTone(freq, time, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = waveformSelect.value;
    osc.frequency.value = freq;

    // Envelope (ADSR-ish)
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02); // Attack
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // Decay

    osc.connect(gain);
    gain.connect(analyser); // Connect to visualizer
    analyser.connect(audioCtx.destination); // Connect to speakers

    osc.start(time);
    osc.stop(time + duration);
}

function scheduler() {
    // While there are notes that will need to play before the next interval, schedule them
    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(currentStep, nextNoteTime);
        nextNote();
    }
    if (isPlaying) {
        timerID = setTimeout(scheduler, lookahead);
    }
}

function updateVisuals(step) {
    // Remove "playing" class from all columns
    document.querySelectorAll('.step-col').forEach(col => col.classList.remove('playing'));
    // Add to current
    const cols = document.querySelectorAll('.step-col');
    if (cols[step]) cols[step].classList.add('playing');
}

// --- Controls ---

playBtn.addEventListener('click', () => {
    initAudio();
    if (isPlaying) return;
    
    isPlaying = true;
    currentStep = 0;
    nextNoteTime = audioCtx.currentTime;
    scheduler();
});

stopBtn.addEventListener('click', () => {
    isPlaying = false;
    clearTimeout(timerID);
    document.querySelectorAll('.step-col').forEach(col => col.classList.remove('playing'));
});

clearBtn.addEventListener('click', () => {
    gridData.forEach(col => col.fill(false));
    document.querySelectorAll('.note-btn').forEach(btn => btn.classList.remove('active'));
});

bpmInput.addEventListener('change', (e) => tempo = e.target.value);

// --- Oscilloscope Visualizer ---

function drawScope() {
    requestAnimationFrame(drawScope);
    
    if(!analyser) return;
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = '#111';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#00d2ff';
    canvasCtx.beginPath();

    const sliceWidth = canvas.width * 1.0 / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);

        x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
}

// Start
createGrid();