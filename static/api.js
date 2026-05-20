import { Notifications } from './notifications.js';
import { displayResults, displayPartialResults } from './results.js';
import { clearImage } from './file-handler.js';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
function validateFile(file) {
    if (file.size > MAX_FILE_SIZE) {
        Notifications.showError('Image size must be less than 10MB');
        return false;
    }
    if (!file.type.startsWith('image/')) {
        Notifications.showError('Please select a valid image file');
        return false;
    }
    return true;
}
export function createAPI(form, fileInput) {
    function submit() {
        if (!fileInput.files || fileInput.files.length === 0) {
            Notifications.showError('Please select an image');
            return;
        }
        const file = fileInput.files[0];
        if (!validateFile(file))
            return;
        submitToServer(file);
    }
    function submitToServer(file) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const directionSelect = document.getElementById('direction-select');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<img class="submit-icon-svg" src="/static/icons/wait.svg" alt=""> Scanning...';
        fileInput.disabled = true;
        if (directionSelect)
            directionSelect.disabled = true;
        const formData = new FormData();
        const direction = directionSelect?.value ?? 'horizontal';
        formData.append('image', file, file.name);
        formData.append('direction', direction);
        fetch('/upload', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
            handleResponse(data);
        })
            .catch(error => {
            console.error('Error:', error);
            Notifications.showError('Error uploading image. Please try again.');
            resetForm();
        });
        function handleResponse(data) {
            if (data.success) {
                Notifications.showSuccess('Kanji extracted successfully!');
                displayResults(data);
                clearImage();
                fileInput.value = '';
                resetForm();
            }
            else {
                Notifications.showError(data.message ?? 'Error processing image');
                if (data.kanji) {
                    displayPartialResults(data);
                }
                resetForm();
            }
        }
        function resetForm() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            fileInput.disabled = false;
            if (directionSelect)
                directionSelect.disabled = false;
        }
    }
    return { submit };
}
