// Data dictionaries
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org',
    'yopmail.com', 'throwawaymail.com', 'getnada.com', 'tempmail.com', 'fakemail.net',
    'tempail.com', 'sharklasers.com', 'nada.ltd', 'moakt.com', 'dispostable.com',
    'maildrop.cc', 'trashmail.com', 'anonaddy.com', 'catchall.com', 'meltmail.com'
]);

const COMMON_DOMAINS = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
    'aol.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com',
    'me.com', 'msn.com', 'live.com', 'mac.com'
];

const ROLE_BASED_PREFIXES = new Set([
    'admin', 'support', 'info', 'sales', 'billing', 'contact', 'hello',
    'help', 'marketing', 'noreply', 'no-reply', 'postmaster', 'webmaster',
    'abuse', 'security', 'office', 'team', 'careers', 'jobs', 'press'
]);

// Utility: Levenshtein distance for typo detection
function getEditDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}


function toggleClearButton() {
    const input = document.getElementById('emailInput');
    const clearBtn = document.getElementById('clearBtn');

    clearBtn.style.display = input.value.length > 0 ? 'block' : 'none';
}

function clearEmail() {
    const input = document.getElementById('emailInput');
    const clearBtn = document.getElementById('clearBtn');
    const resultsCard = document.getElementById('resultsCard');

    input.value = '';
    clearBtn.style.display = 'none';

    // Hide previous validation results
    resultsCard.classList.remove('visible');

    // Return focus to the input field
    input.focus();
}
function checkTypo(domain) {
    if (COMMON_DOMAINS.includes(domain)) return null;
    
    let closestMatch = null;
    let minDistance = 3; // Max allowed distance for a typo suggestion

    for (const common of COMMON_DOMAINS) {
        const dist = getEditDistance(domain, common);
        if (dist < minDistance && dist > 0) {
            minDistance = dist;
            closestMatch = common;
        }
    }
    return closestMatch;
}

function updateUI(id, icon, msg, isError = false, isWarn = false) {
    document.getElementById(`${id}Icon`).textContent = icon;
    document.getElementById(`${id}Msg`).textContent = msg;
    
    const li = document.getElementById(`${id}Icon`).closest('.check-item');
    if (isError) {
        li.style.borderColor = 'var(--error)';
        li.style.color = 'var(--error)';
    } else if (isWarn) {
        li.style.borderColor = 'var(--warn)';
        li.style.color = 'var(--warn)';
    } else {
        li.style.borderColor = 'var(--border)';
        li.style.color = 'var(--text)';
    }
}

function applyTypo(correctedDomain) {
    const input = document.getElementById('emailInput');
    const localPart = input.value.split('@')[0];

    input.value = `${localPart}@${correctedDomain}`;

    toggleClearButton();
    validateEmail();
}

function copyAnalysisResult() {
    const email = document.getElementById('emailInput').value.trim();

    const overallStatus = document.getElementById('overallStatus').textContent;
    const syntaxResult = document.getElementById('syntaxMsg').textContent;
    const typoResult = document.getElementById('typoMsg').textContent;
    const disposableResult = document.getElementById('dispMsg').textContent;
    const roleResult = document.getElementById('roleMsg').textContent;

    const analysisText = `EMAIL VALIDATION RESULT
=======================

Input: ${email}
Overall Status: ${overallStatus}

Syntax & Format: ${syntaxResult}
Domain Typo: ${typoResult}
Disposable Domain: ${disposableResult}
Role-based Address: ${roleResult}`;

   navigator.clipboard.writeText(analysisText)
        .then(() => {
            alert('Analysis result copied to clipboard successfully.');
        })
        .catch(() => {
            alert('Unable to copy analysis result to clipboard.');
        });
}

function validateEmail() {
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const resultsCard = document.getElementById('resultsCard');
    const typoAction = document.getElementById('typoAction');
    
   if (!email) {
        alert('No text in the input field.');
    
    return;
}
    resultsCard.classList.add('visible');
    typoAction.style.display = 'none';
    typoAction.innerHTML = '';
    
    let isValid = true;
    let hasWarnings = false;

    // 1. Syntax & Format
    const syntaxRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const parts = email.split('@');
    
    if (!syntaxRegex.test(email) || parts.length !== 2) {
        updateUI('syntax', '❌', 'Invalid format. Ensure it contains "@" and a valid domain.', true);
        isValid = false;
    } else {
        const [local, domain] = parts;
        if (local.length > 64) {
            updateUI('syntax', '❌', 'Local part before "@" is too long (max 64 chars).', true);
            isValid = false;
        } else if (email.length > 254) {
            updateUI('syntax', '❌', 'Email address is too long (max 254 chars).', true);
            isValid = false;
        } else {
            updateUI('syntax', '✅', 'Valid format and length.');
        }
    }

    if (!isValid) {
        // Skip other checks if syntax is fundamentally broken
        updateUI('typo', '➖', 'Skipped due to syntax error.');
        updateUI('disp', '➖', 'Skipped due to syntax error.');
        updateUI('role', '➖', 'Skipped due to syntax error.');
        
        const statusBadge = document.getElementById('overallStatus');
        statusBadge.textContent = 'INVALID';
        statusBadge.className = 'status-badge status-invalid';
        return;
    }

    const [localPart, domainPart] = email.split('@');

    // 2. Typo Check
    const typo = checkTypo(domainPart);
    if (typo) {
        updateUI('typo', '⚠️', `Did you mean ${typo}?`, false, true);
        typoAction.style.display = 'block';
        typoAction.innerHTML = `<div class="typo-suggestion" onclick="applyTypo('${typo}')">Fix to @${typo}</div>`;
        hasWarnings = true;
    } else {
        updateUI('typo', '✅', 'No common typos detected.');
    }

    // 3. Disposable Domain
    if (DISPOSABLE_DOMAINS.has(domainPart)) {
        updateUI('disp', '❌', 'This is a known throwaway/temporary email domain.', true);
        isValid = false;
    } else {
        updateUI('disp', '✅', 'Domain appears to be permanent.');
    }

    // 4. Role-based
    if (ROLE_BASED_PREFIXES.has(localPart)) {
        updateUI('role', '⚠️', 'This is a role-based or generic inbox.', false, true);
        hasWarnings = true;
    } else {
        updateUI('role', '✅', 'Appears to be a personal address.');
    }

    // Overall Status
    const statusBadge = document.getElementById('overallStatus');
    if (!isValid) {
        statusBadge.textContent = 'INVALID';
        statusBadge.className = 'status-badge status-invalid';
    } else if (hasWarnings) {
        statusBadge.textContent = 'WARNING';
        statusBadge.className = 'status-badge status-warn';
    } else {
        statusBadge.textContent = 'VALID';
        statusBadge.className = 'status-badge status-valid';
    }
}
