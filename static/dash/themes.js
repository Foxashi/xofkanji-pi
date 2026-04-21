import { fetchJson, rgb } from './utils.js';

export async function loadThemes() {
    try {
        const data = await fetchJson('/api/themes');
        const container = document.getElementById('theme-grid');
        if (!container) return;

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

            const colors = theme.colors || {};
            const bg = colors.background || [0,0,0];
            const kanjiColor = colors.kanji || [255,255,255];
            const meaningColor = colors.meaning || [255,215,0];
            const onyomiColor = colors.onyomi || [50,205,50];
            const kunyomiColor = colors.kunyomi || [30,144,255];
            const topBar = colors.top_bar || [40,40,40];
            const timeColor = colors.time || null;
            const dividerColor = colors.divider || null;
            const musicPlaying = colors.music_playing || null;
            const musicPaused = colors.music_paused || null;

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
                    (isActive ? '<span class="theme-active-badge">Active</span>' : '') +
                '</div>';

            card.addEventListener('click', () => setTheme(theme.name));
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Themes fetch failed:', err);
    }
}

export async function setTheme(name) {
    try {
        const res = await fetch('/api/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: name })
        });
        const data = await res.json();
        if (data.success) loadThemes();
    } catch (err) {
        console.error('Theme set failed:', err);
    }
}

function hexToRgb(hex) {
    if (!hex || hex[0] !== '#') return null;
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return [r,g,b];
}

export function initCreateTheme() {
    const btn = document.getElementById('btn-create-theme');
    const modal = document.getElementById('create-theme-modal');
    const close = document.getElementById('create-theme-close');
    const cancel = document.getElementById('create-theme-cancel');
    const form = document.getElementById('create-theme-form');
    if (!btn || !modal || !form) return;

    const openModal = () => { modal.style.display = 'block'; };
    const closeModal = () => { modal.style.display = 'none'; form.reset(); };

    btn.addEventListener('click', openModal);
    close.addEventListener('click', closeModal);
    cancel.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('theme-name').value.trim();
        if (!name) return alert('Please provide a theme name');

        const colors = {
            background: document.getElementById('color-background').value,
            top_bar: document.getElementById('color-topbar').value,
            kanji: document.getElementById('color-kanji').value,
            meaning: document.getElementById('color-meaning').value,
            onyomi: document.getElementById('color-onyomi').value,
            kunyomi: document.getElementById('color-kunyomi').value
        };

            // optional extra colors
            const timeEl = document.getElementById('color-time');
            const dividerEl = document.getElementById('color-divider');
            const musicPlayEl = document.getElementById('color-music-playing');
            const musicPauseEl = document.getElementById('color-music-paused');

            if (timeEl) colors.time = timeEl.value;
            if (dividerEl) colors.divider = dividerEl.value;
            if (musicPlayEl) colors.music_playing = musicPlayEl.value;
            if (musicPauseEl) colors.music_paused = musicPauseEl.value;

        const fileInput = document.getElementById('background-image');
        const fd = new FormData();
        fd.append('name', name);
        // send colors as hex strings; server will normalize
        fd.append('colors', JSON.stringify(colors));
        if (fileInput && fileInput.files && fileInput.files[0]) {
            fd.append('background_image', fileInput.files[0]);
        }

        try {
            const res = await fetch('/api/themes', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok && data.success) {
                closeModal();
                // refresh theme grid
                setTimeout(() => loadThemes(), 300);
            } else {
                alert(data.message || 'Failed to create theme');
            }
        } catch (err) {
            console.error('Create theme failed', err);
            alert('Failed to create theme');
        }
    });
}
