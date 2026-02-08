'use strict';

const qrData = document.getElementById('qr-data');
const qrSize = document.getElementById('qr-size');
const generateBtn = document.getElementById('generate-btn');
const downloadBtn = document.getElementById('download-btn');
const resultSection = document.getElementById('qr-result');
const canvasContainer = document.getElementById('canvas-container');

generateBtn.onclick = () => {
    const data = qrData.value.trim();
    if (!data) return notify.info("Please enter some text.");

    canvasContainer.innerHTML = "";
    resultSection.style.display = "inline-block";

    // For long text, we force a minimum size of 512 for better scanability
    let size = parseInt(qrSize.value);
    if (data.length > 500 && size < 512) {
        size = 512;
        qrSize.value = "512";
        notify.info("Text is long; auto-adjusting size to 512px for better scanning.");
    }

    const canvas = document.createElement('canvas');
    canvasContainer.appendChild(canvas);

    try {
        const qr = new QRious({
            element: canvas,
            value: data,
            size: size,
            level: 'L', // Low error correction = larger dots for the same text
            padding: 20  // Adds a 'Quiet Zone' so cameras can 'find' the code
        });

        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL("image/png");
            link.download = `qr-code-toolsuite.png`;
            link.click();
        };
        
    } catch (err) {
        notify.error("Too much data!");
    }
};
