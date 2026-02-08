/* StegoVault Core Engine 
  - LSB Encoding/Decoding
  - AES-256-GCM Encryption (Web Crypto API)
*/

const END_MARKER = "||END_STEGO||"; // Terminator string to mark end of data

// --- DOM ELEMENTS ---
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const statusDiv = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// --- MAIN EVENT LISTENERS ---

encodeBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('coverImage');
    const secretText = document.getElementById('secretText').value;
    const password = document.getElementById('encPassword').value;

    if (!fileInput.files[0] || !secretText) {
        notify.error("Please select an image and enter text.");
        return;
    }

    setStatus("Processing...", "blue");
    
    try {
        // 1. Prepare Data (Encrypt if password exists)
        let payload = secretText;
        if (password) {
            setStatus("Encrypting data...", "blue");
            payload = await encryptData(secretText, password);
            payload = "ENC:" + payload; // Prefix to identify encrypted data
        } else {
            payload = "TXT:" + payload;
        }

        // 2. Append Terminator
        payload += END_MARKER;

        // 3. Load Image
        const img = await loadImage(fileInput.files[0]);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 4. Encode into Pixels
        setStatus("Hiding data in pixels...", "blue");
        hideData(payload);

        // 5. Export
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const url = URL.createObjectURL(blob);
        
        const dlLink = document.getElementById('downloadLink');
        dlLink.href = url;
        dlLink.download = "secure_image.png";
        dlLink.innerText = "Download Secure Image";
        
        const preview = document.getElementById('preview');
        preview.src = url;
        preview.style.display = 'block';

        setStatus("Success! Data hidden securely.", "green");

    } catch (e) {
        console.error(e);
        setStatus("Error: " + e.message, "red");
    }
});

decodeBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('stegoImage');
    const password = document.getElementById('decPassword').value;

    if (!fileInput.files[0]) {
        notify.error("Please upload a secure image.");
        return;
    }

    setStatus("Scanning pixels...", "blue");

    try {
        // 1. Load Image
        const img = await loadImage(fileInput.files[0]);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // 2. Extract Data
        const rawData = revealData();
        if (!rawData) {
            throw new Error("No hidden data found or image corrupted.");
        }

        // 3. Parse & Decrypt
        let finalMessage = "";
        const resultArea = document.getElementById('resultArea');
        const output = document.getElementById('revealedText');

        if (rawData.startsWith("ENC:")) {
            if (!password) throw new Error("This data is encrypted. Please enter password.");
            const cipherString = rawData.substring(4); // Remove "ENC:"
            finalMessage = await decryptData(cipherString, password);
        } else if (rawData.startsWith("TXT:")) {
            finalMessage = rawData.substring(4);
        } else {
            // Legacy/Raw support
            finalMessage = rawData;
        }

        output.innerText = finalMessage;
        resultArea.style.display = 'block';
        setStatus("Data revealed successfully.", "green");

    } catch (e) {
        console.error(e);
        setStatus("Error: " + e.message, "red");
    }
});

// --- LSB ALGORITHMS ---

function hideData(text) {
    const binary = stringToBinary(text);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    if (binary.length > data.length / 4 * 3) {
        throw new Error("Text too long for this image size.");
    }

    let bitIndex = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (bitIndex >= binary.length) break;

        // Modify RGB channels (skip Alpha at i+3)
        for (let j = 0; j < 3; j++) {
            if (bitIndex < binary.length) {
                // Clear LSB ( & 254 ) then add new bit ( | bit )
                data[i + j] = (data[i + j] & 254) | parseInt(binary[bitIndex]);
                bitIndex++;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

function revealData() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let binary = "";
    
    // We scan until we hit the binary sequence for our END_MARKER
    // Optimization: Decode chunks to check for marker
    
    for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) { // RGB only
            binary += (data[i + j] & 1).toString();
        }
    }

    // Convert binary to string
    const fullText = binaryToString(binary);
    
    // Look for terminator
    const endIndex = fullText.indexOf(END_MARKER);
    if (endIndex !== -1) {
        return fullText.substring(0, endIndex);
    }
    return null;
}

// --- UTILS ---

function setStatus(msg, color) {
    const s = document.getElementById('status');
    s.innerText = msg;
    s.style.color = color === "red" ? "#ff4444" : (color === "green" ? "#00aa00" : "inherit");
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

function stringToBinary(str) {
    let output = "";
    for (let i = 0; i < str.length; i++) {
        const bin = str.charCodeAt(i).toString(2).padStart(8, "0");
        output += bin;
    }
    return output;
}

function binaryToString(bin) {
    // Note: This matches the padded 8-bit blocks
    let output = "";
    for (let i = 0; i < bin.length; i += 8) {
        const byte = bin.slice(i, i + 8);
        if (byte.length < 8) break;
        output += String.fromCharCode(parseInt(byte, 2));
        
        // Optimization: Check for marker every 100 chars to avoid hanging on massive images
        if (output.length % 100 === 0 && output.endsWith(END_MARKER)) {
             break;
        }
    }
    return output;
}

// --- CRYPTOGRAPHY (AES-GCM) ---

async function encryptData(plaintext, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKey(password, salt);
    
    const enc = new TextEncoder();
    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        enc.encode(plaintext)
    );

    // Pack as: SALT(hex):IV(hex):CIPHER(hex)
    return bufferToHex(salt) + ":" + bufferToHex(iv) + ":" + bufferToHex(encryptedContent);
}

async function decryptData(packed, password) {
    const parts = packed.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted format");

    const salt = hexToBuffer(parts[0]);
    const iv = hexToBuffer(parts[1]);
    const cipherText = hexToBuffer(parts[2]);

    const key = await deriveKey(password, salt);

    try {
        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            cipherText
        );
        return new TextDecoder().decode(decryptedContent);
    } catch (e) {
        throw new Error("Incorrect Password");
    }
}

async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}