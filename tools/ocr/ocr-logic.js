'use strict';

const fileInput = document.getElementById('fileInput');
const imageUrl = document.getElementById('imageUrl');
const loadUrlBtn = document.getElementById('loadUrlBtn');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');

fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    runOCR(file);
};
async function runOCR(imageSource) {
    output.value = "";
    status.textContent = "Initializing Engine...";
    progress.style.display = "block";
    progress.value = 0;

    try {
        const result = await Tesseract.recognize(
            imageSource,
            'eng',
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
        status.textContent = "Scan Complete!";
        progress.style.display = "none";

    } catch (err) {
        status.textContent = "Error: Could not read image.";
        console.error(err);
    }
}loadUrlBtn.onclick = async () => {
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
