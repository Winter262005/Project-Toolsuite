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

// ---------- Recent Tools with localStorage ----------
const RECENT_TOOLS_KEY = "recentTools";
const MAX_RECENT = 5;

function saveRecentTool(toolName, toolUrl) {
  let recent = JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY)) || [];
  recent = recent.filter(item => item.name !== toolName && item.url !== toolUrl);
  recent.unshift({ name: toolName, url: toolUrl });
  if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(recent));
  renderRecentTools();
}

function renderRecentTools() {
  const container = document.getElementById("recent-tools-list");
  if (!container) return;
  const recent = JSON.parse(localStorage.getItem(RECENT_TOOLS_KEY)) || [];
  if (recent.length === 0) {
    container.innerHTML = '<p class="recent-placeholder">No recent tools yet</p>';
    return;
  }
  const html = '<ul class="recent-tools-ul">' +
    recent.map(item => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a></li>`).join('') +
    '</ul>';
  container.innerHTML = html;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function attachRecentToolsClickHandler() {
  document.addEventListener('click', (e) => {
    const toolLink = e.target.closest('.tool-link, .tool-card a, a[href*="tools/"]');
    if (!toolLink) return;
    if (toolLink.closest('.tag-list, .recent-sidebar, .footer-links')) return;
    const toolName = toolLink.innerText.trim() || toolLink.getAttribute('data-tool-name') || "Tool";
    let toolUrl = toolLink.getAttribute('href');
    if (toolUrl && !toolUrl.startsWith('#') && !toolUrl.startsWith('javascript:')) {
      saveRecentTool(toolName, toolUrl);
    }
  });
}

// existing DOMContentLoaded listener ke andar yeh do lines add karo
// agar DOMContentLoaded already hai toh uske andar add karo, nahi toh naya listener banao
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderRecentTools();
    attachRecentToolsClickHandler();
  });
} else {
  renderRecentTools();
  attachRecentToolsClickHandler();
}