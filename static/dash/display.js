import { fetchJson } from './utils.js';

export async function loadDisplay() {
    try {
        const data = await fetchJson('/api/display');
        const dot = document.getElementById('display-dot');
        const label = document.getElementById('display-status-text');
        const kanjiCard = document.getElementById('current-kanji-card');
        const offlineCard = document.getElementById('display-offline-card');

        if (!dot || !label) return;

        if (data.running) {
            dot.className = 'status-dot online';
            label.textContent = 'Running';
            if (kanjiCard) kanjiCard.style.display = 'flex';
            if (offlineCard) offlineCard.style.display = 'none';

            document.getElementById('current-kanji').textContent = data.kanji || '';
            document.getElementById('current-level').textContent = data.level || '';
            document.getElementById('current-onyomi').textContent = data.onyomi || '';
            document.getElementById('current-kunyomi').textContent = data.kunyomi || '';
            document.getElementById('current-meaning').textContent = data.meaning || '';
        } else {
            dot.className = 'status-dot offline';
            label.textContent = 'Stopped';
            if (kanjiCard) kanjiCard.style.display = 'none';
            if (offlineCard) offlineCard.style.display = 'block';
        }
    } catch (err) {
        console.error('Display state fetch failed:', err);
    }
}

export async function sendDisplayAction(action) {
    try {
        const res = await fetch('/api/display/' + action, { method: 'POST' });
        const data = await res.json();
        setTimeout(loadDisplay, 1500);
    } catch (err) {
        console.error('Display action failed:', err);
    }
}

export function initDisplayButtons() {
    const restart = document.getElementById('btn-restart');
    const stop = document.getElementById('btn-stop');
    if (restart) restart.addEventListener('click', (e) => { e.preventDefault(); sendDisplayAction('restart'); });
    if (stop) stop.addEventListener('click', (e) => { e.preventDefault(); sendDisplayAction('stop'); });
}
