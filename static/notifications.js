// Notifications module
const Notifications = (() => {
    function showError(message) {
        removeNotification();
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = '❌ ' + message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            backgroundColor: #fee2e2;
            color: #991b1b;
            padding: 16px 20px;
            borderRadius: 8px;
            boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            zIndex: 1000;
            maxWidth: 300px;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => removeNotification(), 4000);
    }

    function showSuccess(message) {
        removeNotification();
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = '✅ ' + message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            backgroundColor: #dcfce7;
            color: #166534;
            padding: 16px 20px;
            borderRadius: 8px;
            boxShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            zIndex: 1000;
            maxWidth: 300px;
            animation: slideIn 0.3s ease;
        `;
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

