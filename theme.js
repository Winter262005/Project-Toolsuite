// IIFE to prevent Flash of Unstyled Content (FOUC) by applying dark mode class immediately to html tag
(function() {
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = savedTheme || systemTheme;
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
    }
})();

function updateThemeButton() {
    const btn = document.getElementById('themeBtn') || document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark-mode');
    
    const darkModeOption = btn.querySelector('.dark-mode-option');
    const lightModeOption = btn.querySelector('.light-mode-option');
    const sunIcon = btn.querySelector('.sun-icon');
    const moonIcon = btn.querySelector('.moon-icon');
    
    if (darkModeOption || lightModeOption) {
        // Icon + Option text containers
        if (isDark) {
            if (darkModeOption) darkModeOption.classList.remove('hidden');
            if (lightModeOption) lightModeOption.classList.add('hidden');
        } else {
            if (darkModeOption) darkModeOption.classList.add('hidden');
            if (lightModeOption) lightModeOption.classList.remove('hidden');
        }
    } else if (sunIcon || moonIcon) {
        // Icon-only buttons
        if (isDark) {
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (moonIcon) moonIcon.classList.add('hidden');
        } else {
            if (sunIcon) sunIcon.classList.add('hidden');
            if (moonIcon) moonIcon.classList.remove('hidden');
        }
    } else {
        // Text-only buttons
        const text = btn.textContent.trim().toUpperCase();
        if (text.includes('MODE')) {
            btn.textContent = isDark ? 'LIGHT MODE' : 'DARK MODE';
        } else if (text === 'LIGHT' || text === 'DARK') {
            btn.textContent = isDark ? 'LIGHT' : 'DARK';
        } else {
            btn.textContent = isDark ? 'LIGHT MODE' : 'DARK MODE';
        }
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        document.body && document.body.classList.add('dark-mode');
    } else {
        document.documentElement.classList.remove('dark-mode');
        document.body && document.body.classList.remove('dark-mode');
    }
    updateThemeButton();
}

window.toggleTheme = function () {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
};

function getSystemTheme() {
    return window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || getSystemTheme();
    applyTheme(theme);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
} else {
    initTheme();
}

// Real-time synchronization listener across tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
        applyTheme(e.newValue || getSystemTheme());
    }
});