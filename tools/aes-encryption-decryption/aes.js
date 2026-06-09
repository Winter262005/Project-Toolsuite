'use strict';

(function() {
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Encrypt Form Elements
    const encMode = document.getElementById('encMode');
    const encKeySize = document.getElementById('encKeySize');
    const encKeyType = document.getElementById('encKeyType');
    const encFormat = document.getElementById('encFormat');
    const encText = document.getElementById('encText');
    const encKey = document.getElementById('encKey');
    const btnGenEncKey = document.getElementById('btnGenEncKey');
    const btnEncrypt = document.getElementById('btnEncrypt');
    const btnClearEncrypt = document.getElementById('btnClearEncrypt');
    const encResult = document.getElementById('encResult');
    const encResultActions = document.getElementById('encResultActions');
    const btnCopyEncrypted = document.getElementById('btnCopyEncrypted');

    // Decrypt Form Elements
    const decMode = document.getElementById('decMode');
    const decKeySize = document.getElementById('decKeySize');
    const decKeyType = document.getElementById('decKeyType');
    const decFormat = document.getElementById('decFormat');
    const decText = document.getElementById('decText');
    const decKey = document.getElementById('decKey');
    const btnDecrypt = document.getElementById('btnDecrypt');
    const btnClearDecrypt = document.getElementById('btnClearDecrypt');
    const decResult = document.getElementById('decResult');
    const decResultActions = document.getElementById('decResultActions');
    const btnCopyDecrypted = document.getElementById('btnCopyDecrypted');

    // Status Area
    const statusEl = document.getElementById('status');

    // Fallback library state
    let aesJsLoaded = false;

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

    // Tabs switching
    function setupTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`${tabName}-tab`).classList.add('active');
                
                setStatus(`Switched to ${tabName} mode`);
            });
        });
    }

    // Event listeners
    function setupEventListeners() {
        btnGenEncKey.addEventListener('click', generateKeyHandler);
        btnEncrypt.addEventListener('click', encryptHandler);
        btnClearEncrypt.addEventListener('click', clearEncryptHandler);
        btnCopyEncrypted.addEventListener('click', () => copyToClipboard(encResult.value, 'Ciphertext copied to clipboard'));

        btnDecrypt.addEventListener('click', decryptHandler);
        btnClearDecrypt.addEventListener('click', clearDecryptHandler);
        btnCopyDecrypted.addEventListener('click', () => copyToClipboard(decResult.value, 'Plaintext copied to clipboard'));

        // Dynamic placeholder adjustment on Key Type change
        encKeyType.addEventListener('change', () => {
            adjustKeyPlaceholder(encKeyType.value, encKeySize.value, encKey);
        });
        encKeySize.addEventListener('change', () => {
            adjustKeyPlaceholder(encKeyType.value, encKeySize.value, encKey);
        });
        decKeyType.addEventListener('change', () => {
            adjustKeyPlaceholder(decKeyType.value, decKeySize.value, decKey);
        });
        decKeySize.addEventListener('change', () => {
            adjustKeyPlaceholder(decKeyType.value, decKeySize.value, decKey);
        });
    }

    function adjustKeyPlaceholder(keyType, keySizeBits, inputElement) {
        if (keyType === 'hex') {
            const hexLength = (keySizeBits / 8) * 2;
            inputElement.placeholder = `Enter a ${hexLength}-char Hex Key...`;
        } else {
            inputElement.placeholder = 'Enter your passphrase or password...';
        }
    }

    // Load Fallback library (aes-js) dynamically
    function loadFallbackLibrary() {
        return new Promise((resolve, reject) => {
            if (window.aesjs) {
                aesJsLoaded = true;
                resolve();
                return;
            }
            setStatus('Loading fallback library from CDN...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/aes-js/3.1.2/index.min.js';
            script.onload = () => {
                aesJsLoaded = true;
                setStatus('Fallback library loaded successfully');
                resolve();
            };
            script.onerror = () => {
                setStatus('Failed to load fallback library. Verify connection.', true);
                reject(new Error('Failed to load aes-js fallback library. Make sure you are online or your browser supports Web Crypto fully.'));
            };
            document.head.appendChild(script);
        });
    }

    // Helper: PKCS#7 Padding
    function padPkcs7(data) {
        const paddingLength = 16 - (data.length % 16);
        const padded = new Uint8Array(data.length + paddingLength);
        padded.set(data);
        padded.fill(paddingLength, data.length);
        return padded;
    }

    // Helper: PKCS#7 Unpadding
    function unpadPkcs7(data) {
        const paddingLength = data[data.length - 1];
        if (paddingLength < 1 || paddingLength > 16) {
            throw new Error('Invalid padding length');
        }
        for (let i = data.length - paddingLength; i < data.length; i++) {
            if (data[i] !== paddingLength) {
                throw new Error('Invalid padding bytes');
            }
        }
        return data.subarray(0, data.length - paddingLength);
    }

    // Encoding & Conversion Helpers
    function bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function hexToBytes(hex) {
        const cleanHex = hex.trim().replace(/\s/g, '');
        if (cleanHex.length % 2 !== 0) {
            throw new Error('Hex string must have an even length.');
        }
        const bytes = new Uint8Array(cleanHex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            const byteValue = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
            if (isNaN(byteValue)) {
                throw new Error('Hex string contains invalid characters.');
            }
            bytes[i] = byteValue;
        }
        return bytes;
    }

    function bytesToBase64(bytes) {
        const binString = Array.from(bytes, b => String.fromCharCode(b)).join('');
        return btoa(binString);
    }

    function base64ToBytes(base64) {
        const cleanBase64 = base64.trim().replace(/\s/g, '');
        const binString = atob(cleanBase64);
        return Uint8Array.from(binString, m => m.charCodeAt(0));
    }

    // Key generation handler
    function generateKeyHandler() {
        const size = parseInt(encKeySize.value, 10);
        const type = encKeyType.value;
        const bytesCount = size / 8;
        
        try {
            const bytes = new Uint8Array(bytesCount);
            window.crypto.getRandomValues(bytes);
            
            if (type === 'hex') {
                encKey.value = bytesToHex(bytes);
                notify.success(`Generated a secure ${size}-bit Hex key`);
            } else {
                // Generate secure random readable passphrase (mix of alphanumeric/symbols)
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
                let result = '';
                for (let i = 0; i < 20; i++) {
                    const randomIndex = bytes[i % bytes.length] % chars.length;
                    result += chars[randomIndex];
                }
                encKey.value = result;
                notify.success(`Generated a secure 20-char passphrase`);
            }
            setStatus('Generated secure random key');
        } catch (e) {
            notify.error('Key generation failed: ' + e.message);
            setStatus('Key generation failed', true);
        }
    }

    // Derives Key Bytes from Input
    async function deriveKeyBytes(keyInput, keyType, keySizeBits) {
        const cleanKey = keyInput.trim();
        const expectedBytes = keySizeBits / 8;

        if (!cleanKey) {
            throw new Error('Secret key/passphrase cannot be empty.');
        }

        if (keyType === 'hex') {
            const keyBytes = hexToBytes(cleanKey);
            if (keyBytes.length !== expectedBytes) {
                throw new Error(`Invalid Hex Key size. Expected ${expectedBytes} bytes (${expectedBytes * 2} hex chars). Got ${keyBytes.length} bytes.`);
            }
            return keyBytes;
        } else {
            // Passphrase path: derive key using SHA-256
            const encoder = new TextEncoder();
            const data = encoder.encode(cleanKey);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashBytes = new Uint8Array(hashBuffer);
            // Truncate or match key sizes
            return hashBytes.subarray(0, expectedBytes);
        }
    }

    // Native Web Crypto API execution
    async function encryptWebCrypto(plaintextBytes, keyBytes, mode, iv) {
        let algName = mode;
        let params;

        if (mode === 'AES-GCM') {
            params = { name: 'AES-GCM', iv: iv, tagLength: 128 };
        } else if (mode === 'AES-CBC') {
            params = { name: 'AES-CBC', iv: iv };
        } else if (mode === 'AES-CTR') {
            params = { name: 'AES-CTR', counter: iv, length: 64 };
        } else {
            throw new Error(`Unsupported mode: ${mode}`);
        }

        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: algName },
            false,
            ['encrypt']
        );

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            params,
            cryptoKey,
            plaintextBytes
        );

        return new Uint8Array(encryptedBuffer);
    }

    async function decryptWebCrypto(ciphertextBytes, keyBytes, mode, iv) {
        let algName = mode;
        let params;

        if (mode === 'AES-GCM') {
            params = { name: 'AES-GCM', iv: iv, tagLength: 128 };
        } else if (mode === 'AES-CBC') {
            params = { name: 'AES-CBC', iv: iv };
        } else if (mode === 'AES-CTR') {
            params = { name: 'AES-CTR', counter: iv, length: 64 };
        } else {
            throw new Error(`Unsupported mode: ${mode}`);
        }

        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: algName },
            false,
            ['decrypt']
        );

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            params,
            cryptoKey,
            ciphertextBytes
        );

        return new Uint8Array(decryptedBuffer);
    }

    // Fallback library execution (aes-js)
    async function encryptFallback(plaintextBytes, keyBytes, mode, iv) {
        if (mode === 'AES-GCM') {
            throw new Error('AES-GCM mode is not supported by the fallback library. Your browser must support native GCM.');
        }

        await loadFallbackLibrary();

        if (mode === 'AES-CBC') {
            const padded = padPkcs7(plaintextBytes);
            const aesCbc = new window.aesjs.ModeOfOperation.cbc(keyBytes, iv);
            return aesCbc.encrypt(padded);
        } else if (mode === 'AES-CTR') {
            const counter = new window.aesjs.Counter(iv);
            const aesCtr = new window.aesjs.ModeOfOperation.ctr(keyBytes, counter);
            return aesCtr.encrypt(plaintextBytes);
        }

        throw new Error(`Unsupported fallback mode: ${mode}`);
    }

    async function decryptFallback(ciphertextBytes, keyBytes, mode, iv) {
        if (mode === 'AES-GCM') {
            throw new Error('AES-GCM mode is not supported by the fallback library.');
        }

        await loadFallbackLibrary();

        if (mode === 'AES-CBC') {
            const aesCbc = new window.aesjs.ModeOfOperation.cbc(keyBytes, iv);
            const decrypted = aesCbc.decrypt(ciphertextBytes);
            return unpadPkcs7(decrypted);
        } else if (mode === 'AES-CTR') {
            const counter = new window.aesjs.Counter(iv);
            const aesCtr = new window.aesjs.ModeOfOperation.ctr(keyBytes, counter);
            return aesCtr.decrypt(ciphertextBytes);
        }

        throw new Error(`Unsupported fallback mode: ${mode}`);
    }

    // Main Encrypt Trigger
    async function encryptHandler() {
        const text = encText.value;
        const modeVal = encMode.value;
        const keySizeVal = parseInt(encKeySize.value, 10);
        const keyTypeVal = encKeyType.value;
        const keyInputVal = encKey.value;
        const formatVal = encFormat.value;

        // Reset output
        encResult.value = '';
        encResultActions.style.display = 'none';

        if (!text) {
            notify.error('Please enter the text to encrypt.');
            setStatus('Error: Plaintext is empty.', true);
            return;
        }

        if (!keyInputVal) {
            notify.error('Please enter a secret key or passphrase.');
            setStatus('Error: Key is empty.', true);
            return;
        }

        setStatus('Encrypting...');

        try {
            const keyBytes = await deriveKeyBytes(keyInputVal, keyTypeVal, keySizeVal);
            
            // Generate Random IV
            const ivLength = modeVal === 'AES-GCM' ? 12 : 16;
            const iv = new Uint8Array(ivLength);
            window.crypto.getRandomValues(iv);

            const encoder = new TextEncoder();
            const plaintextBytes = encoder.encode(text);
            
            let encryptedBytes;

            try {
                // Try Native
                encryptedBytes = await encryptWebCrypto(plaintextBytes, keyBytes, modeVal, iv);
            } catch (nativeErr) {
                console.warn('Native encryption failed, attempting fallback...', nativeErr);
                if (modeVal === 'AES-GCM') {
                    throw new Error(`Native GCM encryption failed. Details: ${nativeErr.message}`);
                }
                // Fallback
                encryptedBytes = await encryptFallback(plaintextBytes, keyBytes, modeVal, iv);
            }

            // Combine IV and Ciphertext: [iv] + [ciphertext]
            const combined = new Uint8Array(iv.length + encryptedBytes.length);
            combined.set(iv);
            combined.set(encryptedBytes, iv.length);

            // Encode Output
            let output;
            if (formatVal === 'hex') {
                output = bytesToHex(combined);
            } else {
                output = bytesToBase64(combined);
            }

            encResult.value = output;
            encResultActions.style.display = 'flex';
            notify.success('Text encrypted successfully');
            setStatus('Encryption complete');
        } catch (err) {
            notify.error('Encryption failed: ' + err.message);
            setStatus('Encryption failed: ' + err.message, true);
        }
    }

    // Main Decrypt Trigger
    async function decryptHandler() {
        const cipherTextVal = decText.value.trim();
        const modeVal = decMode.value;
        const keySizeVal = parseInt(decKeySize.value, 10);
        const keyTypeVal = decKeyType.value;
        const keyInputVal = decKey.value;
        const formatVal = decFormat.value;

        // Reset output
        decResult.value = '';
        decResultActions.style.display = 'none';

        if (!cipherTextVal) {
            notify.error('Please enter the ciphertext to decrypt.');
            setStatus('Error: Ciphertext is empty.', true);
            return;
        }

        if (!keyInputVal) {
            notify.error('Please enter the decryption key or passphrase.');
            setStatus('Error: Key is empty.', true);
            return;
        }

        setStatus('Decrypting...');

        try {
            const keyBytes = await deriveKeyBytes(keyInputVal, keyTypeVal, keySizeVal);

            // Parse Ciphertext from hex/base64
            let combinedBytes;
            let detectedFormat = formatVal;

            if (formatVal === 'auto') {
                // Detect: hex only contains 0-9, a-f, A-F and has even length
                const isHex = /^[0-9a-fA-F]+$/.test(cipherTextVal) && cipherTextVal.length % 2 === 0;
                detectedFormat = isHex ? 'hex' : 'base64';
            }

            try {
                if (detectedFormat === 'hex') {
                    combinedBytes = hexToBytes(cipherTextVal);
                } else {
                    combinedBytes = base64ToBytes(cipherTextVal);
                }
            } catch (parseErr) {
                throw new Error(`Failed to decode ciphertext. Verify format (${detectedFormat}).`);
            }

            // Split IV and Ciphertext
            const ivLength = modeVal === 'AES-GCM' ? 12 : 16;
            if (combinedBytes.length <= ivLength) {
                throw new Error('Ciphertext payload is too short or malformed.');
            }

            const iv = combinedBytes.subarray(0, ivLength);
            const ciphertextBytes = combinedBytes.subarray(ivLength);

            let decryptedBytes;

            try {
                // Try Native
                decryptedBytes = await decryptWebCrypto(ciphertextBytes, keyBytes, modeVal, iv);
            } catch (nativeErr) {
                console.warn('Native decryption failed, attempting fallback...', nativeErr);
                if (modeVal === 'AES-GCM') {
                    throw new Error('Decryption failed. Invalid key, corrupted ciphertext, or unsupported format.');
                }
                // Fallback
                try {
                    decryptedBytes = await decryptFallback(ciphertextBytes, keyBytes, modeVal, iv);
                } catch (fallbackErr) {
                    throw new Error('Decryption failed. Verify key, mode, and ciphertext integrity.');
                }
            }

            // Decode to string
            const decoder = new TextDecoder();
            const plaintext = decoder.decode(decryptedBytes);

            decResult.value = plaintext;
            decResultActions.style.display = 'flex';
            notify.success('Text decrypted successfully');
            setStatus('Decryption complete');
        } catch (err) {
            notify.error('Decryption failed: ' + err.message);
            setStatus('Decryption failed: ' + err.message, true);
        }
    }

    // Utility: Copy to Clipboard
    function copyToClipboard(text, successMsg) {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            notify.success(successMsg);
        }).catch(err => {
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

    // Form Clearing Handlers
    function clearEncryptHandler() {
        encText.value = '';
        encKey.value = '';
        encResult.value = '';
        encResultActions.style.display = 'none';
        setStatus('Encrypt form cleared');
        notify.info('Form cleared');
    }

    function clearDecryptHandler() {
        decText.value = '';
        decKey.value = '';
        decResult.value = '';
        decResultActions.style.display = 'none';
        setStatus('Decrypt form cleared');
        notify.info('Form cleared');
    }

    // Run Initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
