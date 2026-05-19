import { fetchJson, updateValue } from './utils.js';
import { openKanjiDetail } from './kanji-detail.js';
export async function loadStats() {
    try {
        const data = await fetchJson('/api/stats');
        updateValue('stat-total', data.total_kanji);
        updateValue('stat-shown', data.total_shown);
        updateValue('stat-remembered', data.total_remembered);
        updateValue('stat-failed', data.total_failed);
        updateValue('stat-accuracy', data.accuracy + '%');
        updateValue('stat-due', data.due_now);
        const updated = document.getElementById('last-updated');
        if (updated)
            updated.textContent = 'Updated ' + new Date().toLocaleTimeString();
        renderLevels(data.levels);
    }
    catch (err) {
        console.error('Stats fetch failed:', err);
    }
}
export function renderLevels(levels) {
    const container = document.getElementById('level-bars');
    if (!container)
        return;
    const order = ['N5', 'N4', 'N3', 'N2', 'N1', 'Unknown'];
    const present = order.filter(l => levels?.[l]);
    if (present.length === 0) {
        container.innerHTML = '<p style="color: rgb(147,154,183); font-size:13px;">No kanji data yet.</p>';
        return;
    }
    const max = Math.max(...present.map(l => levels[l]));
    if (container.children.length === present.length) {
        present.forEach((level, i) => {
            const row = container.children[i];
            const fill = row.querySelector('.level-bar-fill');
            const count = row.querySelector('.level-count');
            const pct = max > 0 ? (levels[level] / max) * 100 : 0;
            if (fill)
                fill.style.width = pct + '%';
            if (count)
                count.textContent = String(levels[level]);
        });
        return;
    }
    container.innerHTML = '';
    present.forEach(level => {
        const count = levels[level];
        const pct = max > 0 ? (count / max) * 100 : 0;
        const cls = 'level-' + level.toLowerCase();
        const row = document.createElement('div');
        row.className = 'level-row ' + cls;
        row.style.cursor = 'pointer';
        row.innerHTML =
            '<span class="level-label">' + level + '</span>' +
                '<div class="level-bar-bg">' +
                '<div class="level-bar-fill" style="width: ' + pct + '%"></div>' +
                '</div>' +
                '<span class="level-count">' + count + '</span>';
        row.addEventListener('click', () => openLevelModal(level));
        container.appendChild(row);
    });
}
export async function openLevelModal(level) {
    const modal = document.getElementById('level-modal');
    const title = document.getElementById('level-modal-title');
    const body = document.getElementById('level-modal-body');
    if (!modal || !title || !body)
        return;
    title.textContent = level + ' Kanji';
    body.innerHTML = '<p class="recent-empty">Loading...</p>';
    modal.style.display = 'flex';
    try {
        const data = await fetchJson('/api/kanji-by-level/' + encodeURIComponent(level));
        if (!data.kanji || data.kanji.length === 0) {
            body.innerHTML = '<p class="recent-empty">No kanji found.</p>';
            return;
        }
        let html = '<div class="modal-kanji-grid">';
        data.kanji.forEach((k) => {
            const readings = [k.onyomi, k.kunyomi].filter(Boolean).join(' ・ ');
            const total = k.remembered + k.failed;
            const acc = total > 0 ? Math.round(k.remembered / total * 100) : 0;
            const accClass = total === 0 ? '' : (acc >= 70 ? 'acc-good' : (acc >= 40 ? 'acc-mid' : 'acc-bad'));
            html += '<div class="modal-kanji-row">' +
                '<span class="modal-kanji-char">' + k.kanji + '</span>' +
                '<div class="modal-kanji-info">' +
                '<div class="modal-kanji-meaning">' + (k.meaning ?? '') + '</div>' +
                '<div class="modal-kanji-readings">' + readings + '</div>' +
                '</div>' +
                '<div class="modal-kanji-stats">' +
                (total > 0
                    ? '<span class="modal-kanji-acc ' + accClass + '">' + acc + '%</span>'
                    : '<span class="modal-kanji-acc">New</span>') +
                '</div>' +
                '</div>';
        });
        html += '</div>';
        body.innerHTML = html;
        body.querySelectorAll('.modal-kanji-char').forEach(el => {
            el.classList.add('jisho-clickable');
            el.title = 'View details';
            el.addEventListener('click', () => openKanjiDetail(el.textContent ?? ''));
        });
    }
    catch (err) {
        body.innerHTML = '<p class="recent-empty">Failed to load kanji.</p>';
        console.error('Level kanji fetch failed:', err);
    }
}
export async function loadDueKanji() {
    try {
        const data = await fetchJson('/api/due-kanji?limit=100');
        const welcomeBadge = document.getElementById('welcome-due-count');
        const overviewBadge = document.getElementById('overview-due-badge');
        if (welcomeBadge)
            welcomeBadge.textContent = String(data.count);
        if (overviewBadge)
            overviewBadge.textContent = String(data.count);
        const html = renderDueKanjiList(data.due);
        const welcomeList = document.getElementById('welcome-due-list');
        const overviewList = document.getElementById('overview-due-list');
        if (welcomeList) {
            welcomeList.innerHTML = html;
            attachDueKanjiClicks(welcomeList);
        }
        if (overviewList) {
            overviewList.innerHTML = html;
            attachDueKanjiClicks(overviewList);
        }
    }
    catch (err) {
        console.error('Due kanji fetch failed:', err);
    }
}
function renderDueKanjiList(due) {
    if (due.length === 0) {
        return '<p class="recent-empty">No kanji due for review.</p>';
    }
    return due.map(k => {
        const lvl = (k.level ?? 'unknown').toLowerCase().replace(/\s+/g, '');
        const readings = [k.onyomi, k.kunyomi].filter(Boolean).join(' ・ ');
        return '<div class="due-kanji-row">' +
            '<span class="due-kanji-char" title="View details">' + k.kanji + '</span>' +
            '<div class="due-kanji-info">' +
            '<span class="due-kanji-meaning">' + (k.meaning ?? '') + '</span>' +
            '<span class="due-kanji-readings">' + readings + '</span>' +
            '</div>' +
            '<span class="recent-level recent-level-' + lvl + '">' + (k.level ?? 'Unknown') + '</span>' +
            (k.new ? '<span class="due-kanji-new">New</span>' : '') +
            '</div>';
    }).join('');
}
function attachDueKanjiClicks(container) {
    container.querySelectorAll('.due-kanji-char').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => openKanjiDetail(el.textContent ?? ''));
    });
}
