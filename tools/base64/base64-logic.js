'use strict';

const input = document.getElementById('input');
const output = document.getElementById('output');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');


function encodeBase64(str) {
    return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
        )
    );
}

function decodeBase64(str) {
    return decodeURIComponent(
        atob(str)
            .split('')
            .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('')
    );
}

function updateButtonState() {
    const hasInput = input.value.trim().length > 0;
    encodeBtn.disabled = !hasInput;
    decodeBtn.disabled = !hasInput;
}

encodeBtn.onclick = () => {
    try {
        output.value = encodeBase64(input.value);
    } catch {
        notify.error('Unable to encode this text.');
    }
};

decodeBtn.onclick = () => {
    try {
        output.value = decodeBase64(input.value.trim());
    } catch {
        notify.error('Invalid Base64 string.');
    }
};

input.addEventListener('input', updateButtonState);

updateButtonState();
