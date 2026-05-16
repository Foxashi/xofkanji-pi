import { fetchJson } from './utils.js';
export async function loadDisplay() {
    try {
        const data = await fetchJson('/api/display');
        const dot = document.getElementById('display-dot');
        const label = document.getElementById('display-status-text');
        const kanjiCard = document.getElementById('current-kanji-card');
        const offlineCard = document.getElementById('display-offline-card');
        const startBtn = document.getElementById('btn-restart');
        const stopBtn = document.getElementById('btn-stop');
        if (!dot || !label)
            return;
        if (data.running) {
            dot.className = 'status-dot online';
            label.textContent = 'Running';
            if (kanjiCard)
                kanjiCard.style.display = 'flex';
            if (offlineCard)
                offlineCard.style.display = 'none';
            document.getElementById('current-kanji').textContent = data.kanji ?? '';
            document.getElementById('current-level').textContent = data.level ?? '';
            document.getElementById('current-onyomi').textContent = data.onyomi ?? '';
            document.getElementById('current-kunyomi').textContent = data.kunyomi ?? '';
            document.getElementById('current-meaning').textContent = data.meaning ?? '';
            if (startBtn)
                startBtn.disabled = true;
            if (stopBtn)
                stopBtn.disabled = false;
        }
        else {
            dot.className = 'status-dot offline';
            label.textContent = 'Stopped';
            if (kanjiCard)
                kanjiCard.style.display = 'none';
            if (offlineCard)
                offlineCard.style.display = 'block';
            if (startBtn)
                startBtn.disabled = false;
            if (stopBtn)
                stopBtn.disabled = true;
        }
    }
    catch (err) {
        console.error('Display state fetch failed:', err);
    }
}
export async function sendDisplayAction(action) {
    const startBtn = document.getElementById('btn-restart');
    const stopBtn = document.getElementById('btn-stop');
    if (action === 'restart' && startBtn)
        startBtn.disabled = true;
    if (action === 'stop' && stopBtn)
        stopBtn.disabled = true;
    try {
        await fetch('/api/display/' + action, { method: 'POST' });
        setTimeout(loadDisplay, 1500);
    }
    catch (err) {
        console.error('Display action failed:', err);
        // Re-enable buttons if request failed
        if (action === 'restart' && startBtn)
            startBtn.disabled = false;
        if (action === 'stop' && stopBtn)
            stopBtn.disabled = false;
    }
}
export function initDisplayButtons() {
    const restart = document.getElementById('btn-restart');
    const stop = document.getElementById('btn-stop');
    if (restart)
        restart.addEventListener('click', (e) => { e.preventDefault(); sendDisplayAction('restart'); });
    if (stop)
        stop.addEventListener('click', (e) => { e.preventDefault(); sendDisplayAction('stop'); });
}
