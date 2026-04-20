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
