// Main app initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    const fileInput = document.getElementById('image-input');
    const form = document.querySelector('form');

    if (!fileInput || !form) {
        console.error('Missing elements: fileInput or form');
        return;
    }

    // Initialize modules
    FileHandler.init(form, fileInput);
    Results.init(form);
    const apiModule = API(form, fileInput);

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Form submitted');
        apiModule.submit();
    });

    console.log('App initialized successfully');

    // Add animations
    addAnimations();
});

// Add CSS animations
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

