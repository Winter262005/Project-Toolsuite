document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('jwt-input');
    const headerOut = document.getElementById('header-output');
    const payloadOut = document.getElementById('payload-output');
    const metaOut = document.getElementById('meta-output');

    inputField.addEventListener('input', (e) => {
        const token = e.target.value.trim();
        if (!token) {
            clearOutputs();
            return;
        }
        processToken(token);
    });

    function processToken(token) {
        try {
            const parts = token.split('.');
            
            if (parts.length !== 3) {
                throw new Error("Invalid JWT format (must have 3 parts)");
            }

            const header = decodeBase64URL(parts[0]);
            const payload = decodeBase64URL(parts[1]);

            // Render JSON with syntax highlighting
            headerOut.innerHTML = syntaxHighlight(header);
            payloadOut.innerHTML = syntaxHighlight(payload);

            // Extract and display dates
            renderMetaData(payload);

        } catch (err) {
            headerOut.innerHTML = `<span style="color:#f48771">Error: Invalid Token Format</span>`;
            payloadOut.innerHTML = `<span style="color:#f48771">Could not decode payload.</span>`;
            metaOut.style.display = 'none';
        }
    }

    function decodeBase64URL(str) {
        // Add padding if needed
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0: break;
            case 2: output += '=='; break;
            case 3: output += '='; break;
            default: throw 'Illegal base64url string!';
        }
        
        // Decode ensuring UTF-8 support (handling special chars correctly)
        return JSON.parse(decodeURIComponent(atob(output).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')));
    }

    function syntaxHighlight(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, undefined, 2);
        }
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    function renderMetaData(payload) {
        let html = '';
        
        // Check for Issued At (iat)
        if (payload.iat) {
            const date = new Date(payload.iat * 1000).toLocaleString();
            html += `<div><span class="meta-tag">Issued At (iat)</span> <span class="meta-value">${date}</span></div>`;
        }
        
        // Check for Expiration (exp)
        if (payload.exp) {
            const date = new Date(payload.exp * 1000).toLocaleString();
            
            // Calculate time remaining/expired
            const now = Date.now() / 1000;
            const diff = payload.exp - now;
            const status = diff > 0 ? `(Expires in ${Math.ceil(diff/60)} mins)` : `(Expired)`;
            const color = diff > 0 ? '#b5cea8' : '#f48771';

            html += `<div><span class="meta-tag">Expiration (exp)</span> <span class="meta-value" style="color:${color}">${date} ${status}</span></div>`;
        }

        if (html) {
            metaOut.innerHTML = html;
            metaOut.style.display = 'block';
        } else {
            metaOut.style.display = 'none';
        }
    }

    function clearOutputs() {
        headerOut.innerHTML = '<span style="color:#666">// Waiting for input...</span>';
        payloadOut.innerHTML = '<span style="color:#666">// Waiting for input...</span>';
        metaOut.style.display = 'none';
    }
});