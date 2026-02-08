'use strict';

const status = document.getElementById('status');

/**
 * --- IMAGE CONVERSION LOGIC ---
 * Uses the Browser Canvas API to re-encode image data.
 */
document.getElementById('convertImageBtn').onclick = () => {
    const file = document.getElementById('imageInput').files[0];
    const targetFormat = document.getElementById('imageFormat').value;
    
    if (!file) return notify.info("Please select an image file first.");

    status.textContent = "Processing image...";

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Export canvas to the desired format
            canvas.toBlob((blob) => {
                const extension = targetFormat.split('/')[1].replace('jpeg', 'jpg');
                const newName = file.name.split('.')[0] + "." + extension;
                downloadBlob(blob, newName);
                status.textContent = "Converted image to " + extension.toUpperCase();
            }, targetFormat, 0.9);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

/**
 * --- DATA CONVERSION LOGIC (JSON to CSV) ---
 * Flattens simple JSON arrays into CSV format.
 */
document.getElementById('convertDataBtn').onclick = () => {
    const file = document.getElementById('dataInput').files[0];
    if (!file) return notify.info("Please select a JSON file.");

    status.textContent = "Processing data...";

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            const csv = jsonToCsv(json);
            const blob = new Blob([csv], { type: 'text/csv' });
            const newName = file.name.split('.')[0] + ".csv";
            downloadBlob(blob, newName);
            status.textContent = "Converted JSON to CSV";
        } catch (err) {
            notify.error("Invalid JSON file. Ensure it is an array of objects.");
            status.textContent = "Error parsing JSON.";
        }
    };
    reader.readAsText(file);
};

// Helper: JSON to CSV Parser
function jsonToCsv(items) {
    if (!Array.isArray(items)) items = [items];
    const header = Object.keys(items[0]);
    const rows = items.map(obj => 
        header.map(fieldName => JSON.stringify(obj[fieldName] || '')).join(',')
    );
    return [header.join(','), ...rows].join('\r\n');
}

// Helper: Trigger Download
function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}
