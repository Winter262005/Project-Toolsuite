const imageInput = document.getElementById('imageInput');
const fileList = document.getElementById('fileList');
const bulkActions = document.getElementById('bulkActions');
const btnDownloadAll = document.getElementById('btnDownloadAll');

let processedFiles = []; // Stores { name, blob, originalName }

imageInput.addEventListener('change', handleFiles);

function handleFiles(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    fileList.innerHTML = '';
    processedFiles = [];
    bulkActions.style.display = 'block';
    btnDownloadAll.disabled = true;

    files.forEach((file, index) => {
        createFileCard(file, index);
    });
}

function createFileCard(file, index) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = function() {
            // 1. Analyze Metadata
            EXIF.getData(img, function() {
                const allData = EXIF.getAllTags(this);
                const hasGPS = allData.GPSLatitude || allData.GPSLongitude;
                const camera = allData.Model;
                const software = allData.Software;
                
                let warningText = "";
                if (hasGPS) warningText += "⚠️ GPS LOCATION DETECTED. ";
                if (camera) warningText += `📸 Camera: ${camera}. `;
                if (software) warningText += `💻 Software: ${software}.`;
                
                if (!warningText && Object.keys(allData).length > 0) {
                    warningText = "⚠️ Hidden Metadata found.";
                } else if (!warningText) {
                    warningText = "<span class='meta-safe'>✓ No sensitive headers found.</span>";
                }

                // 2. Create Card UI
                const card = document.createElement('div');
                card.className = 'file-card';
                card.id = `card-${index}`;
                card.innerHTML = `
                    <img src="${img.src}" class="file-thumb">
                    <div>
                        <strong>${file.name}</strong>
                        <div class="meta-warning">${warningText}</div>
                        <div style="font-size: 0.8rem; margin-top: 5px;">
                            Original: ${(file.size / 1024).toFixed(1)} KB
                        </div>
                    </div>
                    <button onclick="scrubSingle('${index}')" id="btn-${index}">Scrub</button>
                `;
                fileList.appendChild(card);
                
                // Store reference for processing
                processedFiles[index] = { 
                    file: file, 
                    img: img, 
                    originalName: file.name,
                    isClean: false 
                };
            });
        };
    };
    reader.readAsDataURL(file);
}

async function scrubSingle(index) {
    const data = processedFiles[index];
    const btn = document.getElementById(`btn-${index}`);
    
    btn.textContent = "Cleaning...";
    btn.disabled = true;

    // The Magic: Draw to canvas to kill metadata
    const blob = await stripMetadata(data.img, data.file.type);
    
    // Update Data
    data.blob = blob;
    data.isClean = true;

    // Update UI
    const card = document.getElementById(`card-${index}`);
    const warning = card.querySelector('.meta-warning');
    warning.innerHTML = "<span class='meta-safe'>✓ SANITIZED & SAFE</span>";
    
    btn.textContent = "Download";
    btn.className = "btn-download";
    btn.disabled = false;
    btn.onclick = () => downloadSingle(index);

    checkAllDone();
}

function scrubAll() {
    processedFiles.forEach((data, index) => {
        if (!data.isClean) scrubSingle(index);
    });
}

function stripMetadata(imgElement, mimeType) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        const ctx = canvas.getContext('2d');
        
        // Draw the image onto the canvas (this drops all non-visual data)
        ctx.drawImage(imgElement, 0, 0);
        
        // Export as new blob
        canvas.toBlob((blob) => {
            resolve(blob);
        }, mimeType, 0.95); // 0.95 quality to maintain visual fidelity
    });
}

function downloadSingle(index) {
    const data = processedFiles[index];
    if (!data.blob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(data.blob);
    link.download = "clean_" + data.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadAll() {
    processedFiles.forEach((data, index) => {
        if (data.isClean) downloadSingle(index);
    });
}

function checkAllDone() {
    const allClean = processedFiles.every(f => f && f.isClean);
    if (allClean) {
        btnDownloadAll.disabled = false;
        document.getElementById('btnScrubAll').style.display = 'none';
    }
}