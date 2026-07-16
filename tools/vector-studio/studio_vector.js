/**
 * Vector Studio Engine
 * Handles Canvas rendering, shape math, and interaction logic.
 */

class VectorEngine {
    constructor() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');

        // State
        this.shapes = [];
        this.tool = 'select';
        this.isDragging = false;
      this.selection = null;
this.selectedShapes = [];
        this.dragStart = { x: 0, y: 0 };
        this.currentShape = null;
        this.dragStartState = null;

        this.undoStack = [];
        this.redoStack = [];

        // Init
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupEvents();
        this.loop();

        // Try to restore previously saved shapes
        this.loadFromLocalStorage();

        console.log(">> VECTOR ENGINE INITIALIZED");
    }

isSelected(shape) {
    return this.selectedShapes.includes(shape);
}

clearSelection() {
    this.selectedShapes = [];
    this.selection = null;
    this.updatePropsUI();
}
selectSingle(shape) {
    this.selectedShapes = [shape];
    this.selection = shape;
}

toggleSelection(shape) {
    const index = this.selectedShapes.indexOf(shape);

    if (index === -1) {
        this.selectedShapes.push(shape);
    } else {
        this.selectedShapes.splice(index, 1);
    }

    // Keep selection pointing to the most recently selected shape
    this.selection =
        this.selectedShapes.length > 0
            ? this.selectedShapes[this.selectedShapes.length - 1]
            : null;
}

duplicateSelected() {
    if (this.selectedShapes.length === 0) {
        alert("No shape selected. Please select a shape to duplicate.");
        return;
    }

    this.saveState();

    const offset = 20;

    const duplicatedShapes = this.selectedShapes.map(shape => {
        const duplicate = JSON.parse(
            JSON.stringify(shape)
        );

        duplicate.x += offset;
        duplicate.y += offset;

        if (['line', 'arrow'].includes(duplicate.type)) {
            duplicate.ex += offset;
            duplicate.ey += offset;
        }

        return duplicate;
    });

    this.shapes.push(...duplicatedShapes);

    this.selectedShapes = duplicatedShapes;

    this.selection =
        duplicatedShapes[duplicatedShapes.length - 1];

    this.saveToLocalStorage();
    this.updatePropsUI();
}

    // --- MATH UTILS ---

    snap(val) {
        const gridSize = parseInt(document.getElementById('gridSize').value) || 20;
        return Math.round(val / gridSize) * gridSize;
    }

    // Point in Polygon test (for Parallelogram/Diamond)
    pointInPoly(p, vs) {
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].x, yi = vs[i].y;
            const xj = vs[j].x, yj = vs[j].y;
            const intersect = ((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    createGeometryInput(label, id, value, type = 'number') {
    return `
        <div class="prop-group">
            <label class="prop-label" for="${id}">${label}</label>
            <input
                type="${type}"
                id="${id}"
                class="prop-input"
                value="${value ?? ''}"
            >
        </div>
    `;
}


attachGeometryListeners() {
    const bindInput = (id, callback) => {
        const input = document.getElementById(id);

        if (!input) return;

        input.addEventListener('change', () => {
            if (this.selectedShapes.length !== 1) return;

            this.saveState();

            callback(
                this.selectedShapes[0],
                input.value
            );

            this.saveToLocalStorage();

            this.updatePropsUI();
        });
    };

    const getMinimumGeometryValue = (value) => {
        const parsedValue = parseFloat(value);

        if (!Number.isFinite(parsedValue)) {
            return 1;
        }

        return Math.max(1, parsedValue);
    };

    bindInput('geometryX', (shape, value) => {
        shape.x = parseFloat(value) || 0;
    });

    bindInput('geometryY', (shape, value) => {
        shape.y = parseFloat(value) || 0;
    });

    bindInput('geometryWidth', (shape, value) => {
        shape.w = getMinimumGeometryValue(value);
    });

    bindInput('geometryHeight', (shape, value) => {
        shape.h = getMinimumGeometryValue(value);
    });

    bindInput('geometryRadius', (shape, value) => {
        shape.r = getMinimumGeometryValue(value);
    });

    bindInput('geometryX1', (shape, value) => {
        shape.x = parseFloat(value) || 0;
    });

    bindInput('geometryY1', (shape, value) => {
        shape.y = parseFloat(value) || 0;
    });

    bindInput('geometryX2', (shape, value) => {
        shape.ex = parseFloat(value) || 0;
    });

    bindInput('geometryY2', (shape, value) => {
        shape.ey = parseFloat(value) || 0;
    });

    bindInput('geometryText', (shape, value) => {
        shape.text = value;
    });
}

    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
    }

    // Hit Testing
    hitTest(mx, my) {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const s = this.shapes[i];

            if (s.type === 'rect') {
                if (mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) return s;
            }
            else if (s.type === 'circle') {
                const dx = mx - s.x; const dy = my - s.y;
                if (Math.sqrt(dx * dx + dy * dy) <= s.r) return s;
            }
            else if (s.type === 'oval') {
                // Ellipse equation: (x-h)^2/rx^2 + (y-k)^2/ry^2 <= 1
                const rx = Math.abs(s.w / 2);
                const ry = Math.abs(s.h / 2);
                const h = s.x + s.w / 2;
                const k = s.y + s.h / 2;
                if (((mx - h) ** 2 / rx ** 2) + ((my - k) ** 2 / ry ** 2) <= 1) return s;
            }
            else if (s.type === 'diamond') {
                // Diamond Vertices
                const vs = [
                    { x: s.x + s.w / 2, y: s.y },           // Top Mid
                    { x: s.x + s.w, y: s.y + s.h / 2 },     // Right Mid
                    { x: s.x + s.w / 2, y: s.y + s.h },     // Bottom Mid
                    { x: s.x, y: s.y + s.h / 2 }            // Left Mid
                ];
                if (this.pointInPoly({ x: mx, y: my }, vs)) return s;
            }
            else if (s.type === 'parallelogram') {
                const skew = s.w * 0.2;
                const vs = [
                    { x: s.x + skew, y: s.y },       // Top Left
                    { x: s.x + s.w, y: s.y },        // Top Right
                    { x: s.x + s.w - skew, y: s.y + s.h }, // Bot Right
                    { x: s.x, y: s.y + s.h }         // Bot Left
                ];
                if (this.pointInPoly({ x: mx, y: my }, vs)) return s;
            }
            else if (s.type === 'line' || s.type === 'arrow') {
                const d = this.distToSegment({ x: mx, y: my }, { x: s.x, y: s.y }, { x: s.ex, y: s.ey });
                if (d < 10) return s;
            }
            else if (s.type === 'text') {
                if (mx >= s.x && mx <= s.x + (s.text.length * 10) && my >= s.y - 15 && my <= s.y + 5) return s;
            }
        }
        return null;
    }

    // --- INTERACTION ---

    setupEvents() {
        window.addEventListener('keydown', (e) => {
            const target = e.target;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
            if (isInput) return;

            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.undo();
            } else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
                e.preventDefault();
                this.redo();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selection) e.preventDefault();
                this.deleteSelected();
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            const mx = e.offsetX;
            const my = e.offsetY;

            if (this.tool === 'select') {
    const hit = this.hitTest(mx, my);

    if (hit) {

        this.dragStartState = JSON.parse(JSON.stringify(this.shapes));

        // Shift/Ctrl = add/remove from selection
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            this.toggleSelection(hit);
        } else {
            this.selectSingle(hit);
        }

       this.isDragging = true;

// Store offset relative to shape origin (for dragging)
this.dragStart = {
    x: mx,
    y: my,
    ox: hit.x,
    oy: hit.y
};

if (['line', 'arrow'].includes(hit.type)) {
    this.dragStart.oex = hit.ex;
    this.dragStart.oey = hit.ey;
}

this.updatePropsUI();

    } else {

        if (!(e.shiftKey || e.ctrlKey || e.metaKey)) {
            this.clearSelection();
        }

    }
} else {
                // Start Drawing
                this.isDragging = true;
                const sx = this.snap(mx);
                const sy = this.snap(my);

                const style = {
                    fill: document.getElementById('fillColor').value,
                    stroke: document.getElementById('strokeColor').value,
                    width: parseInt(document.getElementById('strokeWidth').value)
                };

                if (this.tool === 'circle') {
                    this.currentShape = { type: 'circle', x: sx, y: sy, r: 0, ...style };
                } else if (['line', 'arrow'].includes(this.tool)) {
                    this.currentShape = { type: this.tool, x: sx, y: sy, ex: sx, ey: sy, ...style };
                } else if (this.tool === 'text') {
                    const text = prompt("Enter text:", "Label");
                    if (text) {
                        this.saveState();
                        this.shapes.push({ type: 'text', x: sx, y: sy, text: text, ...style });
                        this.saveToLocalStorage(); // Auto-save after adding text
                        this.tool = 'select';
                        this.updateToolbar();
                        this.isDragging = false;
                    }
                } else {
                    // Rect, Oval, Diamond, Parallelogram (Box-based shapes)
                    this.currentShape = { type: this.tool, x: sx, y: sy, w: 0, h: 0, ...style };
                }
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const mx = e.offsetX;
            const my = e.offsetY;
            document.getElementById('coords').innerText = `${Math.round(mx)}, ${Math.round(my)}`;

            if (!this.isDragging) return;

            if (this.tool === 'select' && this.selection) {
                // Drag Selection
                const dx = mx - this.dragStart.x;
                const dy = my - this.dragStart.y;
                const s = this.selection;

                s.x = this.snap(this.dragStart.ox + dx);
                s.y = this.snap(this.dragStart.oy + dy);

                if (['line', 'arrow'].includes(s.type)) {
                    s.ex = this.snap(this.dragStart.oex + dx);
                    s.ey = this.snap(this.dragStart.oey + dy);
                }
            }
            else if (this.currentShape) {
                // Drag Drawing
                const sx = this.snap(mx);
                const sy = this.snap(my);

                if (this.currentShape.type === 'circle') {
                    const dx = sx - this.currentShape.x;
                    const dy = sy - this.currentShape.y;
                    this.currentShape.r = Math.sqrt(dx * dx + dy * dy);
                } else if (['line', 'arrow'].includes(this.currentShape.type)) {
                    this.currentShape.ex = sx;
                    this.currentShape.ey = sy;
                } else {
                    // Box-based
                    this.currentShape.w = sx - this.currentShape.x;
                    this.currentShape.h = sy - this.currentShape.y;
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.currentShape) {
                // Normalize Box-based shapes (ensure positive width/height if needed, or handle negative in render)
                // For simplicity, we leave them as is, but ensure 0-size shapes aren't added
                const s = this.currentShape;
                let isValid = true;

                if (['rect', 'oval', 'diamond', 'parallelogram'].includes(s.type)) {
                    if (s.w === 0 || s.h === 0) isValid = false;
                }

                if (isValid) {
                    this.saveState();
                    this.shapes.push(s);
                    this.saveToLocalStorage(); // Auto-save after adding shape
                }
                this.currentShape = null;
            } else if (this.tool === 'select' && this.isDragging && this.selection) {
                if (this.dragStartState && JSON.stringify(this.shapes) !== JSON.stringify(this.dragStartState)) {
                    this.saveState(this.dragStartState);
                    this.saveToLocalStorage(); // Auto-save after dragging
                }
            }
            this.dragStartState = null;
            this.isDragging = false;
        });
        
        // Delete using Backspace or Delete Key
        window.addEventListener('keydown', (event)=>{
            const isDeleteKey = event.key === 'Delete' || event.key ==='Backspace';

            const isTyping=
                event.target.tagName === 'INPUT' ||
                event.target.tagName === 'TEXTAREA' ||
                event.target.isContentEditable;

            if (isDeleteKey && !isTyping && this.selection){
                event.preventDefault();
                this.deleteSelected();
            }
        });

        // Properties Listeners
['fillColor', 'strokeColor', 'strokeWidth'].forEach(id => {

    document.getElementById(id).addEventListener('change', (e) => {

        if (this.selectedShapes.length === 0) return;

        this.saveState();

        this.selectedShapes.forEach(shape => {

            if (id === 'fillColor') {
                shape.fill = e.target.value;
            }

            if (id === 'strokeColor') {
                shape.stroke = e.target.value;
            }

            if (id === 'strokeWidth') {
                shape.width = parseInt(e.target.value);
            }

        });

        this.saveToLocalStorage();

    });

});
    }

    // --- RENDERING ---

    resize() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }

    loop() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear & Grid
        const isDark = document.body.classList.contains('dark-mode');
        ctx.fillStyle = isDark ? '#0f172a' : '#e7e5e4';
        ctx.fillRect(0, 0, w, h);
        this.drawGrid(w, h, isDark);

        // Draw Shapes
        this.shapes.forEach(s => this.drawShape(ctx, s));
        if (this.currentShape) this.drawShape(ctx, this.currentShape);
// Draw Selection
this.selectedShapes.forEach(shape => {
    this.drawSelection(ctx, shape);
});

        requestAnimationFrame(() => this.loop());
    }

    drawGrid(w, h, isDark) {
        const gridSize = parseInt(document.getElementById('gridSize').value) || 20;
        this.ctx.strokeStyle = isDark ? '#1e293b' : '#d6d3d1';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let x = 0; x < w; x += gridSize) { this.ctx.moveTo(x, 0); this.ctx.lineTo(x, h); }
        for (let y = 0; y < h; y += gridSize) { this.ctx.moveTo(0, y); this.ctx.lineTo(w, y); }
        this.ctx.stroke();
    }

    drawShape(ctx, s) {
        ctx.fillStyle = s.fill;
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.width;

        ctx.beginPath();

        if (s.type === 'rect') {
            ctx.rect(s.x, s.y, s.w, s.h);
        }
        else if (s.type === 'circle') {
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        }
        else if (s.type === 'oval') {
            // Draw Ellipse
            const rx = Math.abs(s.w / 2);
            const ry = Math.abs(s.h / 2);
            const cx = s.x + s.w / 2;
            const cy = s.y + s.h / 2;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        }
        else if (s.type === 'diamond') {
            ctx.moveTo(s.x + s.w / 2, s.y);           // Top
            ctx.lineTo(s.x + s.w, s.y + s.h / 2);     // Right
            ctx.lineTo(s.x + s.w / 2, s.y + s.h);     // Bottom
            ctx.lineTo(s.x, s.y + s.h / 2);           // Left
            ctx.closePath();
        }
        else if (s.type === 'parallelogram') {
            const skew = s.w * 0.2; // 20% skew
            ctx.moveTo(s.x + skew, s.y);            // Top Left
            ctx.lineTo(s.x + s.w, s.y);             // Top Right
            ctx.lineTo(s.x + s.w - skew, s.y + s.h);// Bot Right
            ctx.lineTo(s.x, s.y + s.h);             // Bot Left
            ctx.closePath();
        }
        else if (s.type === 'line' || s.type === 'arrow') {
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.ex, s.ey);
            ctx.stroke();

            if (s.type === 'arrow') {
                // Draw Arrowhead
                const angle = Math.atan2(s.ey - s.y, s.ex - s.x);
                const headLen = 15;
                ctx.beginPath();
                ctx.moveTo(s.ex, s.ey);
                ctx.lineTo(s.ex - headLen * Math.cos(angle - Math.PI / 6), s.ey - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(s.ex, s.ey);
                ctx.lineTo(s.ex - headLen * Math.cos(angle + Math.PI / 6), s.ey - headLen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            }
            return; // Already stroked
        }
        else if (s.type === 'text') {
            ctx.font = `bold 16px Courier New`;
            ctx.fillStyle = s.stroke;
            ctx.fillText(s.text, s.x, s.y);
            return;
        }

        ctx.fill();
        ctx.stroke();
    }

    drawSelection(ctx, s) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        // Simple bounding box for most shapes
        if (['rect', 'oval', 'diamond', 'parallelogram'].includes(s.type)) {
            // Handle negative width/height for bounding rect
            const bx = s.w < 0 ? s.x + s.w : s.x;
            const by = s.h < 0 ? s.y + s.h : s.y;
            const bw = Math.abs(s.w);
            const bh = Math.abs(s.h);
            ctx.rect(bx - 5, by - 5, bw + 10, bh + 10);
        }
        else if (s.type === 'circle') {
            ctx.rect(s.x - s.r - 5, s.y - s.r - 5, s.r * 2 + 10, s.r * 2 + 10);
        }
        else if (['line', 'arrow'].includes(s.type)) {
            ctx.moveTo(s.x, s.y); ctx.lineTo(s.ex, s.ey);
            // Draw anchors
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(s.x - 3, s.y - 3, 6, 6);
            ctx.fillRect(s.ex - 3, s.ey - 3, 6, 6);
        }
        else if (s.type === 'text') {
            const width = s.text.length * 10;
            ctx.rect(s.x - 5, s.y - 20, width + 10, 30);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    // --- API UTILS ---

 setTool(name) {
    this.tool = name;
    this.clearSelection();
    this.updateToolbar();
}

    updateToolbar() {
        document.querySelectorAll('.tool').forEach(el => el.classList.remove('active'));
        const active = document.querySelector(`.tool[onclick="app.setTool('${this.tool}')"]`);
        if (active) active.classList.add('active');
        this.canvas.style.cursor = this.tool === 'select' ? 'default' : 'crosshair';
    }

  updatePropsUI() {
    const geometryPanel = document.getElementById('geometry-properties');

    if (this.selectedShapes.length === 0) {
        geometryPanel.innerHTML = '';
        return;
    }

    const first = this.selectedShapes[0];

    const sameFill = this.selectedShapes.every(
        s => s.fill === first.fill
    );

    const sameStroke = this.selectedShapes.every(
        s => s.stroke === first.stroke
    );

    const sameWidth = this.selectedShapes.every(
        s => s.width === first.width
    );

    document.getElementById('fillColor').value =
        sameFill ? first.fill : '#000000';

    document.getElementById('strokeColor').value =
        sameStroke ? first.stroke : '#000000';

    document.getElementById('strokeWidth').value =
        sameWidth ? first.width : '';

    // Geometry properties are only shown for a single selected shape.
    if (this.selectedShapes.length !== 1) {
        geometryPanel.innerHTML = `
            <div class="prop-label">
                Geometry editing is available for one selected shape at a time.
            </div>
        `;
        return;
    }

    let html = '';

    if (
        ['rect', 'oval', 'diamond', 'parallelogram']
            .includes(first.type)
    ) {
        html += this.createGeometryInput(
            'X',
            'geometryX',
            first.x
        );

        html += this.createGeometryInput(
            'Y',
            'geometryY',
            first.y
        );

        html += this.createGeometryInput(
            'Width',
            'geometryWidth',
            first.w
        );

        html += this.createGeometryInput(
            'Height',
            'geometryHeight',
            first.h
        );
    }

    else if (first.type === 'circle') {
        html += this.createGeometryInput(
            'X',
            'geometryX',
            first.x
        );

        html += this.createGeometryInput(
            'Y',
            'geometryY',
            first.y
        );

        html += this.createGeometryInput(
            'Radius',
            'geometryRadius',
            first.r
        );
    }

    else if (['line', 'arrow'].includes(first.type)) {
        html += this.createGeometryInput(
            'X1',
            'geometryX1',
            first.x
        );

        html += this.createGeometryInput(
            'Y1',
            'geometryY1',
            first.y
        );

        html += this.createGeometryInput(
            'X2',
            'geometryX2',
            first.ex
        );

        html += this.createGeometryInput(
            'Y2',
            'geometryY2',
            first.ey
        );
    }

    else if (first.type === 'text') {
        html += this.createGeometryInput(
            'X',
            'geometryX',
            first.x
        );

        html += this.createGeometryInput(
            'Y',
            'geometryY',
            first.y
        );

        html += this.createGeometryInput(
            'Text',
            'geometryText',
            first.text,
            'text'
        );
    }

    html += `
    <button
        type="button"
        class="reset-geometry-button btn"
         style="margin-top:20px; border-color:#44ffca; color:#44ffca;"
        onclick="app.resetGeometry()"
    >
        Reset Geometry
    </button>
`;


    geometryPanel.innerHTML = html;

    this.attachGeometryListeners();
}

    saveState(state = null) {
        const stateToSave = state || JSON.parse(JSON.stringify(this.shapes));
        this.undoStack.push(stateToSave);
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(JSON.parse(JSON.stringify(this.shapes)));
            this.shapes = this.undoStack.pop();
   this.clearSelection();
            this.saveToLocalStorage(); // Auto-save after undo
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(JSON.parse(JSON.stringify(this.shapes)));
            this.shapes = this.redoStack.pop();
            this.clearSelection();
            this.saveToLocalStorage(); // Auto-save after redo
        }
    }

    // Save shapes to localStorage
    saveToLocalStorage() {
        try {
            if (this.shapes.length > 0) {
                localStorage.setItem('vector_studio_shapes', JSON.stringify(this.shapes));
                console.log('Shapes auto-saved to localStorage');
            } else {
                this.clearLocalStorage();
            }
        } catch (e) {
            console.error('Failed to auto-save shapes to localStorage:', e);
        }
    }

    // Load shapes from localStorage
    loadFromLocalStorage() {
        const savedShapes = localStorage.getItem('vector_studio_shapes');
        if (savedShapes) {
            try {
                const parsed = JSON.parse(savedShapes);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.shapes = parsed;
                    console.log(`Restored ${this.shapes.length} shapes from localStorage`);
                    return true;
                }
            } catch (e) {
                console.error('Failed to restore shapes:', e);
            }
        }
        return false;
    }

    // Clear localStorage (call when user explicitly clears canvas)
    clearLocalStorage() {
        localStorage.removeItem('vector_studio_shapes');
        console.log('localStorage cleared');
    }

  deleteSelected() {
    if (this.selectedShapes.length == 0) {
        alert("No shape selected. Please select a shape to delete.");
        return;
    }

    this.saveState();

    this.shapes = this.shapes.filter(
        shape => !this.selectedShapes.includes(shape)
    );

    this.clearSelection();

    this.saveToLocalStorage();
}
    clear() {
        if (confirm("Clear Canvas?")) {
            this.saveState();
            this.shapes = [];
            this.clearSelection();
            this.clearLocalStorage(); // Clear saved shapes too
        }
    }

    export(format) {
        if (format === 'png') {
            const link = document.createElement('a');
            link.download = 'vector_diagram.png';
            link.href = this.canvas.toDataURL();
            link.click();
        } else if (format === 'svg') {
            const isDark = document.body.classList.contains('dark-mode');
            const bg = isDark ? '#0f172a' : '#e7e5e4';
            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.canvas.width}" height="${this.canvas.height}" style="background:${bg}">`;

            this.shapes.forEach(s => {
                const common = `fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.width}"`;

                if (s.type === 'rect') {
                    svg += `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" ${common}/>`;
                }
                else if (s.type === 'circle') {
                    svg += `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" ${common}/>`;
                }
                else if (s.type === 'oval') {
                    const cx = s.x + s.w / 2;
                    const cy = s.y + s.h / 2;
                    const rx = Math.abs(s.w / 2);
                    const ry = Math.abs(s.h / 2);
                    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${common}/>`;
                }
                else if (s.type === 'diamond') {
                    const pts = `${s.x + s.w / 2},${s.y} ${s.x + s.w},${s.y + s.h / 2} ${s.x + s.w / 2},${s.y + s.h} ${s.x},${s.y + s.h / 2}`;
                    svg += `<polygon points="${pts}" ${common}/>`;
                }
                else if (s.type === 'parallelogram') {
                    const skew = s.w * 0.2;
                    const pts = `${s.x + skew},${s.y} ${s.x + s.w},${s.y} ${s.x + s.w - skew},${s.y + s.h} ${s.x},${s.y + s.h}`;
                    svg += `<polygon points="${pts}" ${common}/>`;
                }
                else if (s.type === 'line') {
                    svg += `<line x1="${s.x}" y1="${s.y}" x2="${s.ex}" y2="${s.ey}" stroke="${s.stroke}" stroke-width="${s.width}"/>`;
                }
                else if (s.type === 'arrow') {
                    // Line
                    svg += `<line x1="${s.x}" y1="${s.y}" x2="${s.ex}" y2="${s.ey}" stroke="${s.stroke}" stroke-width="${s.width}"/>`;
                    // Arrowhead (simple triangle marker logic would be cleaner in real SVG, but we draw manual path here for simplicity)
                    const angle = Math.atan2(s.ey - s.y, s.ex - s.x);
                    const headLen = 15;
                    const x1 = s.ex - headLen * Math.cos(angle - Math.PI / 6);
                    const y1 = s.ey - headLen * Math.sin(angle - Math.PI / 6);
                    const x2 = s.ex - headLen * Math.cos(angle + Math.PI / 6);
                    const y2 = s.ey - headLen * Math.sin(angle + Math.PI / 6);
                    svg += `<path d="M${s.ex},${s.ey} L${x1},${y1} M${s.ex},${s.ey} L${x2},${y2}" stroke="${s.stroke}" stroke-width="${s.width}" fill="none"/>`;
                }
                else if (s.type === 'text') {
                    svg += `<text x="${s.x}" y="${s.y}" fill="${s.stroke}" font-family="Courier New" font-weight="bold" font-size="16">${s.text}</text>`;
                }
            });
            svg += `</svg>`;

            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'vector_diagram.svg';
            link.click();
        }

        const status = document.getElementById('status');
        status.innerText = `EXPORTED ${format.toUpperCase()}`;
        status.style.opacity = 1;
        setTimeout(() => status.style.opacity = 0, 2000);
    }
}

// Init App
const app = new VectorEngine();