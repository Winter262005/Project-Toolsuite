'use strict';
const { PDFDocument } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const scribblePad = document.getElementById('scribble-pad');
const padCtx = scribblePad.getContext('2d');
const exportBtn = document.getElementById('exportBtn');
const pagesContainer = document.getElementById('pages-container');

let pdfMasterData = null; // PERSISTENT DATA CLONE
let currentSigData = null;
let isDrawing = false;

// 1. Signature Pad Logic
function initPad() {
    scribblePad.width = scribblePad.offsetWidth;
    scribblePad.height = 300;
    padCtx.lineWidth = 4;
    padCtx.lineCap = 'round';
}
window.onload = initPad;

scribblePad.onmousedown = scribblePad.ontouchstart = (e) => {
    isDrawing = true;
    const rect = scribblePad.getBoundingClientRect();
    padCtx.beginPath();
    padCtx.moveTo((e.clientX || e.touches[0].clientX) - rect.left, (e.clientY || e.touches[0].clientY) - rect.top);
    padCtx.strokeStyle = document.getElementById('sigColor').value;
};

scribblePad.onmousemove = scribblePad.ontouchmove = (e) => {
    if (!isDrawing) return;
    const rect = scribblePad.getBoundingClientRect();
    padCtx.lineTo((e.clientX || e.touches[0].clientX) - rect.left, (e.clientY || e.touches[0].clientY) - rect.top);
    padCtx.stroke();
};

window.onmouseup = window.ontouchend = () => {
    if (isDrawing) { isDrawing = false; currentSigData = scribblePad.toDataURL(); }
};

function clearPad() { padCtx.clearRect(0, 0, scribblePad.width, scribblePad.height); currentSigData = null; }

// 2. PDF Loading with Data Persistency
document.getElementById('pdfInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    pdfMasterData = new Uint8Array(buffer); // Clone data to prevent detachment error
    
    const pdf = await pdfjsLib.getDocument({ data: pdfMasterData.slice(0) }).promise;
    pagesContainer.innerHTML = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const wrapper = document.createElement('div');
        wrapper.className = 'page-container';
        wrapper.dataset.pageIdx = i - 1;
        
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        
        wrapper.appendChild(canvas);
        pagesContainer.appendChild(wrapper);
        wrapper.onclick = (ev) => { if (ev.target === canvas && currentSigData) addSig(wrapper, canvas, ev); };
    }
    exportBtn.disabled = false;
};

// 3. UI Interaction
function addSig(wrapper, canvas, ev) {
    const rect = canvas.getBoundingClientRect();
    const box = document.createElement('div');
    box.className = 'sig-box';
    box.style.width = '180px'; box.style.height = '80px';
    box.style.left = (ev.clientX - rect.left - 90) + 'px';
    box.style.top = (ev.clientY - rect.top - 40) + 'px';
    
    box.innerHTML = `<img src="${currentSigData}"><div class="delete-btn">×</div><div class="resize-handle"></div>`;
    box.querySelector('.delete-btn').onclick = () => box.remove();
    wrapper.appendChild(box);
    setupDrag(box);
    setupResize(box, box.querySelector('.resize-handle'));
}

function setupDrag(el) {
    el.onmousedown = (e) => {
        if (e.target.className !== 'sig-box' && e.target.tagName !== 'IMG') return;
        let ox = e.clientX, oy = e.clientY;
        document.onmousemove = (mv) => {
            el.style.left = (el.offsetLeft + (mv.clientX - ox)) + "px";
            el.style.top = (el.offsetTop + (mv.clientY - oy)) + "px";
            ox = mv.clientX; oy = mv.clientY;
        };
        document.onmouseup = () => document.onmousemove = null;
    };
}

function setupResize(el, h) {
    h.onmousedown = (e) => {
        e.stopPropagation();
        let ox = e.clientX, oy = e.clientY, ow = el.offsetWidth, oh = el.offsetHeight;
        document.onmousemove = (mv) => {
            el.style.width = (ow + (mv.clientX - ox)) + "px";
            el.style.height = (oh + (mv.clientY - oy)) + "px";
        };
        document.onmouseup = () => document.onmousemove = null;
    };
}

// 4. Fixed Export Logic
exportBtn.onclick = async () => {
    try {
        const doc = await PDFDocument.load(pdfMasterData); // Use the persistent master copy
        const pages = doc.getPages();
        const boxes = document.querySelectorAll('.sig-box');

        for (let box of boxes) {
            const pageContainer = box.parentElement;
            const canvas = pageContainer.querySelector('canvas');
            const page = pages[parseInt(pageContainer.dataset.pageIdx)];
            const { width, height } = page.getSize();

            const sigImage = await doc.embedPng(box.querySelector('img').src);
            const relX = (box.offsetLeft + box.offsetWidth / 2) / canvas.width;
            const relY = (box.offsetTop + box.offsetHeight / 2) / canvas.height;

            const finalW = (box.offsetWidth / canvas.width) * width;
            const finalH = (box.offsetHeight / canvas.height) * height;

            page.drawImage(sigImage, {
                x: (relX * width) - (finalW / 2),
                y: height - (relY * height) - (finalH / 2),
                width: finalW, height: finalH
            });
        }

        const bytes = await doc.save();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        link.download = "Signed_Document.pdf";
        link.click();
    } catch (err) {
        notify.error("Export failed: " + err.message);
    }
};