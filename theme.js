// IIFE to prevent Flash of Unstyled Content (FOUC) by applying dark mode class immediately to html tag
(function () {
    const savedTheme = localStorage.getItem("theme");
    const systemTheme =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

    const theme = savedTheme || systemTheme;

    if (theme === "dark") {
        document.documentElement.classList.add("dark-mode");
    } else {
        document.documentElement.classList.remove("dark-mode");
    }
})();

/**
 * Updates the theme toggle button UI based on the
 * currently active theme.
 *
 * Supports:
 * - Text-only buttons
 * - Icon-only buttons
 * - Icon + text buttons
 *
 * @returns {void}
 */
function updateThemeButton() {
    const btn =
        document.getElementById("themeBtn") ||
        document.getElementById("themeToggle");

    if (!btn) return;

    const isDark =
        document.documentElement.classList.contains("dark-mode");

    btn.setAttribute(
    "aria-pressed",
    isDark ? "true" : "false"
    );
    const darkModeOption = btn.querySelector(".dark-mode-option");
    const lightModeOption = btn.querySelector(".light-mode-option");
    const sunIcon = btn.querySelector(".sun-icon");
    const moonIcon = btn.querySelector(".moon-icon");

    if (darkModeOption || lightModeOption) {
        if (isDark) {
            if (darkModeOption) darkModeOption.classList.remove("hidden");
            if (lightModeOption) lightModeOption.classList.add("hidden");
        } else {
            if (darkModeOption) darkModeOption.classList.add("hidden");
            if (lightModeOption) lightModeOption.classList.remove("hidden");
        }
    } else if (sunIcon || moonIcon) {
        if (isDark) {
            if (sunIcon) sunIcon.classList.remove("hidden");
            if (moonIcon) moonIcon.classList.add("hidden");
        } else {
            if (sunIcon) sunIcon.classList.add("hidden");
            if (moonIcon) moonIcon.classList.remove("hidden");
        }
    } else {
        const text = btn.textContent.trim().toUpperCase();

        if (text.includes("MODE")) {
            btn.textContent = isDark ? "LIGHT MODE" : "DARK MODE";
        } else if (text === "LIGHT" || text === "DARK") {
            btn.textContent = isDark ? "LIGHT" : "DARK";
        } else {
            btn.textContent = isDark ? "LIGHT MODE" : "DARK MODE";
        }
    }
}

/**
 * Applies the specified theme to the document.
 *
 * Adds or removes the dark-mode class and updates
 * the theme toggle button state.
 *
 * @param {string} theme - Theme name ('light' or 'dark')
 * @returns {void}
 */
function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark-mode");
        document.body && document.body.classList.add("dark-mode");
    } else {
        document.documentElement.classList.remove("dark-mode");
        document.body && document.body.classList.remove("dark-mode");
    }

    updateThemeButton();
}

/**
 * Toggles between light and dark mode.
 *
 * Persists the selected theme in localStorage
 * and applies it immediately.
 *
 * @returns {void}
 */
window.toggleTheme = function () {
    const isDark =
        document.documentElement.classList.contains("dark-mode");

    const newTheme = isDark ? "light" : "dark";

    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
};

/**
 * Returns the user's preferred system theme.
 *
 * Uses the prefers-color-scheme media query.
 *
 * @returns {string} 'light' or 'dark'
 */
function getSystemTheme() {
    return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

/**
 * Initializes the theme using localStorage
 * or the system theme preference.
 *
 * @returns {void}
 */
function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    const theme = savedTheme || getSystemTheme();

    applyTheme(theme);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
} else {
    initTheme();
}

// Real-time synchronization listener across tabs/windows
window.addEventListener("storage", (e) => {
    if (e.key === "theme") {
        applyTheme(e.newValue || getSystemTheme());
    }
});

// ---------- Recent Tools with localStorage ----------
const RECENT_TOOLS_KEY = "recentTools";
const MAX_RECENT = 5;

/**
 * Saves a tool entry to the recent tools list.
 *
 * Removes duplicates, stores the latest tool,
 * and limits the list size.
 *
 * @param {string} toolName - Display name of the tool
 * @param {string} toolUrl - URL of the tool
 * @returns {void}
 */
function saveRecentTool(toolName, toolUrl) {
    let recent =
        JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY)) || [];

    recent = recent.filter(
        (item) => item.name !== toolName && item.url !== toolUrl
    );

    recent.unshift({
        name: toolName,
        url: toolUrl,
    });

    if (recent.length > MAX_RECENT) {
        recent = recent.slice(0, MAX_RECENT);
    }

    localStorage.setItem(
        RECENT_TOOLS_KEY,
        JSON.stringify(recent)
    );

    renderRecentTools();
}

/**
 * Renders the recent tools list in the UI.
 *
 * @returns {void}
 */
function renderRecentTools() {
    const container =
        document.getElementById("recent-tools-list");

    if (!container) return;

    const recent =
        JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY)) || [];

    if (recent.length === 0) {
        container.innerHTML =
            '<p class="recent-placeholder">No recent tools yet</p>';
        return;
    }

    const html =
        '<ul class="recent-tools-ul">' +
        recent
            .map(
                (item) =>
                    `<li><a href="${escapeHtml(
                        item.url
                    )}">${escapeHtml(item.name)}</a></li>`
            )
            .join("") +
        "</ul>";

    container.innerHTML = html;
}

/**
 * Escapes HTML special characters to prevent
 * HTML injection when rendering tool names.
 *
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (m) {
        if (m === "&") return "&amp;";
        if (m === "<") return "&lt;";
        if (m === ">") return "&gt;";
        return m;
    });
}

/**
 * Attaches click handlers that automatically
 * track recently visited tools.
 *
 * @returns {void}
 */
function attachRecentToolsClickHandler() {
    document.addEventListener("click", (e) => {
        const toolLink = e.target.closest(
            '.tool-link, .tool-card a, a[href*="tools/"]'
        );

        if (!toolLink) return;

        if (
            toolLink.closest(
                ".tag-list, .recent-sidebar, .footer-links"
            )
        ) {
            return;
        }

        const toolName =
            toolLink.innerText.trim() ||
            toolLink.getAttribute("data-tool-name") ||
            "Tool";

        const toolUrl = toolLink.getAttribute("href");

        if (
            toolUrl &&
            !toolUrl.startsWith("#") &&
            !toolUrl.startsWith("javascript:")
        ) {
            saveRecentTool(toolName, toolUrl);
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        renderRecentTools();
        attachRecentToolsClickHandler();
    });
} else {
    renderRecentTools();
    attachRecentToolsClickHandler();
}