'use strict';

const { PDFDocument, degrees } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const pdfInput = document.getElementById('pdfInput');
const grid = document.getElementById('page-grid');
const exportBtn = document.getElementById('exportBtn');

let pdfMasterBytes = null;
let pagesState = [];

document.getElementById('dropZone').onclick = () => pdfInput.click();

pdfInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Fixed: Create a fresh Uint8Array to ensure data persistency
    const buffer = await file.arrayBuffer();
    pdfMasterBytes = new Uint8Array(buffer);
    
    // Use a slice for rendering to keep master bytes pure
    const pdf = await pdfjsLib.getDocument({ data: pdfMasterBytes.slice(0) }).promise;
    
    pagesState = [];
    grid.innerHTML = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const pageId = crypto.randomUUID();
        pagesState.push({ id: pageId, rotation: 0, originalIndex: i - 1 });
        createPageCard(pageId, canvas.toDataURL(), i);
    }
    exportBtn.disabled = false;
    document.getElementById('fileLabel').innerText = file.name;
};

function createPageCard(id, thumbUrl, label) {
    const card = document.createElement('div');
    card.className = 'page-card';
    card.draggable = true;
    card.dataset.id = id;
    card.innerHTML = `
        <div class="thumbnail-wrapper"><img src="${thumbUrl}" id="img-${id}" style="max-width:100%;"></div>
        <div style="font-size:0.7rem; margin-bottom:5px; font-weight:bold;">PAGE ${label}</div>
        <div class="controls">
            <button class="btn-small" onclick="rotatePage('${id}')">ROTATE 90°</button>
            <button class="btn-small btn-danger" onclick="deletePage('${id}')">DELETE</button>
        </div>`;

    card.ondragstart = (e) => e.dataTransfer.setData('text/plain', id);
    card.ondragover = (e) => e.preventDefault();
    card.ondrop = (e) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        reorderPages(draggedId, id);
    };
    grid.appendChild(card);
}

window.rotatePage = (id) => {
    const page = pagesState.find(p => p.id === id);
    page.rotation = (page.rotation + 90) % 360;
    document.getElementById(`img-${id}`).style.transform = `rotate(${page.rotation}deg)`;
};

window.deletePage = (id) => {
    pagesState = pagesState.filter(p => p.id !== id);
    document.querySelector(`[data-id="${id}"]`).remove();
    if (pagesState.length === 0) exportBtn.disabled = true;
};

function reorderPages(draggedId, targetId) {
    const draggedIdx = pagesState.findIndex(p => p.id === draggedId);
    const targetIdx = pagesState.findIndex(p => p.id === targetId);
    const [removed] = pagesState.splice(draggedIdx, 1);
    pagesState.splice(targetIdx, 0, removed);
    const draggedEl = document.querySelector(`[data-id="${draggedId}"]`);
    const targetEl = document.querySelector(`[data-id="${targetId}"]`);
    if (draggedIdx < targetIdx) targetEl.after(draggedEl);
    else targetEl.before(draggedEl);
}

// Fixed Export Logic
exportBtn.onclick = async () => {
    try {
        const srcDoc = await PDFDocument.load(pdfMasterBytes);
        const outDoc = await PDFDocument.create();

        // Copy pages in the order defined by the current array state
        for (const item of pagesState) {
            const [copiedPage] = await outDoc.copyPages(srcDoc, [item.originalIndex]);
            const currentRotation = copiedPage.getRotation().angle;
            copiedPage.setRotation(degrees(currentRotation + item.rotation));
            outDoc.addPage(copiedPage);
        }

        const bytes = await outDoc.save();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        link.download = "organized_document.pdf";
        link.click();
    } catch (err) {
        console.error("Export Error:", err);
        notify.error("Export failed. Please check the console for details.");
    }
};