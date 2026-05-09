import { Notifications } from './notifications.js';
import { displayResults, displayPartialResults, removeResultsContainer } from './results.js';
import { clearImage } from './file-handler.js';
import type { UploadResponse } from './types.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): boolean {
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

export function createAPI(form: HTMLFormElement, fileInput: HTMLInputElement) {
    function submit(): void {
        if (!fileInput.files || fileInput.files.length === 0) {
            Notifications.showError('Please select an image');
            return;
        }
        const file = fileInput.files[0];
        if (!validateFile(file)) return;
        submitToServer(file);
    }

    function submitToServer(file: File): void {
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalText = submitBtn.innerHTML;
        const directionSelect = document.getElementById('direction-select') as HTMLSelectElement | null;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<img class="submit-icon-svg" src="/static/icons/wait.svg" alt=""> Scanning...';
        fileInput.disabled = true;
        if (directionSelect) directionSelect.disabled = true;

        const formData = new FormData();
        const direction = directionSelect?.value ?? 'horizontal';
        formData.append('image', file, file.name);
        formData.append('direction', direction);

        console.log('Submitting with:', file.name, file.size, 'bytes');

        fetch('/upload', { method: 'POST', body: formData })
            .then(res => res.json() as Promise<UploadResponse>)
            .then(data => {
                console.log('Response:', data);
                handleResponse(data);
            })
            .catch(error => {
                console.error('Error:', error);
                Notifications.showError('Error uploading image. Please try again.');
                resetForm();
            });

        function handleResponse(data: UploadResponse): void {
            if (data.success) {
                Notifications.showSuccess('Kanji extracted successfully!');
                console.log('Displaying results:', data.kanji);
                displayResults(data);
                clearImage();
                fileInput.value = '';
                resetForm();
            } else {
                Notifications.showError(data.message ?? 'Error processing image');
                if (data.kanji) {
                    console.log('Displaying partial results:', data.kanji);
                    displayPartialResults(data);
                }
                resetForm();
            }
        }

        function resetForm(): void {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            fileInput.disabled = false;
            if (directionSelect) directionSelect.disabled = false;
        }
    }

    return { submit };
}
