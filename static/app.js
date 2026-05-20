import { init as initResults } from './results.js';
import { init as initFileHandler } from './file-handler.js';
import { createAPI } from './api.js';
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('image-input');
    const form = document.querySelector('form');
    if (!fileInput || !form) {
        console.error('Missing elements: fileInput or form');
        return;
    }
    initFileHandler(form, fileInput);
    initResults(form);
    const api = createAPI(form, fileInput);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        api.submit();
    });
});
