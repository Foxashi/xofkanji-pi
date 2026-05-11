import { fetchJson } from './utils.js';
import { lookupJisho } from './jisho.js';
import type { StatsData, DisplayData, KanjiItem } from '../types.js';

interface DailyData {
    kanji: KanjiItem | null;
}

export function initWelcomeJisho(): void {
    const charEl = document.getElementById('welcome-kotd-char');
    charEl?.addEventListener('click', () => {
        const text = charEl.textContent?.trim();
        if (text && text !== '—') lookupJisho(text);
    });
}

export async function loadWelcome(): Promise<void> {
    try {
        const [stats, display, daily] = await Promise.all([
            fetchJson<StatsData>('/api/stats'),
            fetchJson<DisplayData>('/api/display'),
            fetchJson<DailyData>('/api/daily'),
        ]);

        const totalEl = document.getElementById('welcome-total-kanji');
        if (totalEl) totalEl.textContent = String(stats.total_kanji);

        const accuracyEl = document.getElementById('welcome-accuracy');
        if (accuracyEl) accuracyEl.textContent = stats.accuracy + '%';

        const statusEl = document.getElementById('welcome-display-status');
        if (statusEl) {
            statusEl.textContent = display.running ? 'Running' : 'Stopped';
            statusEl.className = 'welcome-status-value ' + (display.running ? 'status-online' : 'status-offline');
        }

        if (daily.kanji) {
            const k = daily.kanji;
            const charEl = document.getElementById('welcome-kotd-char');
            if (charEl) charEl.textContent = k.kanji;
            const levelEl = document.getElementById('welcome-kotd-level');
            if (levelEl) levelEl.textContent = k.level ?? '';
            const onEl = document.getElementById('welcome-kotd-on');
            if (onEl) onEl.textContent = k.onyomi || '—';
            const kunEl = document.getElementById('welcome-kotd-kun');
            if (kunEl) kunEl.textContent = k.kunyomi || '—';
            const meaningEl = document.getElementById('welcome-kotd-meaning');
            if (meaningEl) meaningEl.textContent = k.meaning || '—';
        }
    } catch (err) {
        console.error('Welcome fetch failed:', err);
    }
}
