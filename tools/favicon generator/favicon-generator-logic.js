'use strict';

(function() {
    const imageInput = document.getElementById('imageInput');
    const generateBtn = document.getElementById('generateBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const statusEl = document.getElementById('status');
    const previewSection = document.getElementById('previewSection');
    const downloadSection = document.getElementById('downloadSection');
    const previewGrid = document.getElementById('previewGrid');
    const downloadGrid = document.getElementById('downloadGrid');
    const formatSelect = document.getElementById('formatSelect');

    let originalFile = null;
    let generatedFavicons = [];

    const FAVICON_SIZES = [
        { id: 'size16', size: 16, name: '16x16' },
        { id: 'size32', size: 32, name: '32x32' },
        { id: 'size57', size: 57, name: '57x57' },
        { id: 'size72', size: 72, name: '72x72' },
        { id: 'size96', size: 96, name: '96x96' },
        { id: 'size114', size: 114, name: '114x114' },
        { id: 'size128', size: 128, name: '128x128' },
        { id: 'size144', size: 144, name: '144x144' },
        { id: 'size152', size: 152, name: '152x152' },
        { id: 'size180', size: 180, name: '180x180' },
        { id: 'size192', size: 192, name: '192x192' },
        { id: 'size194', size: 194, name: '194x194' },
        { id: 'size256', size: 256, name: '256x256' },
        { id: 'size310', size: 310, name: '310x310' },
        { id: 'size384', size: 384, name: '384x384' },
        { id: 'size512', size: 512, name: '512x512' }
    ];

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const value = bytes / Math.pow(k, i);
        return value.toFixed(2) + ' ' + sizes[i];
    }

    function setStatus(text) {
        statusEl.textContent = text;
    }

    function getSelectedSizes() {
        return FAVICON_SIZES.filter(sizeInfo => {
            const checkbox = document.getElementById(sizeInfo.id);
            return checkbox && checkbox.checked;
        });
    }

    function createFavicon(img, size, format) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;

            // Fill with white background for JPG format
            if (format === 'jpg' || format === 'jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);
            }

            // Calculate scaling to fit image in square canvas
            const sourceSize = Math.min(img.naturalWidth, img.naturalHeight);
            const sourceX = (img.naturalWidth - sourceSize) / 2;
            const sourceY = (img.naturalHeight - sourceSize) / 2;

            ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

            if (format === 'ico') {
                // For ICO format, we'll create a PNG and convert it
                canvas.toBlob(function(blob) {
                    if (blob) {
                        resolve({
                            blob: blob,
                            size: size,
                            format: 'png',
                            filename: `favicon-${size}x${size}.png`
                        });
                    } else {
                        reject(new Error('Failed to create favicon'));
                    }
                }, 'image/png');
            } else {
                const mimeType = format === 'jpg' || format === 'jpeg' ? 'image/jpeg' : 'image/png';
                canvas.toBlob(function(blob) {
                    if (blob) {
                        resolve({
                            blob: blob,
                            size: size,
                            format: format,
                            filename: `favicon-${size}x${size}.${format}`
                        });
                    } else {
                        reject(new Error('Failed to create favicon'));
                    }
                }, mimeType, 0.9);
            }
        });
    }

    function generateFavicons(img, selectedSizes, format) {
        const promises = selectedSizes.map(sizeInfo => 
            createFavicon(img, sizeInfo.size, format)
        );

        return Promise.all(promises);
    }

    function displayPreviews(favicons) {
        previewGrid.innerHTML = '';
        
        favicons.forEach(favicon => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'favicon-preview';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(favicon.blob);
            img.width = Math.min(favicon.size, 64);
            img.height = Math.min(favicon.size, 64);
            img.alt = `${favicon.size}x${favicon.size} favicon`;
            
            const sizeLabel = document.createElement('div');
            sizeLabel.className = 'size-label';
            sizeLabel.textContent = `${favicon.size}x${favicon.size}`;
            
            const sizeInfo = document.createElement('div');
            sizeInfo.style.fontSize = '0.8rem';
            sizeInfo.textContent = formatBytes(favicon.blob.size);
            
            previewDiv.appendChild(img);
            previewDiv.appendChild(sizeLabel);
            previewDiv.appendChild(sizeInfo);
            previewGrid.appendChild(previewDiv);
        });
    }

    function displayDownloads(favicons) {
        downloadGrid.innerHTML = '';
        
        favicons.forEach((favicon, index) => {
            const downloadBtn = document.createElement('a');
            downloadBtn.className = 'download-btn';
            downloadBtn.href = '#';
            downloadBtn.textContent = `Download ${favicon.size}x${favicon.size} (${formatBytes(favicon.blob.size)})`;
            
            downloadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const url = URL.createObjectURL(favicon.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = favicon.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
            
            downloadGrid.appendChild(downloadBtn);
        });
    }

    async function downloadAllAsZip(favicons) {
        if (!window.JSZip) {
            notify.info('ZIP download requires JSZip library. Please download individual files.');
            return;
        }

        try {
            setStatus('Creating ZIP file...');
            
            const zip = new JSZip();
            const folder = zip.folder('favicons');
            
            favicons.forEach(favicon => {
                folder.file(favicon.filename, favicon.blob);
            });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'favicons.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setStatus('ZIP file downloaded successfully!');
        } catch (error) {
            console.error('Error creating ZIP:', error);
            setStatus('Error creating ZIP file. Please download individual files.');
        }
    }

    imageInput.addEventListener('change', function() {
        const files = imageInput.files;
        if (!files || files.length === 0) {
            originalFile = null;
            setStatus('System Ready: Awaiting image...');
            previewSection.style.display = 'none';
            downloadSection.style.display = 'none';
            generatedFavicons = [];
            return;
        }

        const file = files[0];
        if (!file.type || !file.type.startsWith('image/')) {
            setStatus('Error: Unsupported file type. Please select an image.');
            imageInput.value = '';
            return;
        }

        originalFile = file;
        setStatus('Image loaded. Ready to generate favicons.');
        previewSection.style.display = 'none';
        downloadSection.style.display = 'none';
        generatedFavicons = [];
    });

    generateBtn.addEventListener('click', async function() {
        if (!originalFile) {
            notify.info('Please select an image first.');
            return;
        }

        if (!window.HTMLCanvasElement) {
            setStatus('Error: Your browser does not support Canvas.');
            return;
        }

        const selectedSizes = getSelectedSizes();
        if (selectedSizes.length === 0) {
            notify.info('Please select at least one favicon size.');
            return;
        }

        const format = formatSelect.value;
        setStatus('Generating favicons...');

        const img = new Image();
        const tempUrl = URL.createObjectURL(originalFile);

        img.onload = async function() {
            try {
                URL.revokeObjectURL(tempUrl);
                
                generatedFavicons = await generateFavicons(img, selectedSizes, format);
                
                displayPreviews(generatedFavicons);
                displayDownloads(generatedFavicons);
                
                previewSection.style.display = 'block';
                downloadSection.style.display = 'block';
                
                setStatus(`Success! Generated ${generatedFavicons.length} favicons.`);
                
            } catch (error) {
                console.error('Error generating favicons:', error);
                setStatus('Error: Failed to generate favicons. Please try again.');
            }
        };

        img.onerror = function() {
            URL.revokeObjectURL(tempUrl);
            setStatus('Error: Failed to load image. Please try a different file.');
        };

        img.src = tempUrl;
    });

    downloadAllBtn.addEventListener('click', function() {
        if (generatedFavicons.length === 0) {
            notify.info('No favicons generated yet.');
            return;
        }

        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            // Load JSZip from CDN if not available
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = function() {
                downloadAllAsZip(generatedFavicons);
            };
            script.onerror = function() {
                notify.error('Failed to load ZIP library. Please download individual files.');
            };
            document.head.appendChild(script);
        } else {
            downloadAllAsZip(generatedFavicons);
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'o':
                    e.preventDefault();
                    imageInput.click();
                    break;
                case 'g':
                    e.preventDefault();
                    generateBtn.click();
                    break;
            }
        }
    });
})();
