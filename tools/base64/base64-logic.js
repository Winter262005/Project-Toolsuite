'use strict';

const input = document.getElementById('input');
const output = document.getElementById('output');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const exportTxtBtn = document.getElementById('exportTxtBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');

function encodeBase64(str) {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        )
    );
}

function decodeBase64(str) {
    return decodeURIComponent(
        atob(str)
            .split('')
            .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('')
    );
}

function updateButtonState() {
    const hasInput = input.value.trim().length > 0;
    const hasOutput = output.value.trim().length > 0;

    encodeBtn.disabled = !hasInput;
    decodeBtn.disabled = !hasInput;

    exportTxtBtn.disabled = !hasOutput;
    exportJsonBtn.disabled = !hasOutput;
    exportPdfBtn.disabled = !hasOutput;
}

encodeBtn.onclick = () => {
    try {
        output.value = encodeBase64(input.value);
updateButtonState();
    } catch {
        notify.error('Unable to encode this text.');
    }
};

decodeBtn.onclick = () => {
    try {
        output.value = decodeBase64(input.value.trim());
updateButtonState();
    } catch {
        notify.error('Invalid Base64 string.');
    }
};
input.addEventListener('input', () => {
    output.value = '';
    updateButtonState();
});

updateButtonState();
// ---------- Export Helpers ----------

function hasOutput() {
    if (!output.value.trim()) {
        notify.error('Nothing to export.');
        return false;
    }
    return true;
}

// TXT Export
exportTxtBtn.onclick = () => {
    if (!hasOutput()) return;

    const blob = new Blob([output.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64-output.txt';
    a.click();

    URL.revokeObjectURL(url);
};

// JSON Export
exportJsonBtn.onclick = () => {
    if (!hasOutput()) return;

    const data = {
        input: input.value,
        output: output.value,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64-output.json';
    a.click();

    URL.revokeObjectURL(url);
};

// PDF Export
exportPdfBtn.onclick = () => {
    if (!hasOutput()) return;

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Base64 Converter Output', 10, 15);

    doc.setFontSize(11);

    const lines = doc.splitTextToSize(output.value, 180);
doc.text(lines, 10, 30, {
    maxWidth: 180
});

    doc.save('base64-output.pdf');
};
