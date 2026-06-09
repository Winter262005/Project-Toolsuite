'use strict';

const longUrlInput = document.getElementById('longUrl');
const shortenBtn = document.getElementById('shortenBtn');
const resultContainer = document.getElementById('result-container');
const shortUrlDiv = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const status = document.getElementById('status');

shortenBtn.onclick = async () => {
    const url = longUrlInput.value.trim();

    if (!url) {
        notify.info("Please paste a URL first.");
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        notify.error("URL must start with http:// or https://");
        return;
    }

    status.textContent = "Shortening... please wait.";
    shortenBtn.disabled = true;
    resultContainer.style.display = "none";

    try {
        const response = await fetch("https://spoo.me", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            },
            body: `url=${encodeURIComponent(url)}`
        });

        const data = await response.json();

        if (response.ok && data.short_url) {
            shortUrlDiv.textContent = data.short_url;
            resultContainer.style.display = "block";
            status.textContent = "Success!";
        } else {
            const errorMsg = data.UrlError || data.error || "Could not shorten URL.";
            status.textContent = "Error: " + errorMsg;
            notify.error("Failed to shorten URL: " + errorMsg);
        }

    } catch (err) {
        console.error("Fetch Error:", err);

        status.textContent =
            "The shortening service is temporarily unavailable.";

        notify.error("Failed to shorten URL.");
    } finally {
        shortenBtn.disabled = false;
    }
};

copyBtn.onclick = async () => {
    try {
        await navigator.clipboard.writeText(shortUrlDiv.textContent);

        const originalText = copyBtn.textContent;
        copyBtn.textContent = "COPIED!";

        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);

    } catch {
        notify.error("Clipboard access failed.");
    }
};
