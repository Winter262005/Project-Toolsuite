const workspace = document.getElementById('workspace');
const wireLayer = document.getElementById('wire-layer');
const tableOutput = document.getElementById('table-output');

let gates = [];
let wires = []; // { from: {gateId, type}, to: {gateId, index} }
let draggedGate = null;
let offset = { x: 0, y: 0 };
let tempWire = null; // Used when dragging a wire
let connectingStart = null; // { gateId, type ('output') }

let uniqueId = 0;

// Gate Definitions
const GATE_TYPES = {
    AND: { inputs: 2, color: '#4caf50', logic: (inps) => inps[0] && inps[1] },
    OR:  { inputs: 2, color: '#2196f3', logic: (inps) => inps[0] || inps[1] },
    NOT: { inputs: 1, color: '#f44336', logic: (inps) => !inps[0] },
    XOR: { inputs: 2, color: '#9c27b0', logic: (inps) => inps[0] !== inps[1] },
    SWITCH: { inputs: 0, color: '#00d2ff', logic: () => false }, // State handled manually
    BULB:   { inputs: 1, color: '#ffeb3b', logic: (inps) => inps[0] }
};

// --- Initialization ---
function addGate(type) {
    const id = uniqueId++;
    const config = GATE_TYPES[type];
    
    const gate = {
        id: id,
        type: type,
        x: 50 + (gates.length * 20),
        y: 50 + (gates.length * 20),
        inputs: Array(config.inputs).fill(false),
        output: false,
        element: null
    };

    // Create DOM
    const el = document.createElement('div');
    el.className = `gate ${type.toLowerCase()}`;
    el.id = `gate-${id}`;
    el.style.left = gate.x + 'px';
    el.style.top = gate.y + 'px';

    // Inputs
    const inputContainer = document.createElement('div');
    inputContainer.style.display = 'flex';
    inputContainer.style.flexDirection = 'column';
    inputContainer.style.gap = '10px';
    
    for(let i=0; i<config.inputs; i++) {
        const term = document.createElement('div');
        term.className = 'terminal input';
        term.title = 'Input';
        term.onclick = (e) => handleTerminalClick(e, id, 'input', i);
        inputContainer.appendChild(term);
    }
    el.appendChild(inputContainer);

    // Title / Switch
    const title = document.createElement('div');
    title.className = 'gate-title';
    if (type === 'SWITCH') {
        title.innerText = "0";
        title.style.cursor = 'pointer';
        title.style.pointerEvents = 'auto'; // allow click
        title.onclick = () => toggleSwitch(gate);
    } else {
        title.innerText = type;
    }
    el.appendChild(title);

    // Output
    if (type !== 'BULB') {
        const term = document.createElement('div');
        term.className = 'terminal output';
        term.title = 'Output';
        term.onclick = (e) => handleTerminalClick(e, id, 'output', 0);
        el.appendChild(term);
    }

    // Drag Logic
    el.addEventListener('mousedown', (e) => {
        if(e.target.classList.contains('terminal') || (type === 'SWITCH' && e.target.classList.contains('gate-title'))) return;
        draggedGate = gate;
        offset.x = e.clientX - gate.x;
        offset.y = e.clientY - gate.y;
    });

    gate.element = el;
    workspace.appendChild(el);
    gates.push(gate);
}

// --- Interaction ---

document.addEventListener('mousemove', (e) => {
    if (draggedGate) {
        draggedGate.x = e.clientX - offset.x;
        draggedGate.y = e.clientY - offset.y;
        draggedGate.element.style.left = draggedGate.x + 'px';
        draggedGate.element.style.top = draggedGate.y + 'px';
        drawWires();
    }
});

document.addEventListener('mouseup', () => {
    draggedGate = null;
});

function handleTerminalClick(e, gateId, type, index) {
    e.stopPropagation();

    if (type === 'output') {
        // Start connection
        connectingStart = { gateId, index };
        workspace.style.cursor = 'crosshair';
    } else if (type === 'input') {
        // Complete connection
        if (connectingStart) {
            // Remove existing wire to this input if any
            wires = wires.filter(w => !(w.to.gateId === gateId && w.to.index === index));
            
            wires.push({
                from: connectingStart,
                to: { gateId, index }
            });
            connectingStart = null;
            workspace.style.cursor = 'default';
            simulate();
            drawWires();
        }
    }
}

function toggleSwitch(gate) {
    gate.output = !gate.output;
    gate.element.querySelector('.gate-title').innerText = gate.output ? "1" : "0";
    gate.element.querySelector('.gate-title').style.color = gate.output ? "#4caf50" : "#e0e0e0";
    simulate();
}

// --- Simulation Engine ---

function simulate() {
    // Simple propagation loop (running multiple times to settle signals)
    // For a robust system, we would use topological sort, but simple iteration works for small DAGs
    for (let pass = 0; pass < gates.length + 1; pass++) {
        gates.forEach(gate => {
            if (gate.type === 'SWITCH') return; // State is manual

            // Gather inputs from wires
            const inputValues = Array(gate.inputs.length).fill(false);
            
            wires.forEach(wire => {
                if (wire.to.gateId === gate.id) {
                    const sourceGate = gates.find(g => g.id === wire.from.gateId);
                    if (sourceGate) {
                        inputValues[wire.to.index] = sourceGate.output;
                    }
                }
            });

            // Logic
            gate.output = GATE_TYPES[gate.type].logic(inputValues);

            // Visual Update
            if (gate.type === 'BULB') {
                if (gate.output) gate.element.classList.add('on');
                else gate.element.classList.remove('on');
            }
        });
    }
    drawWires();
}

// --- Rendering ---

function drawWires() {
    wireLayer.innerHTML = ''; // Clear SVG
    
    wires.forEach(wire => {
        const fromGate = gates.find(g => g.id === wire.from.gateId);
        const toGate = gates.find(g => g.id === wire.to.gateId);
        if(!fromGate || !toGate) return;

        // Calculate Coordinates
        // Output is on right side
        const x1 = fromGate.x + fromGate.element.offsetWidth; 
        const y1 = fromGate.y + 20; // Middle approx

        // Input is on left side. Calculate offset based on index
        const inputHeight = toGate.element.offsetHeight / (toGate.inputs.length || 1);
        const inputYOffset = (wire.to.index * 15) + 20; // Approximate visual alignment
        
        const x2 = toGate.x;
        const y2 = toGate.y + inputYOffset;

        // Draw Curve
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const c1 = x1 + 50; // Control points
        const c2 = x2 - 50;
        const d = `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', fromGate.output ? '#4caf50' : '#555');
        
        wireLayer.appendChild(path);
    });
}

// --- Truth Table Generator ---

function generateTable() {
    const inputs = gates.filter(g => g.type === 'SWITCH');
    const outputs = gates.filter(g => g.type === 'BULB');

    if (inputs.length === 0 || outputs.length === 0) {
        tableOutput.innerHTML = '<p style="color:#f44336; text-align:center;">Need at least 1 Input and 1 Output.</p>';
        return;
    }
    if (inputs.length > 4) {
        tableOutput.innerHTML = '<p style="color:#f44336; text-align:center;">Too many inputs (>4) for auto-generation.</p>';
        return;
    }

    // Save current state
    const savedStates = inputs.map(g => g.output);

    // Generate HTML
    let html = '<table><thead><tr>';
    inputs.forEach((g, i) => html += `<th>In ${i+1}</th>`);
    outputs.forEach((g, i) => html += `<th>Out ${i+1}</th>`);
    html += '</tr></thead><tbody>';

    // Iterate 2^N
    const combinations = Math.pow(2, inputs.length);
    for (let i = 0; i < combinations; i++) {
        // Set states
        inputs.forEach((inp, idx) => {
            // Bit manipulation to get 0/1 for this position
            const bit = (i >> (inputs.length - 1 - idx)) & 1;
            inp.output = bit === 1;
        });

        simulate();

        // Record row
        // Check if this row matches CURRENT simulation state to highlight it
        const currentMatch = inputs.every((inp, idx) => inp.output === savedStates[idx]); // wait, savedStates is old. 
        // Logic: We don't need to highlight active row here, just generate data.
        
        html += `<tr>`;
        inputs.forEach(inp => html += `<td>${inp.output ? 1 : 0}</td>`);
        outputs.forEach(out => html += `<td style="color:${out.output ? '#4caf50' : '#aaa'}">${out.output ? 1 : 0}</td>`);
        html += `</tr>`;
    }
    html += '</tbody></table>';
    tableOutput.innerHTML = html;

    // Restore state
    inputs.forEach((inp, idx) => inp.output = savedStates[idx]);
    simulate();
}

function clearWorkspace() {
    workspace.innerHTML = '<svg id="wire-layer"></svg><div class="toolbar"><button class="action-btn" onclick="clearWorkspace()">Clear All</button></div>';
    gates = [];
    wires = [];
    uniqueId = 0;
    tableOutput.innerHTML = '';
}

// Initial Demo
addGate('SWITCH');
addGate('SWITCH');
addGate('AND');
addGate('BULB');