import { fetchJson } from './utils.js';

export async function loadRecent() {
    try {
        const data = await fetchJson('/api/recent-kanji');
        const container = document.getElementById('recent-list');
        if (!container) return;

        if (!data.recent || data.recent.length === 0) {
            container.innerHTML = '<p class="recent-empty">No kanji scanned yet.</p>';
            return;
        }

        let html = '<div class="recent-grid">';
        data.recent.forEach(k => {
            const lvl = (k.level || 'Unknown').toLowerCase();
            const readings = [k.onyomi, k.kunyomi].filter(Boolean).join(' ・ ');
            html += '<div class="recent-row">' +
                '<span class="recent-char">' + k.kanji + '</span>' +
                '<div class="recent-info">' +
                    '<div class="recent-meaning">' + (k.meaning || '') + '</div>' +
                    '<div class="recent-readings">' + readings + '</div>' +
                '</div>' +
                '<span class="recent-level recent-level-' + lvl + '">' + (k.level || '?') + '</span>' +
            '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        console.error('Recent kanji fetch failed:', err);
    }
}
