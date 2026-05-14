import { fetchJson, rgb } from './utils.js';
export async function loadThemes() {
    try {
        const data = await fetchJson('/api/themes');
        const container = document.getElementById('theme-grid');
        if (!container)
            return;
        if (!data.themes || data.themes.length === 0) {
            container.innerHTML = '<p class="recent-empty">No themes available.</p>';
            return;
        }
        container.innerHTML = '';
        data.themes.forEach(theme => {
            const isActive = theme.name === data.active;
            const card = document.createElement('div');
            card.className = 'theme-card container' + (isActive ? ' theme-active' : '');
            card.dataset.theme = theme.name;
            const colors = theme.colors ?? {};
            const bg = colors.background ?? [0, 0, 0];
            const kanjiColor = colors.kanji ?? [255, 255, 255];
            const meaningColor = colors.meaning ?? [255, 215, 0];
            const onyomiColor = colors.onyomi ?? [50, 205, 50];
            const kunyomiColor = colors.kunyomi ?? [30, 144, 255];
            const topBar = colors.top_bar ?? [40, 40, 40];
            card.innerHTML =
                '<div class="theme-preview" style="background:' + rgb(bg) + '">' +
                    '<div class="theme-preview-bar" style="background:' + rgb(topBar) + '"></div>' +
                    '<span class="theme-preview-kanji" style="color:' + rgb(kanjiColor) + '">漢</span>' +
                    '<div class="theme-preview-readings">' +
                    '<span style="color:' + rgb(onyomiColor) + '">オン</span>' +
                    '<span style="color:' + rgb(kunyomiColor) + '">くん</span>' +
                    '</div>' +
                    '<span class="theme-preview-meaning" style="color:' + rgb(meaningColor) + '">meaning</span>' +
                    (theme.has_background_image ? '<span class="theme-preview-badge">IMG</span>' : '') +
                    '</div>' +
                    '<div class="theme-info">' +
                    '<span class="theme-name">' + theme.name + '</span>' +
                    (isActive
                        ? '<span class="theme-active-badge">Active</span>'
                        : '<button class="theme-delete-btn" data-theme="' + theme.name + '" title="Delete theme" aria-label="Delete theme"><img src="/static/icons/trash.svg" alt="Delete" class="theme-delete-icon"></button>') +
                    '</div>';
            card.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('theme-delete-btn'))
                    return;
                setTheme(theme.name);
            });
            const deleteBtn = card.querySelector('.theme-delete-btn');
            deleteBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTheme(theme.name);
            });
            container.appendChild(card);
        });
    }
    catch (err) {
        console.error('Themes fetch failed:', err);
    }
}
export async function deleteTheme(name) {
    if (!confirm(`Delete theme "${name}"?`))
        return;
    try {
        const res = await fetch('/api/themes/' + encodeURIComponent(name), { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            loadThemes();
        }
        else {
            alert(data.message ?? 'Failed to delete theme');
        }
    }
    catch (err) {
        console.error('Delete theme failed:', err);
        alert('Failed to delete theme');
    }
}
export async function setTheme(name) {
    try {
        const res = await fetch('/api/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: name }),
        });
        const data = await res.json();
        if (data.success)
            loadThemes();
    }
    catch (err) {
        console.error('Theme set failed:', err);
    }
}
function hexToRgb(hex) {
    if (!hex || hex[0] !== '#')
        return null;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
}
export function initCreateTheme() {
    const btn = document.getElementById('btn-create-theme');
    const modal = document.getElementById('create-theme-modal');
    const close = document.getElementById('create-theme-close');
    const cancel = document.getElementById('create-theme-cancel');
    const form = document.getElementById('create-theme-form');
    if (!btn || !modal || !form)
        return;
    function syncAllHexInputs() {
        form.querySelectorAll('.hex-input').forEach(hexInput => {
            const colorInput = document.getElementById(hexInput.dataset.for);
            if (colorInput)
                hexInput.value = colorInput.value.toUpperCase();
        });
    }
    function updatePreview() {
        const val = (id) => document.getElementById(id)?.value ?? '#000000';
        const el = (id) => document.getElementById(id);
        const bg = el('creator-preview-bg');
        if (bg)
            bg.style.background = val('color-background');
        const bar = el('creator-preview-bar');
        if (bar)
            bar.style.background = val('color-topbar');
        const kanji = el('creator-preview-kanji');
        if (kanji)
            kanji.style.color = val('color-kanji');
        const meaning = el('creator-preview-meaning');
        if (meaning)
            meaning.style.color = val('color-meaning');
        const onyomi = el('creator-preview-onyomi');
        if (onyomi)
            onyomi.style.color = val('color-onyomi');
        const kunyomi = el('creator-preview-kunyomi');
        if (kunyomi)
            kunyomi.style.color = val('color-kunyomi');
    }
    const openModal = () => {
        modal.style.display = 'flex';
        syncAllHexInputs();
        updatePreview();
    };
    const closeModal = () => {
        modal.style.display = 'none';
        form.reset();
        syncAllHexInputs();
        updatePreview();
    };
    btn.addEventListener('click', openModal);
    close?.addEventListener('click', closeModal);
    cancel?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal)
        closeModal(); });
    form.querySelectorAll('.hex-input').forEach(hexInput => {
        const colorInput = document.getElementById(hexInput.dataset.for);
        if (!colorInput)
            return;
        colorInput.addEventListener('input', () => {
            hexInput.value = colorInput.value.toUpperCase();
            updatePreview();
        });
        hexInput.addEventListener('input', () => {
            const v = hexInput.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                colorInput.value = v;
                updatePreview();
            }
        });
        hexInput.addEventListener('blur', () => {
            hexInput.value = colorInput.value.toUpperCase();
        });
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameEl = document.getElementById('theme-name');
        const name = nameEl?.value.trim() ?? '';
        if (!name) {
            alert('Please provide a theme name');
            return;
        }
        const colors = {
            background: document.getElementById('color-background').value,
            top_bar: document.getElementById('color-topbar').value,
            kanji: document.getElementById('color-kanji').value,
            meaning: document.getElementById('color-meaning').value,
            onyomi: document.getElementById('color-onyomi').value,
            kunyomi: document.getElementById('color-kunyomi').value,
        };
        const timeEl = document.getElementById('color-time');
        const dividerEl = document.getElementById('color-divider');
        const musicPlayEl = document.getElementById('color-music-playing');
        const musicPauseEl = document.getElementById('color-music-paused');
        if (timeEl)
            colors.time = timeEl.value;
        if (dividerEl)
            colors.divider = dividerEl.value;
        if (musicPlayEl)
            colors.music_playing = musicPlayEl.value;
        if (musicPauseEl)
            colors.music_paused = musicPauseEl.value;
        const fileInputEl = document.getElementById('background-image');
        const fd = new FormData();
        fd.append('name', name);
        fd.append('colors', JSON.stringify(colors));
        if (fileInputEl?.files?.[0]) {
            fd.append('background_image', fileInputEl.files[0]);
        }
        try {
            const res = await fetch('/api/themes', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.success) {
                closeModal();
                setTimeout(() => loadThemes(), 300);
            }
            else {
                alert(data.message ?? 'Failed to create theme');
            }
        }
        catch (err) {
            console.error('Create theme failed', err);
            alert('Failed to create theme');
        }
    });
    // hexToRgb is defined but only used internally for future use
    void hexToRgb;
}
