// File handler module - Singleton pattern
const FileHandler = (() => {
    let form = null;
    let fileInput = null;
    let preview = null;
    let previewImg = null;
    let previewText = null;

    function init(formElement, fileInputElement) {
        form = formElement;
        fileInput = fileInputElement;

        // Create preview element
        preview = document.createElement('div');
        preview.id = 'image-preview';
        preview.style.display = 'none';
        preview.style.marginTop = '20px';
        preview.style.padding = '15px';
        preview.style.backgroundColor = '#f8fafc';
        preview.style.borderRadius = '8px';
        preview.style.textAlign = 'center';

        previewImg = document.createElement('img');
        previewImg.style.maxWidth = '100%';
        previewImg.style.maxHeight = '300px';
        previewImg.style.borderRadius = '6px';
        previewImg.style.marginBottom = '10px';

        previewText = document.createElement('p');
        previewText.style.fontSize = '12px';
        previewText.style.color = '#64748b';
        previewText.style.margin = '0';

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.textContent = '✕ Clear';
        clearBtn.style.marginTop = '10px';
        clearBtn.style.padding = '8px 16px';
        clearBtn.style.fontSize = '12px';
        clearBtn.style.backgroundColor = '#e2e8f0';
        clearBtn.style.color = '#334155';
        clearBtn.style.border = 'none';
        clearBtn.style.borderRadius = '6px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.fontWeight = '600';
        clearBtn.onclick = () => clearImage();

        preview.appendChild(previewImg);
        preview.appendChild(previewText);
        preview.appendChild(clearBtn);
        form.appendChild(preview);

        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                Results.removeResultsContainer();  // Clear old results
                displayPreview(file);
            }
        });

        // Drag and drop functionality
        form.addEventListener('dragover', (e) => {
            e.preventDefault();
            form.style.backgroundColor = '#f1f5f9';
            form.style.borderTop = '2px dashed #6366f1';
            form.style.borderBottom = '2px dashed #6366f1';
        });

        form.addEventListener('dragleave', () => {
            form.style.backgroundColor = '';
            form.style.borderTop = '';
            form.style.borderBottom = '';
        });

        form.addEventListener('drop', (e) => {
            e.preventDefault();
            form.style.backgroundColor = '';
            form.style.borderTop = '';
            form.style.borderBottom = '';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    Results.removeResultsContainer();  // Clear old results
                    fileInput.files = files;
                    displayPreview(file);
                } else {
                    Notifications.showError('Please drop an image file');
                }
            }
        });
    }

    function displayPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            previewText.textContent = `${file.name} (${sizeMB} MB)`;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    function clearImage() {
        fileInput.value = '';
        preview.style.display = 'none';
        previewImg.src = '';
        previewText.textContent = '';
        console.log('Image preview cleared');
    }

    return {
        init,
        clearImage
    };
})();

