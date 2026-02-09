const synth = window.speechSynthesis;

// DOM Elements
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const rateInput = document.getElementById('rate');
const pitchInput = document.getElementById('pitch');
const rateVal = document.getElementById('rate-val');
const pitchVal = document.getElementById('pitch-val');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const btnStop = document.getElementById('btn-stop');
const statusText = document.getElementById('status-text');

let voices = [];

// --- Initialization ---

function populateVoices() {
    voices = synth.getVoices();
    
    // Sort alphabetically by name
    voices.sort((a, b) => a.name.localeCompare(b.name));

    voiceSelect.innerHTML = '';
    
    // Filter for common useful voices or show all
    voices.forEach(voice => {
        const option = document.createElement('option');
        option.textContent = `${voice.name} (${voice.lang})`;
        
        if (voice.default) {
            option.textContent += ' -- DEFAULT';
        }
        
        option.setAttribute('data-lang', voice.lang);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });

    if (voices.length === 0) {
        const option = document.createElement('option');
        option.textContent = "No voices found (API not supported?)";
        voiceSelect.appendChild(option);
    }
}

// Firefox/Chrome handle voice loading differently
populateVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
}

// --- Controls ---

btnPlay.addEventListener('click', () => {
    // If paused, just resume
    if (synth.paused) {
        synth.resume();
        updateStatus('Speaking...');
        return;
    }

    // If speaking (but not paused), stop first to restart
    if (synth.speaking) {
        synth.cancel();
    }

    const text = textInput.value;
    if (text.trim() === '') {
        updateStatus('Please enter some text first.');
        return;
    }

    speak(text);
});

btnPause.addEventListener('click', () => {
    if (synth.speaking && !synth.paused) {
        synth.pause();
        updateStatus('Paused');
    }
});

btnStop.addEventListener('click', () => {
    synth.cancel();
    updateStatus('Stopped');
});

// Sliders UI update
rateInput.addEventListener('input', e => rateVal.textContent = e.target.value);
pitchInput.addEventListener('input', e => pitchVal.textContent = e.target.value);

// --- Core Logic ---

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);

    // Get selected voice
    const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
    const selectedVoice = voices.find(v => v.name === selectedOption);
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    // Apply settings
    utterance.rate = rateInput.value;
    utterance.pitch = pitchInput.value;

    // Events
    utterance.onstart = () => {
        updateStatus('Speaking...', true);
    };

    utterance.onend = () => {
        updateStatus('Finished');
    };

    utterance.onerror = (e) => {
        console.error('SpeechSynthesis Error:', e);
        updateStatus('Error occurred in playback');
    };

    synth.speak(utterance);
}

function updateStatus(msg, isActive = false) {
    statusText.textContent = msg;
    if (isActive) {
        statusText.classList.add('speaking');
    } else {
        statusText.classList.remove('speaking');
    }
}