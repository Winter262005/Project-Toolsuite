'use strict';

(function() {
    const imageInput = document.getElementById('imageInput');
    const targetSizeInput = document.getElementById('targetSizeInput');
    const sizeUnitSelect = document.getElementById('sizeUnitSelect');
    const convertToJpegCheckbox = document.getElementById('convertToJpeg');
    const compressBtn = document.getElementById('compressBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const statusEl = document.getElementById('status');
    const previewBefore = document.getElementById('previewBefore');
    const previewAfter = document.getElementById('previewAfter');
    const originalInfo = document.getElementById('originalInfo');
    const compressedInfo = document.getElementById('compressedInfo');

    let originalFile = null;
    let compressedBlob = null;
    let originalObjectUrl = null;
    let compressedObjectUrl = null;

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const value = bytes / Math.pow(k, i);
        return value.toFixed(2) + ' ' + sizes[i];
    }

    function setStatus(text) {
        statusEl.textContent = text;
    }

    function revokeUrl(url) {
        if (url) {
            URL.revokeObjectURL(url);
        }
    }

    function getTargetSizeInBytes() {
        const size = parseFloat(targetSizeInput.value) || 500;
        const unit = sizeUnitSelect.value;
        return unit === 'MB' ? size * 1024 * 1024 : size * 1024;
    }

    imageInput.addEventListener('change', function() {
        const files = imageInput.files;
        if (!files || files.length === 0) {
            originalFile = null;
            setStatus('System Ready: Awaiting image...');
            originalInfo.textContent = 'No image selected.';
            previewBefore.src = '';
            previewBefore.style.display = 'none';
            downloadBtn.disabled = true;
            compressedInfo.textContent = 'No compressed image yet.';
            previewAfter.src = '';
            previewAfter.style.display = 'none';
            revokeUrl(originalObjectUrl);
            revokeUrl(compressedObjectUrl);
            compressedBlob = null;
            return;
        }

        const file = files[0];
        if (!file.type || !file.type.startsWith('image/')) {
            setStatus('Error: Unsupported file type. Please select an image.');
            imageInput.value = '';
            return;
        }

        originalFile = file;
        setStatus('Image loaded. Ready to compress.');

        revokeUrl(originalObjectUrl);
        originalObjectUrl = URL.createObjectURL(file);
        previewBefore.src = originalObjectUrl;
        previewBefore.style.display = 'block';

        originalInfo.textContent = 'Name: ' + file.name + ' | Size: ' + formatBytes(file.size) + ' | Type: ' + (file.type || 'unknown');

        const targetBytes = getTargetSizeInBytes();
        if (file.size <= targetBytes) {
            setStatus('Notice: Image is already smaller than target size.');
        } else if (file.size > 20 * 1024 * 1024) { // > 20 MB
            setStatus('Warning: Large image detected. Compression may take a moment.');
        }

        downloadBtn.disabled = true;
        compressedInfo.textContent = 'No compressed image yet.';
        previewAfter.src = '';
        previewAfter.style.display = 'none';
        revokeUrl(compressedObjectUrl);
        compressedBlob = null;
    });

    compressBtn.addEventListener('click', function() {
        if (!originalFile) {
            notify.info('Please select an image first.');
            return;
        }

        if (!window.HTMLCanvasElement) {
            setStatus('Error: Your browser does not support Canvas.');
            return;
        }

        const targetBytes = getTargetSizeInBytes();
        if (targetBytes < 1024) {
            notify.error('Target size too small. Please set at least 1 KB.');
            return;
        }

        const img = new Image();
        const tempUrl = URL.createObjectURL(originalFile);

        img.onload = function() {
            try {
                URL.revokeObjectURL(tempUrl);

                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                if (!width || !height) {
                    setStatus('Error: Unable to read image dimensions.');
                    return;
                }

                setStatus('Compressing to target size of ' + formatBytes(targetBytes) + '...');

                let outputType = originalFile.type || 'image/jpeg';
                let fillBackground = false;

                if (outputType === 'image/png' && convertToJpegCheckbox.checked) {
                    outputType = 'image/jpeg';
                    fillBackground = true;
                } else if (!/^image\/(png|jpeg|jpg|webp)$/i.test(outputType)) {
                    outputType = 'image/jpeg';
                    fillBackground = true;
                }

                // Start with original dimensions and high quality
                let currentScale = 1.0;
                let currentQuality = 0.9;
                let attempts = 0;
                const maxAttempts = 15;

                function tryCompress() {
                    attempts++;

                    const targetWidth = Math.max(1, Math.round(width * currentScale));
                    const targetHeight = Math.max(1, Math.round(height * currentScale));

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        setStatus('Error: Unable to get 2D drawing context.');
                        return;
                    }

                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    if (fillBackground) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, targetWidth, targetHeight);
                    }

                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                    if (!canvas.toBlob) {
                        setStatus('Error: Your browser does not support canvas.toBlob.');
                        return;
                    }

                    canvas.toBlob(function(blob) {
                        if (!blob) {
                            setStatus('Error: Compression failed.');
                            return;
                        }

                        const currentSize = blob.size;
                        const tolerance = targetBytes * 0.1; // 10% tolerance

                        // If we're within tolerance or very close, we're done
                        if (Math.abs(currentSize - targetBytes) <= tolerance || currentSize <= targetBytes) {
                            compressedBlob = blob;
                            revokeUrl(compressedObjectUrl);
                            compressedObjectUrl = URL.createObjectURL(blob);
                            previewAfter.src = compressedObjectUrl;
                            previewAfter.style.display = 'block';

                            const savings = originalFile.size > 0 ? ((1 - currentSize / originalFile.size) * 100) : 0;
                            const difference = Math.abs(currentSize - targetBytes);
                            const percentDiff = ((difference / targetBytes) * 100).toFixed(1);

                            compressedInfo.textContent = 'Size: ' + formatBytes(currentSize) +
                                ' | Target: ' + formatBytes(targetBytes) +
                                ' | Diff: ' + percentDiff + '%' +
                                ' | Savings: ' + savings.toFixed(1) + '%';

                            setStatus('Success! Compressed to ' + formatBytes(currentSize) +
                                ' (target was ' + formatBytes(targetBytes) + ')');
                            downloadBtn.disabled = false;
                            return;
                        }

                        // If file is still too big and we haven't exceeded max attempts
                        if (currentSize > targetBytes && attempts < maxAttempts) {
                            // Calculate how much we need to reduce
                            const ratio = targetBytes / currentSize;

                            if (ratio < 0.7 && currentScale > 0.3) {
                                // Need significant reduction - reduce dimensions
                                currentScale = Math.max(0.3, currentScale * Math.sqrt(ratio));
                                setStatus(`Attempt ${attempts}: ${formatBytes(currentSize)} > target. Reducing dimensions...`);
                            } else if (currentQuality > 0.1) {
                                // Fine-tune with quality
                                currentQuality = Math.max(0.1, currentQuality * Math.sqrt(ratio));
                                setStatus(`Attempt ${attempts}: ${formatBytes(currentSize)} > target. Reducing quality...`);
                            } else {
                                // Last resort - more aggressive dimension reduction
                                currentScale = Math.max(0.1, currentScale * 0.8);
                                setStatus(`Attempt ${attempts}: ${formatBytes(currentSize)} > target. Final dimension reduction...`);
                            }

                            setTimeout(tryCompress, 100); // Small delay to show progress
                            return;
                        }

                        // If we get here, we either succeeded or failed after max attempts
                        if (attempts >= maxAttempts) {
                            setStatus('Could not reach exact target size after ' + maxAttempts + ' attempts. Best result: ' + formatBytes(currentSize));
                        }

                        // Use the best result we got
                        compressedBlob = blob;
                        revokeUrl(compressedObjectUrl);
                        compressedObjectUrl = URL.createObjectURL(blob);
                        previewAfter.src = compressedObjectUrl;
                        previewAfter.style.display = 'block';

                        const savings = originalFile.size > 0 ? ((1 - currentSize / originalFile.size) * 100) : 0;
                        compressedInfo.textContent = 'Size: ' + formatBytes(currentSize) +
                            ' | Target: ' + formatBytes(targetBytes) +
                            ' | Savings: ' + savings.toFixed(1) + '%';

                        downloadBtn.disabled = false;
                    }, outputType, currentQuality);
                }

                // Start the compression process
                tryCompress();

            } catch (err) {
                console.error(err);
                setStatus('Error: ' + (err && err.message ? err.message : 'Unexpected error during compression.'));
            }
        };

        img.onerror = function() {
            URL.revokeObjectURL(tempUrl);
            setStatus('Error: Failed to load image. Please try a different file.');
        };

        setStatus('Loading image for compression...');
        img.src = tempUrl;
    });

    downloadBtn.addEventListener('click', function() {
        if (!compressedBlob || !originalFile) {
            return;
        }

        const originalName = originalFile.name || 'image';
        const dotIndex = originalName.lastIndexOf('.');
        const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

        const inferredType = compressedBlob.type || 'image/jpeg';
        let extension = 'jpg';
        if (/png/i.test(inferredType)) {
            extension = 'png';
        } else if (/webp/i.test(inferredType)) {
            extension = 'webp';
        } else if (/jpeg/i.test(inferredType) || /jpg/i.test(inferredType)) {
            extension = 'jpg';
        }

        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = baseName + '-compressed.' + extension;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
})();
