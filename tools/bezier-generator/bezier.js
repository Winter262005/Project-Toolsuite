const canvas = document.getElementById('curve-canvas');
const ctx = canvas.getContext('2d');
const outputBox = document.getElementById('output');
const runner = document.getElementById('runner');
const testBtn = document.getElementById('btn-test');

const size = 300;
const padding = 0; // Full width

// Control Points (Normalized 0-1)
// Initial: ease (.25, .1, .25, 1)
let p1 = { x: 0.25, y: 0.1 };
let p2 = { x: 0.25, y: 1.0 };

let isDragging = null; // 'p1' or 'p2'

// --- Interaction ---

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    
    // Check distance to handles (tolerance 20px)
    if (dist(pos, mapToCanvas(p1)) < 20) isDragging = 'p1';
    else if (dist(pos, mapToCanvas(p2)) < 20) isDragging = 'p2';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left) / size;
    let y = 1 - ((e.clientY - rect.top) / size); // Flip Y

    // Constrain X to 0-1 (Time cannot go backwards)
    x = Math.max(0, Math.min(1, x));
    
    // Y can go outside 0-1 (for bounce effects)

    if (isDragging === 'p1') { p1 = { x, y }; }
    else { p2 = { x, y }; }

    update();
});

document.addEventListener('mouseup', () => {
    isDragging = null;
});

testBtn.addEventListener('click', () => {
    runner.classList.remove('move');
    // Trigger reflow to restart animation
    void runner.offsetWidth;
    runner.classList.add('move');
});

outputBox.addEventListener('click', () => {
    navigator.clipboard.writeText(outputBox.innerText);
    const original = outputBox.innerText;
    outputBox.innerText = "Copied!";
    setTimeout(() => outputBox.innerText = original, 1000);
});

// --- Core Logic ---

function setPreset(x1, y1, x2, y2) {
    p1 = { x: x1, y: y1 };
    p2 = { x: x2, y: y2 };
    update();
    testBtn.click();
}

function update() {
    draw();
    updateOutput();
}

function updateOutput() {
    const txt = `cubic-bezier(${format(p1.x)}, ${format(p1.y)}, ${format(p2.x)}, ${format(p2.y)})`;
    outputBox.innerText = txt;
    
    // Update Animation on the runner
    runner.style.transition = `left 1s ${txt}`;
}

function draw() {
    ctx.clearRect(0, 0, size, size);
    
    // 1. Grid / Diagonal
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.stroke();

    // 2. Handles (Lines)
    const c1 = mapToCanvas(p1);
    const c2 = mapToCanvas(p2);
    const start = { x: 0, y: size };
    const end = { x: size, y: 0 };

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    
    // Line Start -> P1
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(c1.x, c1.y);
    ctx.stroke();

    // Line End -> P2
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.stroke();

    // 3. The Curve (Bezier)
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
    ctx.stroke();

    // 4. Handle Points (Circles)
    drawPoint(c1, '#ff0055'); // P1
    drawPoint(c2, '#00ffaa'); // P2
}

function drawPoint(pos, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// --- Helpers ---

function mapToCanvas(p) {
    return {
        x: p.x * size,
        y: size - (p.y * size) // Flip Y
    };
}

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function dist(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function format(n) {
    // Round to 2 decimals, remove trailing zeros
    return parseFloat(n.toFixed(2));
}

// Init
update();