/**
 * Notification utility used across Project Toolsuite.
 *
 * Supports:
 * - Success notifications
 * - Error notifications
 * - Informational notifications
 *
 * Automatically creates and manages toast elements.
 */
const notify = {
    container: null,

    /**
     * Initializes the notification container.
     *
     * @returns {void}
     */
    init() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        this.container.setAttribute('role', 'status');
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(this.container);
    },

    /**
     * Displays a toast notification.
     *
     * @param {string} message - Notification message
     * @param {string} [type='info'] - Notification type
     * @param {number} [duration=3000] - Auto-dismiss duration in milliseconds
     * @returns {void}
     */
    show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        const content = document.createElement('span');
        content.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Dismiss notification');
        
        closeBtn.onclick = () => this.hide(toast);

        toast.appendChild(content);
        toast.appendChild(closeBtn);
        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }
    },

    /**
     * Hides a toast notification.
     *
     * @param {HTMLElement} toast - Toast element
     * @returns {void}
     */
    hide(toast) {
        toast.classList.add('hide');
        toast.addEventListener('animationend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    },

    /**
     * Displays a success notification.
     *
     * @param {string} message - Notification message
     * @param {number} duration - Display duration in milliseconds
     * @returns {void}
     */
    success(message, duration) {
        this.show(message, 'success', duration);
    },

    /**
     * Displays an error notification.
     *
     * @param {string} message - Notification message
     * @param {number} duration - Display duration in milliseconds
     * @returns {void}
     */
    error(message, duration) {
        this.show(message, 'error', duration);
    },

    /**
     * Displays an informational notification.
     *
     * @param {string} message - Notification message
     * @param {number} duration - Display duration in milliseconds
     * @returns {void}
     */
    info(message, duration) {
        this.show(message, 'info', duration);
    }
};

// Auto-initialize when the script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => notify.init());
} else {
    notify.init();
}