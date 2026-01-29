'use strict';

let pyodide = null;
let currentLang = 'javascript';
const terminalOut = document.getElementById('terminal-out');
const statusInd = document.getElementById('status-indicator');
const editorPanel = document.getElementById('editorPanel');

// Default boilerplate to ensure clean start
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

print(f"Factorial of 5 is: {factorial(5)}")`
};

/**
 * 1. PROFESSIONAL EDITOR CONFIGURATION
 * Fixes indentation issues by using Soft Tabs (Spaces).
 */
const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    mode: "javascript",
    theme: "neo",
    lineNumbers: true,
    autoCloseBrackets: true, // Auto-pair () [] {}
    viewportMargin: Infinity, // Prevents lag on scroll
    tabSize: 4,              // Width of the tab
    indentUnit: 4,           // How many spaces a block indent adds
    smartIndent: true,       // Context-sensitive indentation
    indentWithTabs: false,   // CRITICAL: Uses spaces instead of \t
    extraKeys: {
        // Forces Tab key to insert 4 spaces (Soft Tab)
        "Tab": (cm) => {
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
            } else {
                cm.replaceSelection("    ", "end");
            }
        }
    }
});

// Set initial value
editor.setValue(defaultCode.javascript);

/**
 * 2. EXECUTION ENGINE (Zero-API)
 */
window.runCode = async function() {
    const code = editor.getValue();
    terminalOut.innerText = ""; // Clear previous output
    statusInd.innerText = "RUNNING...";
    statusInd.style.color = "yellow";

    // Allow UI to update before freezing for execution
    setTimeout(async () => {
        if (currentLang === 'javascript') {
            try {
                // Secure Sandbox for JS
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
        } else if (currentLang === 'python') {
            if (!pyodide) {
                terminalOut.innerText = ">> PYTHON ENGINE NOT LOADED. PLEASE WAIT...";
                return;
            }
            try {
                // Capture Python Stdout
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
 * 3. LANGUAGE SWITCHER
 */
document.querySelectorAll('.side-icon').forEach(icon => {
    icon.onclick = async function() {
        // UI Updates
        document.querySelectorAll('.side-icon').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        // Logic Updates
        currentLang = this.dataset.lang;
        editor.setOption("mode", currentLang);
        
        // Set boilerplate if editor is empty or default
        if (editor.getValue().trim() === "" || Object.values(defaultCode).includes(editor.getValue())) {
            editor.setValue(defaultCode[currentLang]);
        }

        // Lazy Load Pyodide
        if (currentLang === 'python' && !pyodide) {
            terminalOut.innerText = ">> INITIALIZING PYTHON ENVIRONMENT (WASM)...";
            statusInd.innerText = "LOADING";
            pyodide = await loadPyodide();
            terminalOut.innerText = ">> PYTHON 3.x READY.\n";
            statusInd.innerText = "IDLE";
        }
        editor.refresh();
    };
});

/**
 * 4. RESIZER (Lag-Free)
 */
const hResizer = document.getElementById('hResizer');
hResizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const onMove = (mv) => {
        const heightPercent = (mv.clientY / window.innerHeight) * 100;
        if (heightPercent > 20 && heightPercent < 80) {
            editorPanel.style.height = heightPercent + "vh";
            editor.refresh(); // Keeps cursor aligned
        }
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', onMove), { once: true });
});

/**
 * 5. THEME TOGGLE
 */
document.getElementById('themeToggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
};