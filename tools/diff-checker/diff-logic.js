const originalInput = document.getElementById('original');
const modifiedInput = document.getElementById('modified');
const outputDiv = document.getElementById('output');

function compareText() {
    const text1 = originalInput.value;
    const text2 = modifiedInput.value;

    if (!text1 && !text2) {
        outputDiv.innerHTML = '<div style="padding: 20px; color: #666; text-align: center;">Please enter text to compare.</div>';
        return;
    }

    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');

    // Calculate Diff using LCS (Longest Common Subsequence)
    const matrix = lcsMatrix(lines1, lines2);
    const diffData = backtrackDiff(matrix, lines1, lines2);

    renderDiff(diffData);
}

// 1. Compute LCS Matrix (Dynamic Programming)
function lcsMatrix(arr1, arr2) {
    const n = arr1.length;
    const m = arr2.length;
    // Create (n+1) x (m+1) matrix initialized to 0
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (arr1[i - 1] === arr2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp;
}

// 2. Backtrack to generate Diff operations
function backtrackDiff(dp, arr1, arr2) {
    let i = arr1.length;
    let j = arr2.length;
    const diffs = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && arr1[i - 1] === arr2[j - 1]) {
            // No Change
            diffs.unshift({ type: 'same', content: arr1[i - 1], lineOld: i, lineNew: j });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            // Addition (in arr2 but not arr1)
            diffs.unshift({ type: 'add', content: arr2[j - 1], lineOld: null, lineNew: j });
            j--;
        } else {
            // Deletion (in arr1 but not arr2)
            diffs.unshift({ type: 'remove', content: arr1[i - 1], lineOld: i, lineNew: null });
            i--;
        }
    }
    return diffs;
}

// 3. Render HTML
function renderDiff(diffs) {
    let html = '';
    
    diffs.forEach(part => {
        let cls = '';
        let prefix = '  ';
        let oldNum = part.lineOld || '';
        let newNum = part.lineNew || '';

        if (part.type === 'add') {
            cls = 'diff-added';
            prefix = '+ ';
        } else if (part.type === 'remove') {
            cls = 'diff-removed';
            prefix = '- ';
        }

        // Escape HTML to prevent XSS and render code correctly
        const contentSafe = escapeHtml(part.content);

        html += `
        <div class="diff-line ${cls}">
            <div class="line-num">${oldNum}</div>
            <div class="line-num">${newNum}</div>
            <div class="line-content">${prefix}${contentSafe}</div>
        </div>`;
    });

    outputDiv.innerHTML = html;
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

function clearAll() {
    originalInput.value = '';
    modifiedInput.value = '';
    outputDiv.innerHTML = '<div style="padding: 20px; color: #666; text-align: center;">Result will appear here...</div>';
}