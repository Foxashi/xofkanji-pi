function showError(message: string): void {
    removeNotification();
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = '✕ ' + message;
    document.body.appendChild(notification);
    setTimeout(() => removeNotification(), 4000);
}

function showSuccess(message: string): void {
    removeNotification();
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = '✓ ' + message;
    document.body.appendChild(notification);
    setTimeout(() => removeNotification(), 4000);
}

function removeNotification(): void {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
}

export const Notifications = { showError, showSuccess, removeNotification };
