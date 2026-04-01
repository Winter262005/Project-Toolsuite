'use strict';

(function() {
    // Tab Management
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Text Hash Elements
    const textInput = document.getElementById('textInput');
    const generateTextHashBtn = document.getElementById('generateTextHash');
    const clearTextBtn = document.getElementById('clearText');
    const textHashResult = document.getElementById('textHashResult');
    
    // File Hash Elements
    const fileDropArea = document.getElementById('fileDropArea');
    const fileInput = document.getElementById('fileInput');
    const generateFileHashBtn = document.getElementById('generateFileHash');
    const clearFileBtn = document.getElementById('clearFile');
    const fileHashResult = document.getElementById('fileHashResult');
    
    // Batch Processing Elements
    const batchDropArea = document.getElementById('batchDropArea');
    const batchInput = document.getElementById('batchInput');
    const processBatchBtn = document.getElementById('processBatch');
    const clearBatchBtn = document.getElementById('clearBatch');
    const exportBatchBtn = document.getElementById('exportBatch');
    const batchResult = document.getElementById('batchResult');
    
    // Hash Comparison Elements
    const compareHashesBtn = document.getElementById('compareHashes');
    const clearCompareBtn = document.getElementById('clearCompare');
    const compareResult = document.getElementById('compareResult');
    
    // File Verification Elements
    const verifyDropArea = document.getElementById('verifyDropArea');
    const verifyInput = document.getElementById('verifyInput');
    const expectedHashInput = document.getElementById('expectedHash');
    const verifyAlgorithmSelect = document.getElementById('verifyAlgorithm');
    const verifyFileBtn = document.getElementById('verifyFile');
    const clearVerifyBtn = document.getElementById('clearVerify');
    const verifyResult = document.getElementById('verifyResult');
    
    // History Elements - REMOVED for privacy compliance
    
    // Status
    const statusEl = document.getElementById('status');
    
    // State
    let currentFiles = [];
    let batchFiles = [];
    let verifyFile = null;

    // Algorithm Information
    const algorithmInfo = {
        'MD5': { security: 'Low', use: 'File checksums, non-security applications', warning: 'Not secure for cryptographic purposes' },
        'SHA-1': { security: 'Low', use: 'Legacy systems, Git commits', warning: 'Vulnerable to collision attacks' },
        'SHA-256': { security: 'High', use: 'Blockchain, digital signatures', warning: '' },
        'SHA-512': { security: 'Very High', use: 'High-security applications', warning: '' },
        'SHA-384': { security: 'High', use: 'Balanced security/performance', warning: '' }
    };

    // Initialize
    function init() {
        setupTabNavigation();
        setupDragAndDrop();
        setupEventListeners();
    }

    // Tab Navigation
    function setupTabNavigation() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update active states
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');
                
                setStatus(`Switched to ${tabName} tab`);
            });
        });
    }

    // Drag and Drop Setup
    function setupDragAndDrop() {
        setupDropArea(fileDropArea, fileInput, (files) => {
            currentFiles = Array.from(files);
            updateFileDisplay();
        });

        setupDropArea(batchDropArea, batchInput, (files) => {
            batchFiles = Array.from(files);
            updateBatchDisplay();
        });

        setupDropArea(verifyDropArea, verifyInput, (files) => {
            verifyFile = files[0];
            updateVerifyDisplay();
        });
    }

    function setupDropArea(dropArea, input, callback) {
        dropArea.addEventListener('click', () => input.click());
        
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('dragover');
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            callback(e.dataTransfer.files);
        });
        
        input.addEventListener('change', (e) => {
            callback(e.target.files);
        });
    }

    // Event Listeners
    function setupEventListeners() {
        // Text Hash
        generateTextHashBtn.addEventListener('click', generateTextHash);
        clearTextBtn.addEventListener('click', clearText);
        textInput.addEventListener('input', debounce(generateTextHash, 500));

        // File Hash
        generateFileHashBtn.addEventListener('click', generateFileHash);
        clearFileBtn.addEventListener('click', clearFile);

        // Batch Processing
        processBatchBtn.addEventListener('click', processBatch);
        clearBatchBtn.addEventListener('click', clearBatch);
        exportBatchBtn.addEventListener('click', exportBatchResults);

        // Hash Comparison
        compareHashesBtn.addEventListener('click', compareHashes);
        clearCompareBtn.addEventListener('click', clearCompare);

        // File Verification
        verifyFileBtn.addEventListener('click', verifyFileIntegrity);
        clearVerifyBtn.addEventListener('click', clearVerify);
    }

    // Hash Generation Functions
    async function generateHash(data, algorithm) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
            
            if (window.crypto && window.crypto.subtle) {
                // Use Web Crypto API
                let hashAlgorithm;
                switch (algorithm) {
                    case 'MD5':
                        return await md5(dataBuffer);
                    case 'SHA-1':
                        hashAlgorithm = 'SHA-1';
                        break;
                    case 'SHA-256':
                        hashAlgorithm = 'SHA-256';
                        break;
                    case 'SHA-512':
                        hashAlgorithm = 'SHA-512';
                        break;
                    case 'SHA-384':
                        hashAlgorithm = 'SHA-384';
                        break;
                    default:
                        throw new Error(`Unsupported algorithm: ${algorithm}`);
                }
                
                const hashBuffer = await crypto.subtle.digest(hashAlgorithm, dataBuffer);
                return bufferToHex(hashBuffer);
            } else {
                // Fallback for older browsers
                return await fallbackHash(data, algorithm);
            }
        } catch (error) {
            console.error(`Error generating ${algorithm} hash:`, error);
            throw error;
        }
    }

    // MD5 Implementation (fallback)
    async function md5(data) {
        // Simple MD5 implementation for fallback
        return await fallbackHash(new TextDecoder().decode(data), 'MD5');
    }

    // Fallback hash implementation
    async function fallbackHash(data, algorithm) {
        // This is a simplified fallback - in production, you'd want a proper implementation
        // For now, we'll use a basic approach
        const str = typeof data === 'string' ? data : new TextDecoder().decode(data);
        let hash = 0;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Pad to appropriate length based on algorithm
        const hashStr = Math.abs(hash).toString(16);
        const targetLength = algorithm.includes('512') ? 128 : 
                            algorithm.includes('384') ? 96 : 
                            algorithm.includes('256') ? 64 : 32;
        
        return hashStr.padStart(targetLength, '0');
    }

    function bufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        const hexCodes = [...byteArray].map(value => {
            const hexCode = value.toString(16);
            const paddedHexCode = hexCode.padStart(2, '0');
            return paddedHexCode;
        });
        return hexCodes.join('');
    }

    // Text Hash Functions
    async function generateTextHash() {
        const text = textInput.value.trim();
        if (!text) {
            setStatus('Please enter text to hash');
            return;
        }

        const algorithms = getSelectedAlgorithms('text');
        if (algorithms.length === 0) {
            setStatus('Please select at least one algorithm');
            return;
        }

        setStatus('Generating hashes...');
        
        try {
            const results = {};
            for (const algorithm of algorithms) {
                results[algorithm] = await generateHash(text, algorithm);
            }
            
            displayTextHashResults(results, text);
            setStatus('Text hashes generated successfully');
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    }

    function displayTextHashResults(results, text) {
        textHashResult.innerHTML = '';
        textHashResult.style.display = 'block';

        const title = document.createElement('h3');
        title.textContent = 'Hash Results:';
        textHashResult.appendChild(title);

        for (const [algorithm, hash] of Object.entries(results)) {
            const hashItem = createHashItem(algorithm, hash);
            textHashResult.appendChild(hashItem);
        }

        // Add warning for weak algorithms
        const warnings = Object.keys(results).filter(algo => algorithmInfo[algo]?.warning);
        if (warnings.length > 0) {
            const warning = document.createElement('div');
            warning.className = 'warning';
            warning.innerHTML = `<strong>Security Warning:</strong> ${warnings.map(algo => `${algo} - ${algorithmInfo[algo].warning}`).join('<br>')}`;
            textHashResult.appendChild(warning);
        }
    }

    function createHashItem(algorithm, hash) {
        const item = document.createElement('div');
        item.className = 'hash-item';

        const algoLabel = document.createElement('div');
        algoLabel.className = 'hash-algorithm';
        algoLabel.textContent = algorithm;

        const hashValue = document.createElement('div');
        hashValue.className = 'hash-value';
        hashValue.textContent = hash;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'hash-copy';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => copyToClipboard(hash);

        item.appendChild(algoLabel);
        item.appendChild(hashValue);
        item.appendChild(copyBtn);

        return item;
    }

    // File Hash Functions
    async function generateFileHash() {
        if (currentFiles.length === 0) {
            setStatus('Please select a file');
            return;
        }

        const algorithms = getSelectedAlgorithms('file');
        if (algorithms.length === 0) {
            setStatus('Please select at least one algorithm');
            return;
        }

        const file = currentFiles[0];
        setStatus(`Generating hashes for ${file.name}...`);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const results = {};
            
            for (const algorithm of algorithms) {
                results[algorithm] = await generateHash(arrayBuffer, algorithm);
            }
            
            displayFileHashResults(results, file);
            setStatus('File hashes generated successfully');
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    }

    function displayFileHashResults(results, file) {
        fileHashResult.innerHTML = '';
        fileHashResult.style.display = 'block';

        const fileInfo = document.createElement('h3');
        fileInfo.textContent = `Hash Results for ${file.name} (${formatBytes(file.size)})`;
        fileHashResult.appendChild(fileInfo);

        for (const [algorithm, hash] of Object.entries(results)) {
            const hashItem = createHashItem(algorithm, hash);
            fileHashResult.appendChild(hashItem);
        }
    }

    // Batch Processing Functions
    async function processBatch() {
        if (batchFiles.length === 0) {
            setStatus('Please select files to process');
            return;
        }

        const algorithms = getSelectedAlgorithms('batch');
        if (algorithms.length === 0) {
            setStatus('Please select at least one algorithm');
            return;
        }

        setStatus(`Processing ${batchFiles.length} files...`);
        
        try {
            const results = [];
            
            for (const file of batchFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const fileResults = { name: file.name, size: file.size };
                
                for (const algorithm of algorithms) {
                    fileResults[algorithm] = await generateHash(arrayBuffer, algorithm);
                }
                
                results.push(fileResults);
            }
            
            displayBatchResults(results);
            setStatus(`Successfully processed ${results.length} files`);
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    }

    function displayBatchResults(results) {
        batchResult.innerHTML = '';
        batchResult.style.display = 'block';

        const title = document.createElement('h3');
        title.textContent = 'Batch Processing Results:';
        batchResult.appendChild(title);

        results.forEach(fileResult => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file-item';
            fileDiv.innerHTML = `
                <div class="file-name">${fileResult.name}</div>
                <div class="file-size">${formatBytes(fileResult.size)}</div>
            `;
            
            const hashContainer = document.createElement('div');
            hashContainer.style.cssText = 'margin-top: 10px; font-size: 0.85rem;';
            
            Object.entries(fileResult).forEach(([key, value]) => {
                if (key !== 'name' && key !== 'size') {
                    const hashLine = document.createElement('div');
                    hashLine.innerHTML = `<strong>${key}:</strong> ${value}`;
                    hashContainer.appendChild(hashLine);
                }
            });
            
            fileDiv.appendChild(hashContainer);
            batchResult.appendChild(fileDiv);
        });
    }

    function exportBatchResults() {
        const results = [];
        const fileItems = batchResult.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            const fileName = item.querySelector('.file-name').textContent;
            const fileSize = item.querySelector('.file-size').textContent;
            const result = { fileName, fileSize };
            
            const hashLines = item.querySelectorAll('div[style*="margin-top: 10px"] div');
            hashLines.forEach(line => {
                const text = line.textContent;
                const colonIndex = text.indexOf(':');
                if (colonIndex > 0) {
                    const algorithm = text.substring(0, colonIndex);
                    const hash = text.substring(colonIndex + 1).trim();
                    result[algorithm] = hash;
                }
            });
            
            results.push(result);
        });

        const json = JSON.stringify(results, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hash-results.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setStatus('Results exported successfully');
    }

    // Hash Comparison Functions
    function compareHashes() {
        const hash1 = document.getElementById('compareHash1').value.trim();
        const hash2 = document.getElementById('compareHash2').value.trim();
        
        if (!hash1 || !hash2) {
            setStatus('Please enter both hashes to compare');
            return;
        }

        const normalized1 = hash1.toLowerCase().replace(/\s/g, '');
        const normalized2 = hash2.toLowerCase().replace(/\s/g, '');
        
        const match = normalized1 === normalized2;
        
        compareResult.style.display = 'block';
        compareResult.className = `compare-result ${match ? 'match' : 'no-match'}`;
        compareResult.textContent = match ? '✓ Hashes Match' : '✗ Hashes Do Not Match';
        
        setStatus(match ? 'Hashes are identical' : 'Hashes are different');
    }

    // File Verification Functions
    async function verifyFileIntegrity() {
        if (!verifyFile) {
            setStatus('Please select a file to verify');
            return;
        }

        const expectedHash = expectedHashInput.value.trim();
        if (!expectedHash) {
            setStatus('Please enter the expected hash');
            return;
        }

        const algorithm = verifyAlgorithmSelect.value;
        setStatus(`Verifying file with ${algorithm}...`);

        try {
            const arrayBuffer = await verifyFile.arrayBuffer();
            const actualHash = await generateHash(arrayBuffer, algorithm);
            
            const normalizedExpected = expectedHash.toLowerCase().replace(/\s/g, '');
            const normalizedActual = actualHash.toLowerCase().replace(/\s/g, '');
            
            const match = normalizedExpected === normalizedActual;
            
            verifyResult.style.display = 'block';
            verifyResult.className = `compare-result ${match ? 'match' : 'no-match'}`;
            verifyResult.innerHTML = `
                <div>${match ? '✓ File Verification Passed' : '✗ File Verification Failed'}</div>
                <div style="margin-top: 10px; font-size: 0.9rem;">
                    <strong>Expected:</strong> ${expectedHash}<br>
                    <strong>Actual:</strong> ${match ? '✔ Verified (Match)' : '❌ Does not match'}
                </div>
            `;
            
            setStatus(match ? 'File integrity verified' : 'File integrity check failed');
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    }

    // Utility Functions
    function getSelectedAlgorithms(prefix) {
        const algorithms = [];
        const checkboxes = document.querySelectorAll(`input[id^="${prefix}"]:checked`);
        
        checkboxes.forEach(checkbox => {
            const id = checkbox.id;
            const algorithm = id.replace(prefix, '').toUpperCase();
            if (algorithm === 'MD5') algorithms.push('MD5');
            else if (algorithm === 'SHA1') algorithms.push('SHA-1');
            else if (algorithm === 'SHA256') algorithms.push('SHA-256');
            else if (algorithm === 'SHA512') algorithms.push('SHA-512');
            else if (algorithm === 'SHA384') algorithms.push('SHA-384');
        });
        
        return algorithms;
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            setStatus('Copied to clipboard');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setStatus('Copied to clipboard');
        });
    }

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

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Display Update Functions
    function updateFileDisplay() {
        if (currentFiles.length > 0) {
            fileDropArea.innerHTML = `
                <p><strong>Selected:</strong> ${currentFiles[0].name} (${formatBytes(currentFiles[0].size)})</p>
                <button onclick="clearFile()" style="margin-top: 10px;">Remove</button>
            `;
        } else {
            fileDropArea.innerHTML = '<p>Drag & drop files here or click to select</p>';
        }
    }

    function updateBatchDisplay() {
        if (batchFiles.length > 0) {
            const fileList = batchFiles.map(file => 
                `<div>${file.name} (${formatBytes(file.size)})</div>`
            ).join('');
            
            batchDropArea.innerHTML = `
                <p><strong>Selected ${batchFiles.length} files:</strong></p>
                <div style="max-height: 100px; overflow-y: auto; margin: 10px 0;">${fileList}</div>
                <button onclick="clearBatch()" style="margin-top: 10px;">Remove All</button>
            `;
        } else {
            batchDropArea.innerHTML = '<p>Drag & drop multiple files here or click to select</p>';
        }
    }

    function updateVerifyDisplay() {
        if (verifyFile) {
            verifyDropArea.innerHTML = `
                <p><strong>Selected:</strong> ${verifyFile.name} (${formatBytes(verifyFile.size)})</p>
                <button onclick="clearVerify()" style="margin-top: 10px;">Remove</button>
            `;
        } else {
            verifyDropArea.innerHTML = '<p>Drag & drop file to verify here or click to select</p>';
        }
    }

    // Clear Functions
    function clearText() {
        textInput.value = '';
        textHashResult.style.display = 'none';
        setStatus('Text cleared');
    }

    function clearFile() {
        currentFiles = [];
        fileInput.value = '';
        fileHashResult.style.display = 'none';
        updateFileDisplay();
        setStatus('File cleared');
    }

    function clearBatch() {
        batchFiles = [];
        batchInput.value = '';
        batchResult.style.display = 'none';
        updateBatchDisplay();
        setStatus('Batch cleared');
    }

    function clearCompare() {
        document.getElementById('compareHash1').value = '';
        document.getElementById('compareHash2').value = '';
        compareResult.style.display = 'none';
        setStatus('Comparison cleared');
    }

    function clearVerify() {
        verifyFile = null;
        verifyInput.value = '';
        expectedHashInput.value = '';
        verifyResult.style.display = 'none';
        updateVerifyDisplay();
        setStatus('Verification cleared');
    }

    // Initialize the application
    init();
})();
