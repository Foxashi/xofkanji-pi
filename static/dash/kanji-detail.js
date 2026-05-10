import { fetchJson } from './utils.js';
import { lookupJisho } from './jisho.js';
function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function formatDue(due) {
    if (due == null)
        return 'Never reviewed';
    const now = Date.now() / 1000;
    if (due <= now)
        return 'Due now';
    const diff = due - now;
    if (diff < 3600)
        return 'Due in ' + Math.round(diff / 60) + 'm';
    if (diff < 86400)
        return 'Due in ' + Math.round(diff / 3600) + 'h';
    return 'Due in ' + Math.round(diff / 86400) + 'd';
}
function renderBody(data) {
    const total = data.remembered + data.failed;
    const acc = total > 0 ? Math.round(data.remembered / total * 100) : null;
    const lvl = (data.level ?? 'Unknown').toLowerCase();
    const accClass = acc === null ? '' : acc >= 70 ? 'kd-acc-good' : acc >= 40 ? 'kd-acc-mid' : 'kd-acc-bad';
    const dueStr = formatDue(data.due);
    const isDueNow = data.due != null && data.due <= Date.now() / 1000;
    return ('<div class="kd-top">' +
        '<span class="kd-char jisho-clickable" title="Look up on Jisho" data-char="' + escapeHtml(data.kanji) + '">' + escapeHtml(data.kanji) + '</span>' +
        '<div class="kd-meta">' +
        '<span class="recent-level recent-level-' + lvl + ' kd-level">' + escapeHtml(data.level ?? 'Unknown') + '</span>' +
        '<p class="kd-meaning">' + escapeHtml(data.meaning) + '</p>' +
        '<div class="kd-readings">' +
        '<div class="kd-reading-row">' +
        '<span class="kd-reading-label">On\'yomi</span>' +
        '<span class="kd-reading-value kd-onyomi">' + escapeHtml(data.onyomi || '—') + '</span>' +
        '</div>' +
        '<div class="kd-reading-row">' +
        '<span class="kd-reading-label">Kun\'yomi</span>' +
        '<span class="kd-reading-value kd-kunyomi">' + escapeHtml(data.kunyomi || '—') + '</span>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="kd-stats">' +
        '<div class="kd-stat">' +
        '<span class="kd-stat-value">' + data.shown + '</span>' +
        '<span class="kd-stat-label">Shown</span>' +
        '</div>' +
        '<div class="kd-stat">' +
        '<span class="kd-stat-value kd-correct">' + data.remembered + '</span>' +
        '<span class="kd-stat-label">Correct</span>' +
        '</div>' +
        '<div class="kd-stat">' +
        '<span class="kd-stat-value kd-wrong">' + data.failed + '</span>' +
        '<span class="kd-stat-label">Wrong</span>' +
        '</div>' +
        '<div class="kd-stat">' +
        '<span class="kd-stat-value ' + accClass + '">' + (acc !== null ? acc + '%' : '—') + '</span>' +
        '<span class="kd-stat-label">Accuracy</span>' +
        '</div>' +
        '</div>' +
        '<div class="kd-footer">' +
        '<span class="kd-due' + (isDueNow ? ' kd-due-now' : '') + '">' + escapeHtml(dueStr) + '</span>' +
        '<button class="kd-jisho-btn" data-char="' + escapeHtml(data.kanji) + '">Look up on Jisho</button>' +
        '</div>');
}
function closeKanjiDetailModal() {
    const modal = document.getElementById('kanji-detail-modal');
    if (modal)
        modal.style.display = 'none';
}
export function initKanjiDetailModal() {
    document.getElementById('kanji-detail-close')?.addEventListener('click', closeKanjiDetailModal);
    document.getElementById('kanji-detail-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'kanji-detail-modal')
            closeKanjiDetailModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const m = document.getElementById('kanji-detail-modal');
            if (m && m.style.display !== 'none')
                closeKanjiDetailModal();
        }
    });
}
export async function openKanjiDetail(char) {
    const modal = document.getElementById('kanji-detail-modal');
    const titleEl = document.getElementById('kanji-detail-title');
    const bodyEl = document.getElementById('kanji-detail-body');
    if (!modal || !bodyEl)
        return;
    if (titleEl)
        titleEl.textContent = char;
    bodyEl.innerHTML = '<p class="kd-loading">Loading…</p>';
    modal.style.display = 'flex';
    try {
        const data = await fetchJson('/api/kanji/' + encodeURIComponent(char));
        bodyEl.innerHTML = renderBody(data);
        bodyEl.querySelector('.kd-char')?.addEventListener('click', () => {
            closeKanjiDetailModal();
            lookupJisho(char);
        });
        bodyEl.querySelector('.kd-jisho-btn')?.addEventListener('click', () => {
            closeKanjiDetailModal();
            lookupJisho(char);
        });
    }
    catch {
        bodyEl.innerHTML = '<p class="kd-loading">Failed to load kanji details.</p>';
    }
}
