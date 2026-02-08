/**
 * Archive Studio Logic Engine
 * Separated for cleaner architecture.
 */

const app = {
    // STATE
    currentModule: 'extractor',
    archiveData: null,      // Holds the raw data from LibArchive or JSZip
    fileStructure: {},      // The Virtual File System (Nested Object)
    currentPath: [],        // Current navigation path array
    compressFiles: [],      // Array of files waiting to be zipped

    init: function() {
        console.log(">> ARCHIVE STUDIO INITIALIZED");
        
        // check file protocol for WASM warning
        if (window.location.protocol === 'file:') {
            document.getElementById('protocolWarning').style.display = 'block';
        }

        // Setup Drag & Drop Handlers
        this.setupDragDrop('extractDropzone', (files) => this.processArchive(files[0]));
        this.setupDragDrop('compressDropzone', (files) => this.addFilesToCompressor(files));
    },

    // --- UI NAVIGATION ---
    switchModule: function(mod) {
        // Toggle Nav
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const btn = document.querySelector(`.nav-item[onclick="app.switchModule('${mod}')"]`);
        if(btn) btn.classList.add('active');

        // Toggle Views
        document.querySelectorAll('.module').forEach(el => el.classList.remove('active'));
        document.getElementById(`module-${mod}`).classList.add('active');
        this.currentModule = mod;
    },

    // --- HELPER: DRAG & DROP ---
    setupDragDrop: function(elementId, callback) {
        const el = document.getElementById(elementId);
        if(!el) return;

        el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('dragover'); });
        el.addEventListener('dragleave', (e) => { e.preventDefault(); el.classList.remove('dragover'); });
        el.addEventListener('drop', (e) => {
            e.preventDefault(); 
            el.classList.remove('dragover');
            if(e.dataTransfer.files.length > 0) callback(Array.from(e.dataTransfer.files));
        });
    },

    showLoading: function(show) {
        document.getElementById('loader').style.display = show ? 'flex' : 'none';
    },

    setStatus: function(id, msg, type) {
        const el = document.getElementById(id);
        el.innerText = msg;
        el.className = `status-msg ${type}`;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 4000);
    },

    // ==========================================================
    // MODULE 1: EXTRACTOR LOGIC
    // ==========================================================

    handleArchiveSelect: function(e) {
        if(e.target.files.length > 0) this.processArchive(e.target.files[0]);
    },

    processArchive: async function(file) {
        this.showLoading(true);
        this.fileStructure = {}; // Reset Tree
        this.currentPath = [];
        const name = file.name.toLowerCase();

        try {
            if (name.endsWith('.zip')) {
                await this.processZip(file);
            } else {
                await this.processLibArchive(file);
            }
            
            // Show Explorer
            document.getElementById('extractDropzone').style.display = 'none';
            document.getElementById('fileExplorer').style.display = 'flex';
            this.renderTree();
            this.setStatus('extractStatus', `Opened ${file.name}`, 'success');
        } catch(err) {
            console.error(err);
            this.setStatus('extractStatus', `Error: ${err.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },

    processZip: async function(file) {
        const zip = new JSZip();
        this.archiveData = await zip.loadAsync(file);
        
        // Parse Tree
        this.archiveData.forEach((relativePath, zipEntry) => {
            this.addToVirtualFS(relativePath, !zipEntry.dir, 'zip', zipEntry);
        });
    },

    processLibArchive: async function(file) {
        // Init WASM
        window.Archive.init({ workerUrl: 'https://unpkg.com/libarchive.js@1.3.0/dist/worker-bundle.js' });
        
        const archive = await window.Archive.open(file);
        const extracted = await archive.extractFiles(); // Returns nested object structure directly
        
        // LibArchive structure is slightly different, let's normalize it to flat path insertion
        // Actually LibArchive returns { "folder": { "file": FileObj } }
        // We can use that structure directly but to keep logic unified, let's traverse it
        // For simplicity in this demo code, let's map the object LibArchive returns to our format:
        this.flattenLibArchiveTree(extracted, "");
        this.archiveData = extracted; // Backup reference
    },

    flattenLibArchiveTree: function(obj, currentPathStr) {
        Object.keys(obj).forEach(key => {
            const item = obj[key];
            const fullPath = currentPathStr ? `${currentPathStr}/${key}` : key;
            
            if (item instanceof File) {
                this.addToVirtualFS(fullPath, true, 'wasm', item);
            } else {
                // It's a folder object
                this.addToVirtualFS(fullPath, false, 'wasm', null);
                this.flattenLibArchiveTree(item, fullPath);
            }
        });
    },

    // Core VFS Logic: Inserts path "a/b/c.txt" into object tree
    addToVirtualFS: function(path, isFile, type, dataObj) {
        const parts = path.split('/').filter(p => p !== '');
        let current = this.fileStructure;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = (i === parts.length - 1);

            if (!current[part]) {
                current[part] = { 
                    _type: (isLast && isFile) ? 'file' : 'folder',
                    _data: (isLast && isFile) ? dataObj : null,
                    _engine: type,
                    _children: {} // Sub-items
                };
            }
            
            // If it's a folder, we might need to go deeper
            if (!isLast) {
                if(current[part]._type === 'file') return; // Conflict check
                current = current[part]._children;
            }
        }
    },

    // --- RENDERER ---
    navigate: function(target) {
        if(target === 'root') {
            this.currentPath = [];
        } else if (target === '..') {
            this.currentPath.pop();
        } else {
            this.currentPath.push(target);
        }
        this.renderTree();
    },

    renderTree: function() {
        // 1. Traverse to current location
        let pointer = this.fileStructure;
        this.currentPath.forEach(p => {
            if(pointer[p] && pointer[p]._children) pointer = pointer[p]._children;
        });

        // 2. Build Breadcrumbs
        const breadDiv = document.getElementById('breadcrumbBar');
        breadDiv.innerHTML = `<span class="breadcrumb-link" onclick="app.navigate('root')">ROOT</span>`;
        this.currentPath.forEach((p, i) => {
            breadDiv.innerHTML += ` <span class="breadcrumb-sep">/</span> <span class="breadcrumb-link" style="color:#fff; cursor:default;">${p}</span>`;
        });

        // 3. Render List
        const list = document.getElementById('folderTree');
        list.innerHTML = '';

        // Add "Go Up"
        if(this.currentPath.length > 0) {
            list.innerHTML += `<li class="tree-item folder" onclick="app.navigate('..')">.. (Up)</li>`;
        }

        const keys = Object.keys(pointer).sort();
        
        if(keys.length === 0) {
            list.innerHTML += `<li style="padding:20px; color:#555; text-align:center;">Empty Directory</li>`;
        }

        keys.forEach(key => {
            if (key.startsWith('_')) return; // skip internal props
            const item = pointer[key];
            
            const li = document.createElement('li');
            li.className = `tree-item ${item._type}`;
            li.innerText = key;
            
            if(item._type === 'folder') {
                li.onclick = () => this.navigate(key);
            } else {
                li.onclick = () => this.downloadFile(key, item);
            }
            list.appendChild(li);
        });
    },

    downloadFile: async function(filename, item) {
        if(!confirm(`Download ${filename}?`)) return;
        this.showLoading(true);

        try {
            let blob;
            if(item._engine === 'zip') {
                blob = await item._data.async('blob');
            } else {
                blob = item._data; // LibArchive returns File object directly
            }
            saveAs(blob, filename);
        } catch(e) {
            notify.error("Error downloading file: " + e.message);
        } finally {
            this.showLoading(false);
        }
    },

    // ==========================================================
    // MODULE 2: COMPRESSOR LOGIC
    // ==========================================================

    handleCompressSelect: function(e) {
        if(e.target.files.length > 0) {
            this.addFilesToCompressor(Array.from(e.target.files));
        }
        e.target.value = ''; // reset input
    },

    addFilesToCompressor: function(files) {
        // Deduplicate
        files.forEach(f => {
            if(!this.compressFiles.some(existing => existing.name === f.name)) {
                this.compressFiles.push(f);
            }
        });
        this.renderCompressList();
    },

    renderCompressList: function() {
        const list = document.getElementById('compressList');
        const btn = document.getElementById('compressBtn');
        list.innerHTML = '';

        if(this.compressFiles.length === 0) {
            list.innerHTML = `<div style="text-align:center; color:#555; padding:20px;">No files selected</div>`;
            btn.disabled = true;
            return;
        }

        this.compressFiles.forEach((f, i) => {
            const div = document.createElement('div');
            div.className = 'list-row';
            div.innerHTML = `
                <span style="color:#fff;">${f.name} <span style="color:#555; font-size:0.8rem;">(${(f.size/1024).toFixed(1)} KB)</span></span>
                <button class="remove-btn" onclick="app.removeCompressFile(${i})">REMOVE</button>
            `;
            list.appendChild(div);
        });
        btn.disabled = false;
    },

    removeCompressFile: function(index) {
        this.compressFiles.splice(index, 1);
        this.renderCompressList();
    },

    createZip: async function() {
        if(this.compressFiles.length === 0) return;
        
        this.showLoading(true);
        const zip = new JSZip();
        
        this.compressFiles.forEach(f => {
            zip.file(f.name, f);
        });

        try {
            const content = await zip.generateAsync({type:"blob"});
            saveAs(content, "archive_studio_output.zip");
            this.setStatus('compressStatus', 'Zip created successfully!', 'success');
            // Optional: Clear list
            // this.compressFiles = [];
            // this.renderCompressList();
        } catch(e) {
            this.setStatus('compressStatus', 'Error: ' + e.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }
};

// Start
window.onload = () => app.init();