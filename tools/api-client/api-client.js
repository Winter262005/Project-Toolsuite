// API Request Builder (Postman Lite) Logic Engine

document.addEventListener("DOMContentLoaded", () => {
    const methodSelect = document.getElementById("methodSelect");
    const sendBtn = document.getElementById("sendBtn");

    // Tab bindings
    setupTabs("reqTabGroup", "reqTabContent");
    setupTabs("resTabGroup", "resTabContent");

    // Dynamic headers logic
    const addHeaderBtn = document.getElementById("addHeaderBtn");
    const headersContainer = document.getElementById("headersContainer");

    addHeaderBtn.addEventListener("click", () => addHeaderRow());

    // Auto-populate Content-Type header on start
    addHeaderRow("Content-Type", "application/json");

    // Listen for method changes to show/hide request body tab
    methodSelect.addEventListener("change", handleMethodChange);
    handleMethodChange(); // run initial check

    // Listen for request click
    sendBtn.addEventListener("click", sendRequest);
});

// Setup dynamic headers manager
function addHeaderRow(name = "", value = "") {
    const container = document.getElementById("headersContainer");

    const row = document.createElement("div");
    row.className = "header-row";

    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.placeholder = "Header-Name";
    keyInput.value = name;
    keyInput.className = "header-key";

    const valInput = document.createElement("input");
    valInput.type = "text";
    valInput.placeholder = "Value";
    valInput.value = value;
    valInput.className = "header-val";

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.type = "button";
    delBtn.textContent = "-";
    delBtn.title = "Remove Header";
    delBtn.onclick = () => row.remove();

    row.appendChild(keyInput);
    row.appendChild(valInput);
    row.appendChild(delBtn);

    container.appendChild(row);
}

// Toggle request tabs based on HTTP method
function handleMethodChange() {
    const method = document.getElementById("methodSelect").value;
    const bodyTab = document.getElementById("bodyTabHeader");

    if (method === "GET" || method === "DELETE") {
        bodyTab.style.display = "none";
        // Ensure headers tab is active if body tab was active
        if (bodyTab.classList.contains("active")) {
            switchTab("reqTabGroup", "reqTabContent", "tab-headers");
        }
    } else {
        bodyTab.style.display = "block";
    }
}

// Tabs setup helper
function setupTabs(groupName, contentClassName) {
    const tabLinks = document.querySelectorAll(`[data-group="${groupName}"]`);
    tabLinks.forEach(link => {
        link.addEventListener("click", () => {
            const targetId = link.dataset.tab;
            switchTab(groupName, contentClassName, targetId);
        });
    });
}

function switchTab(groupName, contentClassName, targetId) {
    const tabLinks = document.querySelectorAll(`[data-group="${groupName}"]`);
    const contents = document.querySelectorAll(`.${contentClassName}`);

    tabLinks.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    const activeLink = Array.from(tabLinks).find(link => link.dataset.tab === targetId);
    if (activeLink) activeLink.classList.add("active");

    const activeContent = document.getElementById(targetId);
    if (activeContent) activeContent.classList.add("active");
}

// Execute request using Fetch API
async function sendRequest() {
    const urlInput = document.getElementById("urlInput").value.trim();
    const method = document.getElementById("methodSelect").value;
    const sendBtn = document.getElementById("sendBtn");

    // Clear outputs
    resetResponseConsole();

    if (!urlInput) {
        if (typeof notify !== 'undefined') notify.error("Please enter a target request URL");
        return;
    }

    // Basic URL validation
    let targetUrl = urlInput;
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "http://" + targetUrl;
    }

    // Compile custom headers
    const headers = new Headers();
    const rows = document.querySelectorAll(".header-row");
    rows.forEach(row => {
        const key = row.querySelector(".header-key").value.trim();
        const val = row.querySelector(".header-val").value.trim();
        if (key) {
            headers.append(key, val);
        }
    });

    // Compile body
    let bodyData = null;
    if (method !== "GET" && method !== "DELETE") {
        const rawBody = document.getElementById("reqBody").value.trim();
        if (rawBody) {
            // Verify JSON format correctness
            try {
                JSON.parse(rawBody);
                bodyData = rawBody;
            } catch (err) {
                if (typeof notify !== 'undefined') notify.error("Invalid JSON body payload syntax");
                return;
            }
        }
    }

    // Disable Send Button to prevent double-clicks
    sendBtn.disabled = true;
    sendBtn.textContent = "[ SENDING... ]";

    const startTime = performance.now();

    const controller = new AbortController();

    const timeoutDuration = 15000; // 15 seconds timeout

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutDuration);

    try {
        const options = {
            method: method,
            headers: headers,
            signal: controller.signal
        };
        if (bodyData) {
            options.body = bodyData;
        }

        const response = await fetch(targetUrl, options);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Parse Response Status
        displayResponseStatus(response.status, response.statusText);
        displayResponseTime(duration);

        // Parse Response Headers
        displayResponseHeaders(response.headers);

        // Parse Response Body
        const contentType = response.headers.get("content-type") || "";
        let bodyText = "";
        let sizeInBytes = 0;

        if (contentType.toLowerCase().includes("json")) {
            const data = await response.json();
            bodyText = JSON.stringify(data, null, 2);
            sizeInBytes = new Blob([bodyText]).size;
        } else {
            bodyText = await response.text();
            sizeInBytes = new Blob([bodyText]).size;
        }

        displayResponseBody(bodyText);
        displayResponseSize(sizeInBytes);

        // Auto-switch response tab to body view on success
        switchTab("resTabGroup", "resTabContent", "tab-res-body");

    } catch (err) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        displayResponseTime(duration);

        if (err.name === "AbortError") {

            displayResponseStatus(408, "Request Timeout");

            displayResponseBody(
            `Request timed out after ${timeoutDuration / 1000} seconds.
            
             The server did not respond within the allowed time.

             Possible causes:
             1. Endpoint is taking too long to respond.
             2. Server may be unavailable.
             3. Network connection issue.`
            );

            if (typeof notify !== 'undefined') {
                notify.error(
                    `Request timed out after ${timeoutDuration / 1000} seconds`
                );
            }

        } else {

            displayResponseStatus(0, "Network Error / CORS Blocked");

            displayResponseBody(
            `Request Failed!
             Error message: ${err.message}
             Common Causes:
             1. CORS policy blocked this request. Ensure the API server allows your browser origin using proper Access-Control-Allow-Origin headers.
             2. Mixed Content restriction. Browsers block HTTP requests from HTTPS pages. Make sure both frontend and API use compatible protocols.
             3. Network connection issue. Check your internet connection or verify that the target server is reachable.
             4. Invalid endpoint URL. Confirm the URL path, protocol, and API route are correct.
             5. DNS lookup failure. The domain name may not resolve or the server may be unavailable.`
            );
        }

        switchTab("resTabGroup", "resTabContent", "tab-res-body");

    } finally {

        clearTimeout(timeoutId);

        sendBtn.disabled = false;
        sendBtn.textContent = "[ SEND REQUEST ]";
    }
}

// Reset Console display inputs
function resetResponseConsole() {
    document.getElementById("resStatus").className = "status-indicator";
    document.getElementById("resStatus").textContent = "-";
    document.getElementById("resTime").textContent = "0 ms";
    document.getElementById("resSize").textContent = "0 B";
    document.getElementById("resHeadersList").innerHTML = '<li>No headers returned</li>';
    document.getElementById("resBody").value = "Response content will appear here...";
}

// Render execution stats
function displayResponseStatus(code, text) {
    const badge = document.getElementById("resStatus");
    badge.textContent = `${code} ${text}`;

    badge.className = "status-indicator";
    if (code >= 200 && code < 300) {
        badge.classList.add("status-success");
    } else if (code >= 300 && code < 400) {
        badge.classList.add("status-warning");
    } else {
        badge.classList.add("status-danger");
    }
}

function displayResponseTime(ms) {
    document.getElementById("resTime").textContent = `${ms} ms`;
}

function displayResponseSize(bytes) {
    let sizeStr = `${bytes} B`;
    if (bytes >= 1024 * 1024) {
        sizeStr = `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
        sizeStr = `${(bytes / 1024).toFixed(2)} KB`;
    }
    document.getElementById("resSize").textContent = sizeStr;
}

function displayResponseHeaders(headers) {
    const list = document.getElementById("resHeadersList");
    list.innerHTML = "";

    let hasHeaders = false;
    headers.forEach((val, key) => {
        hasHeaders = true;
        const li = document.createElement("li");
        li.innerHTML = `<strong>${key}:</strong> ${val}`;
        list.appendChild(li);
    });

    if (!hasHeaders) {
        list.innerHTML = "<li>No headers returned (usually happens during a CORS block or simple network failure)</li>";
    }
}

function displayResponseBody(content) {
    document.getElementById("resBody").value = content;
}

// Helper to copy content to clipboard
function copyResponse() {
    const textarea = document.getElementById("resBody");
    if (textarea.value && textarea.value !== "Response content will appear here...") {
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
            if (typeof notify !== 'undefined') {
                notify.success("Response payload copied to clipboard");
            } else {
                alert("Response copied!");
            }
        });
    } else {
        if (typeof notify !== 'undefined') notify.error("No response content to copy");
    }
}

function clearConsole() {
    document.getElementById("urlInput").value = "";
    document.getElementById("reqBody").value = "";

    // Reset custom headers
    const headersContainer = document.getElementById("headersContainer");

    if (headersContainer) {
        headersContainer.innerHTML = "";

        // Restore default Content-Type header
        addHeaderRow("Content-Type", "application/json");
    }

    resetResponseConsole();

    if (typeof notify !== 'undefined') {
        notify.info("Inputs, headers and console cleared");
    }
}
