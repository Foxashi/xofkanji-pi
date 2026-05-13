function showError(message) {
    removeNotification();
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = '✕ ' + message;
    document.body.appendChild(notification);
    setTimeout(() => removeNotification(), 6000);
}
function showSuccess(message) {
    removeNotification();
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = '✓ ' + message;
    document.body.appendChild(notification);
    setTimeout(() => removeNotification(), 6000);
}
function removeNotification() {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
}
export const Notifications = { showError, showSuccess, removeNotification };
