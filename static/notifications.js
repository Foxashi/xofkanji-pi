const Notifications = (() => {
    function showError(message) {
        removeNotification();
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = '✕ ' + message;
        document.body.appendChild(notification);
        setTimeout(() => removeNotification(), 4000);
    }

    function showSuccess(message) {
        removeNotification();
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = '✓ ' + message;
        document.body.appendChild(notification);
        setTimeout(() => removeNotification(), 4000);
    }

    function removeNotification() {
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
    }

    return {
        showError,
        showSuccess,
        removeNotification
    };
})();

