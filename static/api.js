// API and form submission module
const API = ((form, fileInput) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    function validateFile(file) {
        if (!file) {
            Notifications.showError('Please select an image');
            return false;
        }

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

    function submit() {
        if (!fileInput.files || fileInput.files.length === 0) {
            Notifications.showError('Please select an image');
            return;
        }

        const file = fileInput.files[0];
        if (!validateFile(file)) {
            return;
        }

        submitToServer();
    }

    function submitToServer() {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Scanning...';
        fileInput.disabled = true;
        document.getElementById('direction-select').disabled = true;

        const formData = new FormData();
        const file = fileInput.files[0];
        const direction = document.getElementById('direction-select').value;

        formData.append('image', file, file.name);
        formData.append('direction', direction);

        console.log('Submitting with:', file.name, file.size, 'bytes');

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log('Response:', data);
                handleResponse(data, submitBtn, originalText);
            })
            .catch(error => {
                console.error('Error:', error);
                Notifications.showError('Error uploading image. Please try again.');
                resetForm();
            });

        function handleResponse(data, submitBtn, originalText) {
            if (data.success) {
                Notifications.showSuccess('Kanji extracted successfully!');
                console.log('Displaying results:', data.kanji);
                Results.displayResults(data);
                FileHandler.clearImage();  // Clear the preview image
                fileInput.value = '';
                resetForm();
            } else {
                Notifications.showError(data.message || 'Error processing image');
                if (data.kanji) {
                    console.log('Displaying partial results:', data.kanji);
                    Results.displayPartialResults(data);
                }
                resetForm();
            }
        }

        function resetForm() {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            fileInput.disabled = false;
            document.getElementById('direction-select').disabled = false;
        }
    }

    return {
        submit
    };
});

