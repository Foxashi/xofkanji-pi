const FileHandler = (() => {
    let form = null;
    let fileInput = null;
    let dropZone = null;
    let preview = null;
    let previewImg = null;
    let previewText = null;

    function init(formElement, fileInputElement) {
        form = formElement;
        fileInput = fileInputElement;
        dropZone = document.getElementById('drop-zone');

        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                Results.removeResultsContainer();
                displayPreview(file);
            }
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    Results.removeResultsContainer();
                    fileInput.files = files;
                    displayPreview(file);
                } else {
                    Notifications.showError('Please drop an image file');
                }
            }
        });
    }

    function displayPreview(file) {
        removePreview();

        const reader = new FileReader();
        reader.onload = (e) => {
            preview = document.createElement('div');
            preview.className = 'image-preview';

            previewImg = document.createElement('img');
            previewImg.src = e.target.result;

            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            previewText = document.createElement('p');
            previewText.className = 'image-preview-info';
            previewText.textContent = `${file.name} (${sizeMB} MB)`;

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.textContent = '✕ Clear';
            clearBtn.className = 'preview-clear-btn';
            clearBtn.onclick = () => clearImage();

            preview.appendChild(previewImg);
            preview.appendChild(previewText);
            preview.appendChild(clearBtn);

            // Hide the default drop zone content, show preview
            const content = dropZone.querySelector('.drop-zone-content');
            if (content) content.style.display = 'none';
            dropZone.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    function removePreview() {
        if (preview && preview.parentNode) {
            preview.remove();
        }
        const content = document.querySelector('.drop-zone-content');
        if (content) content.style.display = '';
        preview = null;
    }

    function clearImage() {
        fileInput.value = '';
        removePreview();
        console.log('Image preview cleared');
    }

    return {
        init,
        clearImage
    };
})();

