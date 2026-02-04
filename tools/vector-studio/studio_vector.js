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
        this.dragStart = { x: 0, y: 0 };
        this.currentShape = null; 
        
        // Init
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupEvents();
        this.loop(); 
        
        console.log(">> VECTOR ENGINE INITIALIZED");
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

    distToSegment(p, v, w) {
        const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
        if (l2 === 0) return Math.sqrt((p.x - v.x)**2 + (p.y - v.y)**2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2);
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
                if (Math.sqrt(dx*dx + dy*dy) <= s.r) return s;
            } 
            else if (s.type === 'oval') {
                // Ellipse equation: (x-h)^2/rx^2 + (y-k)^2/ry^2 <= 1
                const rx = Math.abs(s.w / 2);
                const ry = Math.abs(s.h / 2);
                const h = s.x + s.w / 2;
                const k = s.y + s.h / 2;
                if ( ((mx - h)**2 / rx**2) + ((my - k)**2 / ry**2) <= 1 ) return s;
            }
            else if (s.type === 'diamond') {
                // Diamond Vertices
                const vs = [
                    {x: s.x + s.w/2, y: s.y},           // Top Mid
                    {x: s.x + s.w, y: s.y + s.h/2},     // Right Mid
                    {x: s.x + s.w/2, y: s.y + s.h},     // Bottom Mid
                    {x: s.x, y: s.y + s.h/2}            // Left Mid
                ];
                if (this.pointInPoly({x:mx, y:my}, vs)) return s;
            }
            else if (s.type === 'parallelogram') {
                const skew = s.w * 0.2;
                const vs = [
                    {x: s.x + skew, y: s.y},       // Top Left
                    {x: s.x + s.w, y: s.y},        // Top Right
                    {x: s.x + s.w - skew, y: s.y + s.h}, // Bot Right
                    {x: s.x, y: s.y + s.h}         // Bot Left
                ];
                if (this.pointInPoly({x:mx, y:my}, vs)) return s;
            }
            else if (s.type === 'line' || s.type === 'arrow') {
                const d = this.distToSegment({x:mx, y:my}, {x:s.x, y:s.y}, {x:s.ex, y:s.ey});
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
        this.canvas.addEventListener('mousedown', (e) => {
            const mx = e.offsetX;
            const my = e.offsetY;

            if (this.tool === 'select') {
                const hit = this.hitTest(mx, my);
                if (hit) {
                    this.selection = hit;
                    this.isDragging = true;
                    // Store offset relative to shape origin
                    this.dragStart = { x: mx, y: my, ox: hit.x, oy: hit.y };
                    
                    if (['line', 'arrow'].includes(hit.type)) {
                        this.dragStart.oex = hit.ex;
                        this.dragStart.oey = hit.ey;
                    }
                    this.updatePropsUI();
                } else {
                    this.selection = null;
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
                        this.shapes.push({ type: 'text', x: sx, y: sy, text: text, ...style });
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
                    this.currentShape.r = Math.sqrt(dx*dx + dy*dy);
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
                
                if (isValid) this.shapes.push(s);
                this.currentShape = null;
            }
            this.isDragging = false;
        });

        // Properties Listeners
        ['fillColor', 'strokeColor', 'strokeWidth'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                if (this.selection) {
                    if (id === 'fillColor') this.selection.fill = e.target.value;
                    if (id === 'strokeColor') this.selection.stroke = e.target.value;
                    if (id === 'strokeWidth') this.selection.width = parseInt(e.target.value);
                }
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
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);
        this.drawGrid(w, h);

        // Draw Shapes
        this.shapes.forEach(s => this.drawShape(ctx, s));
        if (this.currentShape) this.drawShape(ctx, this.currentShape);

        // Draw Selection
        if (this.selection) this.drawSelection(ctx, this.selection);

        requestAnimationFrame(() => this.loop());
    }

    drawGrid(w, h) {
        const gridSize = parseInt(document.getElementById('gridSize').value) || 20;
        this.ctx.strokeStyle = '#222';
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
            ctx.moveTo(s.x + s.w/2, s.y);           // Top
            ctx.lineTo(s.x + s.w, s.y + s.h/2);     // Right
            ctx.lineTo(s.x + s.w/2, s.y + s.h);     // Bottom
            ctx.lineTo(s.x, s.y + s.h/2);           // Left
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
        this.selection = null;
        this.updateToolbar();
    }

    updateToolbar() {
        document.querySelectorAll('.tool').forEach(el => el.classList.remove('active'));
        const active = document.querySelector(`.tool[onclick="app.setTool('${this.tool}')"]`);
        if(active) active.classList.add('active');
        this.canvas.style.cursor = this.tool === 'select' ? 'default' : 'crosshair';
    }

    updatePropsUI() {
        if(!this.selection) return;
        document.getElementById('fillColor').value = this.selection.fill;
        document.getElementById('strokeColor').value = this.selection.stroke;
        document.getElementById('strokeWidth').value = this.selection.width;
    }

    deleteSelected() {
        if (this.selection) {
            this.shapes = this.shapes.filter(s => s !== this.selection);
            this.selection = null;
        }
    }

    clear() {
        if(confirm("Clear Canvas?")) {
            this.shapes = [];
            this.selection = null;
        }
    }

    export(format) {
        if (format === 'png') {
            const link = document.createElement('a');
            link.download = 'vector_diagram.png';
            link.href = this.canvas.toDataURL();
            link.click();
        } else if (format === 'svg') {
            let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.canvas.width}" height="${this.canvas.height}" style="background:#111">`;
            
            this.shapes.forEach(s => {
                const common = `fill="${s.fill}" stroke="${s.stroke}" stroke-width="${s.width}"`;
                
                if (s.type === 'rect') {
                    svg += `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" ${common}/>`;
                } 
                else if (s.type === 'circle') {
                    svg += `<circle cx="${s.x}" cy="${s.y}" r="${s.r}" ${common}/>`;
                }
                else if (s.type === 'oval') {
                    const cx = s.x + s.w/2;
                    const cy = s.y + s.h/2;
                    const rx = Math.abs(s.w/2);
                    const ry = Math.abs(s.h/2);
                    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${common}/>`;
                }
                else if (s.type === 'diamond') {
                    const pts = `${s.x + s.w/2},${s.y} ${s.x + s.w},${s.y + s.h/2} ${s.x + s.w/2},${s.y + s.h} ${s.x},${s.y + s.h/2}`;
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
            
            const blob = new Blob([svg], {type: 'image/svg+xml'});
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