const patternInput = document.getElementById('regexPattern');
const flagsInput = document.getElementById('regexFlags');
const testStringInput = document.getElementById('testString');
const outputDiv = document.getElementById('output');
const matchCountDiv = document.getElementById('matchCount');

// Add event listeners for real-time updates
patternInput.addEventListener('input', update);
flagsInput.addEventListener('input', update);
testStringInput.addEventListener('input', update);

// Initial run
update();

function update() {
    const pattern = patternInput.value;
    const flags = flagsInput.value;
    const text = testStringInput.value;

    if (!pattern) {
        renderPlain(text);
        matchCountDiv.textContent = "Matches: 0";
        return;
    }

    try {
        const regex = new RegExp(pattern, flags);
        
        // Safety Check: Avoid infinite loops with empty matches (e.g., /.*/g on empty string)
        // If the regex matches empty string globally, it can crash the browser.
        if (regex.test("") && flags.includes('g')) {
             // Basic protection: don't highlight if it matches everything instantly
        }

        let html = '';
        let lastIndex = 0;
        let match;
        let count = 0;

        // Reset lastIndex for global searches if manually looping (though replace is safer)
        // We will use a robust split/join approach or replacement callback to handle highlighting
        
        // Approach: Use string.replace with a callback to wrap matches
        // We need to be careful to escape HTML in the non-matched parts AND matched parts
        
        // 1. Escape the entire text first to prevent XSS? 
        // No, because we need to insert HTML tags. 
        // Better: iterate through matches.

        const matches = [];
        // We need to construct a new global regex to find all positions
        // If user didn't add 'g', we only highlight the first one.
        const safeFlags = flags.includes('g') ? flags : flags + 'g'; 
        const iterRegex = new RegExp(pattern, safeFlags);

        while ((match = iterRegex.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
            
            // Prevent infinite loop on zero-length matches (like /^/g)
            if (match.index === iterRegex.lastIndex) {
                iterRegex.lastIndex++;
            }
        }

        // Build HTML
        let currentIndex = 0;
        matches.forEach(m => {
            // Append text before match (Escaped)
            html += escapeHtml(text.substring(currentIndex, m.start));
            
            // Append Match (Wrapped)
            html += `<span class="match">${escapeHtml(m.text)}</span>`;
            
            currentIndex = m.end;
            count++;
            
            // If user didn't specify global flag, stop after first match
            if (!flags.includes('g')) return;
        });

        // Append remaining text
        html += escapeHtml(text.substring(currentIndex));

        outputDiv.innerHTML = html;
        matchCountDiv.textContent = `Matches: ${count}`;
        
        // Valid Regex Style
        patternInput.style.borderColor = "#000";

    } catch (e) {
        // Invalid Regex
        renderPlain(text);
        patternInput.style.borderColor = "red";
        matchCountDiv.textContent = "Invalid Regex";
    }
}

function renderPlain(text) {
    outputDiv.innerHTML = escapeHtml(text);
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function insertToken(token) {
    const input = patternInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + token + text.substring(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + token.length;
    update();
}