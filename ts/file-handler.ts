import { Notifications } from './notifications.js';
import { removeResultsContainer } from './results.js';

let fileInput: HTMLInputElement | null = null;
let dropZone: HTMLElement | null = null;
let preview: HTMLDivElement | null = null;

export function init(formElement: HTMLFormElement, fileInputElement: HTMLInputElement): void {
    fileInput = fileInputElement;
    dropZone = document.getElementById('drop-zone');

    fileInput.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            removeResultsContainer();
            displayPreview(file);
        }
    });

    dropZone?.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        dropZone!.classList.add('dragover');
    });

    dropZone?.addEventListener('dragleave', () => {
        dropZone!.classList.remove('dragover');
    });

    dropZone?.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        dropZone!.classList.remove('dragover');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                removeResultsContainer();
                fileInput!.files = files;
                displayPreview(file);
            } else {
                Notifications.showError('Please drop an image file');
            }
        }
    });
}

function displayPreview(file: File): void {
    removePreview();
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
        preview = document.createElement('div');
        preview.className = 'image-preview';

        const previewImg = document.createElement('img');
        previewImg.src = e.target!.result as string;

        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        const previewText = document.createElement('p');
        previewText.className = 'image-preview-info';
        previewText.textContent = `${file.name} (${sizeMB} MB)`;

        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.textContent = '✕ Clear';
        clearBtn.className = 'preview-clear-btn';
        clearBtn.onclick = () => clearImage();

        preview!.appendChild(previewImg);
        preview!.appendChild(previewText);
        preview!.appendChild(clearBtn);

        const content = dropZone!.querySelector('.drop-zone-content') as HTMLElement | null;
        if (content) content.style.display = 'none';
        dropZone!.appendChild(preview!);
    };
    reader.readAsDataURL(file);
}

function removePreview(): void {
    if (preview?.parentNode) {
        preview.remove();
    }
    const content = document.querySelector('.drop-zone-content') as HTMLElement | null;
    if (content) content.style.display = '';
    preview = null;
}

export function clearImage(): void {
    if (fileInput) fileInput.value = '';
    removePreview();
    console.log('Image preview cleared');
}
