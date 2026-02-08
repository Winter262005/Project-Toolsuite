'use strict';

const longUrlInput = document.getElementById('longUrl');
const shortenBtn = document.getElementById('shortenBtn');
const resultContainer = document.getElementById('result-container');
const shortUrlDiv = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const status = document.getElementById('status');

shortenBtn.onclick = async () => {
    const url = longUrlInput.value.trim();
    
    if (!url) return notify.info("Please paste a URL first.");
    if (!url.startsWith('http')) return notify.error("URL must start with http:// or https://");

    status.textContent = "Shortening... please wait.";
    shortenBtn.disabled = true;
    resultContainer.style.display = "none";

    try {
        // Use an alternative public proxy if corsproxy.io is failing
        const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) throw new Error("Proxy server error");

        const wrapper = await response.json();
        // allorigins wraps the response in a 'contents' string
        const data = JSON.parse(wrapper.contents);

        if (data.shorturl) {
            shortUrlDiv.textContent = data.shorturl;
            resultContainer.style.display = "block";
            status.textContent = "Success!";
        } else {
            status.textContent = "Error: " + (data.errormessage || "Service unavailable.");
        }
    } catch (err) {
        status.textContent = "The service is busy. Please try again in a few seconds.";
        console.error("Fetch Error:", err);
    } finally {
        shortenBtn.disabled = false;
    }
};

copyBtn.onclick = () => {
    navigator.clipboard.writeText(shortUrlDiv.textContent);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "COPIED!";
    setTimeout(() => copyBtn.textContent = originalText, 2000);
};
