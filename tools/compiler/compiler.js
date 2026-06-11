'use strict';

let pyodide = null;
let currentLang = 'javascript';
const terminalOut = document.getElementById('terminal-out');
const statusInd = document.getElementById('status-indicator');
const editorPanel = document.getElementById('editorPanel');

// Default boilerplate
const defaultCode = {
    javascript: `// JavaScript Playground
function greet(name) {
    if (!name) {
        return "Hello, Stranger!";
    }
    return "Hello, " + name + "!";
}

console.log(greet("Developer"));
console.log("System Ready.");`,

    python: `# Python 3.x Playground
def factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n - 1)

print(f"Factorial of 5 is: {factorial(5)}")`,

    web: `<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>Edit this code and click Execute.</p>
</body>
</html>`
};

/**
 * PRIORITY 1: Per-language code persistence
 */
const savedCode = {
    javascript: defaultCode.javascript,
    python: defaultCode.python,
    web: defaultCode.web
};

/**
 * 1. EDITOR CONFIGURATION
 */
const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    mode: "javascript",
    theme: "neo",
    lineNumbers: true,
    autoCloseBrackets: true,
    viewportMargin: Infinity,
    tabSize: 4,
    indentUnit: 4,
    smartIndent: true,
    indentWithTabs: false,
    extraKeys: {
        "Tab": (cm) => {
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
            } else {
                cm.replaceSelection("    ", "end");
            }
        }
    }
});

editor.setValue(savedCode.javascript);

/**
 * Helper: swap terminal / preview panels
 */
function showTerminal() {
    document.getElementById('terminalPanel').style.display = 'block';
    document.getElementById('previewContainer').style.display = 'none';
}

function showPreview() {
    document.getElementById('terminalPanel').style.display = 'none';
    document.getElementById('previewContainer').style.display = 'flex';
}

/**
 * 2. EXECUTION ENGINE
 */
window.runCode = async function() {
    const code = editor.getValue();
    statusInd.innerText = "RUNNING...";
    statusInd.style.color = "yellow";

    setTimeout(async () => {

        // WEB MODE
        if (currentLang === 'web') {
            showPreview();
            document.getElementById('previewFrame').srcdoc = code;
            terminalOut.innerText = "HTML/CSS/JS Preview Updated";
            finishExec();
            return;
        }

        // Ensure terminal is visible for JS/Python
        showTerminal();
        terminalOut.innerText = "";

        // JAVASCRIPT MODE
        if (currentLang === 'javascript') {
            try {
                const sandbox = new Function('console', code);
                const customConsole = {
                    log: (...args) => {
                        terminalOut.innerText += args.map(a =>
                            typeof a === 'object' ? JSON.stringify(a) : a
                        ).join(' ') + '\n';
                    },
                    error: (msg) => {
                        terminalOut.innerText += '[ERROR]: ' + msg + '\n';
                    },
                    warn: (msg) => {
                        terminalOut.innerText += '[WARN]: ' + msg + '\n';
                    }
                };
                sandbox(customConsole);
                finishExec();
            } catch (err) {
                terminalOut.innerText += "RUNTIME ERROR:\n" + err.toString();
                finishExec(true);
            }
        }

        // PYTHON MODE
        else if (currentLang === 'python') {
            if (!pyodide) {
                terminalOut.innerText = ">> PYTHON ENGINE NOT LOADED. PLEASE WAIT...";
                finishExec(true);
                return;
            }
            try {
                await pyodide.runPythonAsync(`import sys, io\nsys.stdout = io.StringIO()`);
                await pyodide.runPythonAsync(code);
                const output = pyodide.runPython("sys.stdout.getvalue()");
                terminalOut.innerText = output || ">> Process finished with exit code 0";
                finishExec();
            } catch (err) {
                terminalOut.innerText += "PYTHON ERROR:\n" + err;
                finishExec(true);
            }
        }

    }, 50);
};

function finishExec(isError = false) {
    statusInd.innerText = isError ? "FAILED" : "IDLE";
    statusInd.style.color = isError ? "red" : "#00ff00";
}

/**
 * PRIORITY 2: Clear Console
 */
window.clearConsole = function() {
    terminalOut.innerText = "";
};

/**
 * PRIORITY 3: Copy Code
 */
window.copyCode = function() {
    navigator.clipboard.writeText(editor.getValue()).then(() => {
        terminalOut.innerText = "Code copied to clipboard.";
    }).catch(() => {
        terminalOut.innerText = "[ERROR]: Clipboard access denied.";
    });
};

/**
 * PRIORITY 4: Download Code
 */
window.downloadCode = function() {
    let ext = "txt";
    if (currentLang === "javascript") ext = "js";
    if (currentLang === "python")     ext = "py";
    if (currentLang === "web")        ext = "html";

    const blob = new Blob([editor.getValue()], { type: "text/plain" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = "code." + ext;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * 3. LANGUAGE SWITCHER
 */
document.querySelectorAll('.side-icon').forEach(icon => {
    icon.onclick = async function() {
        document.querySelectorAll('.side-icon').forEach(i => i.classList.remove('active'));
        this.classList.add('active');

        // Save current content before switching
        savedCode[currentLang] = editor.getValue();

        currentLang = this.dataset.lang;

        // Set correct syntax mode
        if (currentLang === 'web') {
            editor.setOption("mode", "htmlmixed");
            // Keep terminal hidden until Execute is pressed in WEB mode
            showPreview();
            document.getElementById('previewFrame').srcdoc = "";
        } else {
            editor.setOption("mode", currentLang);
            showTerminal();
        }

        // Restore saved content for the new language
        editor.setValue(savedCode[currentLang]);

        // Lazy-load Pyodide on first switch to Python
        if (currentLang === 'python' && !pyodide) {
            terminalOut.innerText = ">> INITIALIZING PYTHON ENVIRONMENT (WASM)...";
            statusInd.innerText = "LOADING";
            statusInd.style.color = "yellow";
            pyodide = await loadPyodide();
            terminalOut.innerText = ">> PYTHON 3.x READY.\n";
            statusInd.innerText = "IDLE";
            statusInd.style.color = "#00ff00";
        }

        editor.refresh();
    };
});

/**
 * 4. RESIZER
 */
const hResizer = document.getElementById('hResizer');

hResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();

    const workspace = document.querySelector('.workspace');
    const workspaceRect = workspace.getBoundingClientRect();

    function onMouseMove(ev) {
        const newHeight = ev.clientY - workspaceRect.top;

        if (newHeight > 100 && newHeight < workspaceRect.height - 100) {
            editorPanel.style.height = `${newHeight}px`;
            editor.refresh();
        }
    }

    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

/**
 * PRIORITY 6: F5 Keyboard Shortcut
 */
document.addEventListener('keydown', e => {
    if (e.key === 'F5') {
        e.preventDefault();
        runCode();
    }
});
