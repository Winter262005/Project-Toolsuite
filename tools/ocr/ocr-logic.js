'use strict';

const fileInput = document.getElementById('fileInput');
const imageUrl = document.getElementById('imageUrl');
const loadUrlBtn = document.getElementById('loadUrlBtn');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const exportFormat = document.getElementById('exportFormat');
const startScanner = document.getElementById('startScanner');
const resetBtn = document.getElementById('resetBtn');

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) {
        startScanner.style.display = 'none';
        imageUrl.disabled = false;
        loadUrlBtn.disabled = false;
        resetBtn.style.display = 'none';
        return;
    }
    startScanner.style.display = 'inline-block';
    imageUrl.disabled = true;
    loadUrlBtn.disabled = true;
    resetBtn.style.display = 'inline-block';
};

imageUrl.oninput = () => {
    if (imageUrl.value.trim().length > 0) {
        fileInput.disabled = true;
        resetBtn.style.display = 'inline-block';
    } else {
        fileInput.disabled = false;
        resetBtn.style.display = 'none';
    }
};

resetBtn.onclick = () => {
    fileInput.value = '';
    imageUrl.value = '';
    
    fileInput.disabled = false;
    imageUrl.disabled = false;
    loadUrlBtn.disabled = false;
    
    startScanner.style.display = 'none';
    resetBtn.style.display = 'none';
    
    output.value = '';
    output.setAttribute('readonly', true);
    status.textContent = 'System Status: Ready';
    progress.style.display = 'none';
};

startScanner.onclick = () => {
    const file = fileInput.files[0];
    if (file) {
        runOCR(file);
    }
};
async function runOCR(imageSource) {
    output.value = "";
    status.textContent = "Initializing Engine...";
    progress.style.display = "block";
    progress.value = 0;

    try {
        const language = document.getElementById('LanguageSelected').value;
        const result = await Tesseract.recognize(
            imageSource,
            language,
            {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        status.textContent = `Scanning: ${Math.round(m.progress * 100)}%`;
                        progress.value = m.progress;
                    }
                }
            }
        );

        output.value = result.data.text;
        output.removeAttribute('readonly');
        status.textContent = "Scan Complete!";
        progress.style.display = "none";

    } catch (err) {
        status.textContent = "Error: Could not read image.";
        console.error(err);
    }
} loadUrlBtn.onclick = async () => {
    const url = imageUrl.value.trim();

    if (!url) {
        status.textContent = "Please enter an image URL.";
        return;
    }

    runOCR(url);
};

copyBtn.onclick = () => {
    output.select();
    document.execCommand('copy');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "COPIED!";
    setTimeout(() => copyBtn.textContent = originalText, 2000);
};



function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

exportBtn.onclick = () => {
    const format = exportFormat.value;
    const text = output.value;

    if (!text) {
        alert("There is no text to export!");
        return;
    }

    if (format === 'txt') {
        const blob = new Blob([text], { type: 'text/plain' });
        triggerDownload(blob, 'ocr_extracted_text.txt');

    } else if (format === 'word') {
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
        const postHtml = "</body></html>";
        const html = preHtml + text.replace(/\n/g, '<br>') + postHtml;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        triggerDownload(blob, 'ocr_extracted_text.doc');
    }
};
