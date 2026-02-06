let currentFile = null;
let currentOffset = 0;
const BYTES_PER_ROW = 16;
const ROWS_PER_PAGE = 30; // Adjust based on screen height
const CHUNK_SIZE = BYTES_PER_ROW * ROWS_PER_PAGE;

// DOM Elements
const fileInput = document.getElementById('file-input');
const viewOffset = document.getElementById('view-offset');
const viewHex = document.getElementById('view-hex');
const viewAscii = document.getElementById('view-ascii');
const fileNameLabel = document.getElementById('file-name');
const fileSizeLabel = document.getElementById('file-size');
const currentRangeLabel = document.getElementById('current-range');
const loadingIndicator = document.getElementById('loading-indicator');

// Event Listeners
fileInput.addEventListener('change', handleFileSelect);
document.getElementById('btn-prev-page').addEventListener('click', () => navigate(-CHUNK_SIZE));
document.getElementById('btn-next-page').addEventListener('click', () => navigate(CHUNK_SIZE));
document.getElementById('btn-prev-line').addEventListener('click', () => navigate(-BYTES_PER_ROW));
document.getElementById('btn-next-line').addEventListener('click', () => navigate(BYTES_PER_ROW));
document.getElementById('btn-go').addEventListener('click', handleGoto);

// Scroll Wheel Support
document.getElementById('hex-view').addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY > 0) navigate(BYTES_PER_ROW);
    else navigate(-BYTES_PER_ROW);
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    currentFile = file;
    currentOffset = 0;
    
    fileNameLabel.textContent = file.name;
    fileSizeLabel.textContent = `(${formatBytes(file.size)})`;
    
    renderChunk();
}

function navigate(delta) {
    if (!currentFile) return;
    
    const newOffset = currentOffset + delta;
    
    // Bounds check
    if (newOffset < 0) {
        currentOffset = 0;
    } else if (newOffset >= currentFile.size) {
        return; // Don't go past end
    } else {
        currentOffset = newOffset;
    }
    
    renderChunk();
}

function handleGoto() {
    if (!currentFile) return;
    const input = document.getElementById('goto-offset').value;
    let offset = 0;

    // Handle Hex (0x...) or Decimal
    if (input.toLowerCase().startsWith('0x')) {
        offset = parseInt(input, 16);
    } else {
        offset = parseInt(input, 10);
    }

    if (!isNaN(offset)) {
        // Align to row
        currentOffset = Math.floor(offset / BYTES_PER_ROW) * BYTES_PER_ROW;
        if (currentOffset > currentFile.size) currentOffset = currentFile.size - CHUNK_SIZE;
        if (currentOffset < 0) currentOffset = 0;
        renderChunk();
    }
}

async function renderChunk() {
    if (!currentFile) return;

    loadingIndicator.classList.remove('hidden');

    // Calculate slice range
    const start = currentOffset;
    const end = Math.min(start + CHUNK_SIZE, currentFile.size);
    
    // Lazy Load: Read ONLY the bytes we need
    const blob = currentFile.slice(start, end);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Build Output Strings
    let htmlOffset = '';
    let htmlHex = '';
    let htmlAscii = '';

    for (let i = 0; i < bytes.length; i += BYTES_PER_ROW) {
        const rowBytes = bytes.subarray(i, i + BYTES_PER_ROW);
        
        // 1. Offset Column
        htmlOffset += `<div>${(start + i).toString(16).toUpperCase().padStart(8, '0')}</div>`;

        // 2. Hex Column
        let hexRow = '';
        for (let b = 0; b < BYTES_PER_ROW; b++) {
            if (b < rowBytes.length) {
                hexRow += rowBytes[b].toString(16).toUpperCase().padStart(2, '0') + ' ';
            } else {
                hexRow += '   '; // Filler for incomplete rows
            }
            if (b === 7) hexRow += ' '; // Extra gap in middle
        }
        htmlHex += `<div>${hexRow}</div>`;

        // 3. ASCII Column
        let asciiRow = '';
        for (let b = 0; b < rowBytes.length; b++) {
            const charCode = rowBytes[b];
            // Printable ASCII range (32-126)
            if (charCode >= 32 && charCode <= 126) {
                asciiRow += String.fromCharCode(charCode);
            } else {
                asciiRow += '.'; // Non-printable placeholder
            }
        }
        htmlAscii += `<div>${asciiRow}</div>`;
    }

    // Update DOM
    viewOffset.innerHTML = htmlOffset;
    viewHex.innerHTML = htmlHex;
    viewAscii.innerHTML = htmlAscii;
    
    currentRangeLabel.textContent = `${start.toString(16).toUpperCase()} - ${end.toString(16).toUpperCase()}`;
    loadingIndicator.classList.add('hidden');
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}