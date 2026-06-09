'use strict';

(function() {
    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Key Generator Elements
    const genKeySize = document.getElementById('genKeySize');
    const btnGenerateKeyPair = document.getElementById('btnGenerateKeyPair');
    const genPublicKey = document.getElementById('genPublicKey');
    const genPrivateKey = document.getElementById('genPrivateKey');
    
    const btnUseGenPublicKey = document.getElementById('btnUseGenPublicKey');
    const btnUseGenPrivateKey = document.getElementById('btnUseGenPrivateKey');
    
    const btnCopyGenPublic = document.getElementById('btnCopyGenPublic');
    const btnDownloadGenPublic = document.getElementById('btnDownloadGenPublic');
    const btnCopyGenPrivate = document.getElementById('btnCopyGenPrivate');
    const btnDownloadGenPrivate = document.getElementById('btnDownloadGenPrivate');

    // Encrypt Form Elements
    const encKeySize = document.getElementById('encKeySize');
    const encPublicKey = document.getElementById('encPublicKey');
    const encPlaintext = document.getElementById('encPlaintext');
    const encCharCounter = document.getElementById('encCharCounter');
    const btnEncrypt = document.getElementById('btnEncrypt');
    const btnClearEncrypt = document.getElementById('btnClearEncrypt');
    const encCiphertext = document.getElementById('encCiphertext');
    const encResultActions = document.getElementById('encResultActions');
    const btnCopyCiphertext = document.getElementById('btnCopyCiphertext');

    // Decrypt Form Elements
    const decKeySize = document.getElementById('decKeySize');
    const decPrivateKey = document.getElementById('decPrivateKey');
    const decCiphertext = document.getElementById('decCiphertext');
    const btnDecrypt = document.getElementById('btnDecrypt');
    const btnClearDecrypt = document.getElementById('btnClearDecrypt');
    const decPlaintext = document.getElementById('decPlaintext');
    const decResultActions = document.getElementById('decResultActions');
    const btnCopyPlaintext = document.getElementById('btnCopyPlaintext');

    // Status Area
    const statusEl = document.getElementById('status');

    // Keep track of last generated PEMs to easily use in tabs
    let currentGeneratedPublicPEM = '';
    let currentGeneratedPrivatePEM = '';

    // Initialize the Page
    function init() {
        setupTabs();
        setupEventListeners();
        setStatus('Ready');
    }

    // Status Helper
    function setStatus(msg, isError = false) {
        statusEl.textContent = msg;
        if (isError) {
            statusEl.style.color = '#d9534f';
        } else {
            statusEl.style.color = 'var(--muted)';
        }
    }

    // Tab Navigation switching
    function setupTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                switchTab(tabName);
            });
        });
    }

    function switchTab(tabName) {
        tabBtns.forEach(b => {
            if (b.dataset.tab === tabName) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        tabContents.forEach(c => {
            if (c.id === `${tabName}-tab`) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
        setStatus(`Switched to ${tabName} mode`);
    }

    // Event Listeners setup
    function setupEventListeners() {
        // Key Generation
        btnGenerateKeyPair.addEventListener('click', generateKeyPairHandler);
        
        btnUseGenPublicKey.addEventListener('click', () => {
            if (!currentGeneratedPublicPEM) return;
            encPublicKey.value = currentGeneratedPublicPEM;
            encKeySize.value = genKeySize.value;
            switchTab('encrypt');
            notify.success('Public key loaded into Encrypt tab');
        });

        btnUseGenPrivateKey.addEventListener('click', () => {
            if (!currentGeneratedPrivatePEM) return;
            decPrivateKey.value = currentGeneratedPrivatePEM;
            decKeySize.value = genKeySize.value;
            switchTab('decrypt');
            notify.success('Private key loaded into Decrypt tab');
        });

        btnCopyGenPublic.addEventListener('click', () => copyToClipboard(genPublicKey.value, 'Public key copied'));
        btnCopyGenPrivate.addEventListener('click', () => copyToClipboard(genPrivateKey.value, 'Private key copied'));
        
        btnDownloadGenPublic.addEventListener('click', () => {
            downloadFile(genPublicKey.value, 'rsa_public_key.pem', 'text/plain');
            notify.success('Downloaded rsa_public_key.pem');
        });
        btnDownloadGenPrivate.addEventListener('click', () => {
            downloadFile(genPrivateKey.value, 'rsa_private_key.pem', 'text/plain');
            notify.success('Downloaded rsa_private_key.pem');
        });

        // Encrypt Actions
        btnEncrypt.addEventListener('click', encryptHandler);
        btnClearEncrypt.addEventListener('click', clearEncryptHandler);
        btnCopyCiphertext.addEventListener('click', () => copyToClipboard(encCiphertext.value, 'Ciphertext copied'));
        encPlaintext.addEventListener('input', updateCharCounter);
        encKeySize.addEventListener('change', updateCharCounter);

        // Decrypt Actions
        btnDecrypt.addEventListener('click', decryptHandler);
        btnClearDecrypt.addEventListener('click', clearDecryptHandler);
        btnCopyPlaintext.addEventListener('click', () => copyToClipboard(decPlaintext.value, 'Plaintext copied'));
    }

    // Encoding Conversion Helpers
    function bytesToBase64(bytes) {
        const binString = Array.from(bytes, b => String.fromCharCode(b)).join('');
        return btoa(binString);
    }

    function base64ToBytes(base64) {
        const cleanBase64 = base64.trim().replace(/\s/g, '');
        const binString = atob(cleanBase64);
        return Uint8Array.from(binString, m => m.charCodeAt(0));
    }

    // PEM Formatting Helpers
    function formatPem(base64String, label) {
        let result = `-----BEGIN ${label}-----\n`;
        for (let i = 0; i < base64String.length; i += 64) {
            result += base64String.substring(i, i + 64) + '\n';
        }
        result += `-----END ${label}-----`;
        return result;
    }

    function cleanPem(pem, label) {
        const header = `-----BEGIN ${label}-----`;
        const footer = `-----END ${label}-----`;
        
        let cleaned = pem.trim();
        if (!cleaned.includes(header) || !cleaned.includes(footer)) {
            throw new Error(`Missing mandatory PEM boundaries: ${header} and ${footer}`);
        }
        
        cleaned = cleaned.replace(header, '').replace(footer, '').replace(/\s/g, '');
        return cleaned;
    }

    // Max Plaintext limit for RSA-OAEP with SHA-256
    function getMaxPlaintextSize(keySize) {
        // Overhead for RSA-OAEP is 2 * HashLength + 2.
        // For SHA-256, HashLength is 32. 
        // Overhead = 2 * 32 + 2 = 66 bytes.
        const keySizeBytes = keySize / 8;
        return keySizeBytes - 66;
    }

    // Update real-time counter & warnings
    function updateCharCounter() {
        const keySize = parseInt(encKeySize.value, 10);
        const limit = getMaxPlaintextSize(keySize);
        const text = encPlaintext.value;
        const byteLen = new TextEncoder().encode(text).length;

        encCharCounter.textContent = `${byteLen} / ${limit} bytes`;

        if (byteLen > limit) {
            encCharCounter.classList.add('limit-exceeded');
        } else {
            encCharCounter.classList.remove('limit-exceeded');
        }
    }

    // Download dynamic files
    function downloadFile(content, fileName, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Copy to clipboard
    function copyToClipboard(text, successMsg) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            notify.success(successMsg);
        }).catch(() => {
            // Fallback copy logic
            const area = document.createElement('textarea');
            area.value = text;
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            document.body.removeChild(area);
            notify.success(successMsg);
        });
    }

    // Key Pair Generation Handlers
    async function generateKeyPairHandler() {
        const size = parseInt(genKeySize.value, 10);
        setStatus(`Generating secure ${size}-bit RSA key pair...`);
        btnGenerateKeyPair.disabled = true;

        try {
            // Web Crypto RSA-OAEP generation
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: size,
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
                    hash: 'SHA-256'
                },
                true,
                ['encrypt', 'decrypt']
            );

            // Export public key (spki format)
            const exportedPub = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
            currentGeneratedPublicPEM = formatPem(bytesToBase64(new Uint8Array(exportedPub)), 'PUBLIC KEY');
            genPublicKey.value = currentGeneratedPublicPEM;

            // Export private key (pkcs8 format)
            const exportedPriv = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
            currentGeneratedPrivatePEM = formatPem(bytesToBase64(new Uint8Array(exportedPriv)), 'PRIVATE KEY');
            genPrivateKey.value = currentGeneratedPrivatePEM;

            // Enable action buttons
            btnUseGenPublicKey.disabled = false;
            btnUseGenPrivateKey.disabled = false;
            btnCopyGenPublic.disabled = false;
            btnDownloadGenPublic.disabled = false;
            btnCopyGenPrivate.disabled = false;
            btnDownloadGenPrivate.disabled = false;

            setStatus('Key pair generated successfully');
            notify.success(`Generated ${size}-bit RSA key pair`);
        } catch (err) {
            setStatus('Key generation failed: ' + err.message, true);
            notify.error('Key generation failed: ' + err.message);
        } finally {
            btnGenerateKeyPair.disabled = false;
        }
    }

    // Import Key functions
    async function importPublicKey(pem, keySize) {
        const base64 = cleanPem(pem, 'PUBLIC KEY');
        const der = base64ToBytes(base64);

        const key = await window.crypto.subtle.importKey(
            'spki',
            der,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            true,
            ['encrypt']
        );

        if (key.algorithm.modulusLength !== keySize) {
            throw new Error(`Modulus size mismatch. Expected ${keySize}-bit key, but imported key is ${key.algorithm.modulusLength}-bit.`);
        }

        return key;
    }

    async function importPrivateKey(pem, keySize) {
        const base64 = cleanPem(pem, 'PRIVATE KEY');
        const der = base64ToBytes(base64);

        const key = await window.crypto.subtle.importKey(
            'pkcs8',
            der,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            true,
            ['decrypt']
        );

        if (key.algorithm.modulusLength !== keySize) {
            throw new Error(`Modulus size mismatch. Expected ${keySize}-bit key, but imported key is ${key.algorithm.modulusLength}-bit.`);
        }

        return key;
    }

    // Encrypt Handler
    async function encryptHandler() {
        const keySize = parseInt(encKeySize.value, 10);
        const pem = encPublicKey.value.trim();
        const plaintext = encPlaintext.value;

        encCiphertext.value = '';
        encResultActions.style.display = 'none';

        if (!pem) {
            notify.error('Please enter the Public Key.');
            setStatus('Error: Public Key is empty', true);
            return;
        }

        if (!plaintext) {
            notify.error('Please enter the plaintext message.');
            setStatus('Error: Plaintext is empty', true);
            return;
        }

        const limit = getMaxPlaintextSize(keySize);
        const plaintextBytes = new TextEncoder().encode(plaintext);

        if (plaintextBytes.length > limit) {
            notify.error(`Plaintext is too long. Limit is ${limit} bytes.`);
            setStatus(`Error: Plaintext size (${plaintextBytes.length} bytes) exceeds key size limit (${limit} bytes)`, true);
            return;
        }

        setStatus('Encrypting...');

        try {
            const pubKey = await importPublicKey(pem, keySize);
            const cipherBuffer = await window.crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                pubKey,
                plaintextBytes
            );

            const base64Cipher = bytesToBase64(new Uint8Array(cipherBuffer));
            encCiphertext.value = base64Cipher;
            encResultActions.style.display = 'flex';
            setStatus('Encryption complete');
            notify.success('Plaintext encrypted successfully');
        } catch (err) {
            setStatus('Encryption failed: ' + err.message, true);
            notify.error('Encryption failed. Verify key format and configuration.');
        }
    }

    // Decrypt Handler
    async function decryptHandler() {
        const keySize = parseInt(decKeySize.value, 10);
        const pem = decPrivateKey.value.trim();
        const ciphertext = decCiphertext.value.trim();

        decPlaintext.value = '';
        decResultActions.style.display = 'none';

        if (!pem) {
            notify.error('Please enter the Private Key.');
            setStatus('Error: Private Key is empty', true);
            return;
        }

        if (!ciphertext) {
            notify.error('Please enter the ciphertext to decrypt.');
            setStatus('Error: Ciphertext is empty', true);
            return;
        }

        setStatus('Decrypting...');

        try {
            const privKey = await importPrivateKey(pem, keySize);
            
            let cipherBytes;
            try {
                cipherBytes = base64ToBytes(ciphertext);
            } catch (err) {
                throw new Error('Invalid Base64 format in ciphertext');
            }

            const plainBuffer = await window.crypto.subtle.decrypt(
                { name: 'RSA-OAEP' },
                privKey,
                cipherBytes
            );

            const decryptedText = new TextDecoder().decode(plainBuffer);
            decPlaintext.value = decryptedText;
            decResultActions.style.display = 'flex';
            setStatus('Decryption complete');
            notify.success('Ciphertext decrypted successfully');
        } catch (err) {
            setStatus('Decryption failed: ' + err.message, true);
            notify.error('Decryption failed. Ensure you are using the correct matching Private Key and valid ciphertext.');
        }
    }

    // Form Clearing Handlers
    function clearEncryptHandler() {
        encPublicKey.value = '';
        encPlaintext.value = '';
        encCiphertext.value = '';
        encResultActions.style.display = 'none';
        updateCharCounter();
        setStatus('Encrypt form cleared');
        notify.info('Encrypt form cleared');
    }

    function clearDecryptHandler() {
        decPrivateKey.value = '';
        decCiphertext.value = '';
        decPlaintext.value = '';
        decResultActions.style.display = 'none';
        setStatus('Decrypt form cleared');
        notify.info('Decrypt form cleared');
    }

    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
