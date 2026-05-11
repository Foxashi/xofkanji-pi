import { loadStats } from './dash/stats.js';
import { loadLastfm, initLastfmForm } from './dash/lastfm.js';
import { loadDisplay, initDisplayButtons } from './dash/display.js';
import { loadThemes, initCreateTheme } from './dash/themes.js';
import { loadRecent } from './dash/recent.js';
import { initPractice } from './dash/practice.js';
import { initVocabulary } from './dash/vocab.js';
import { initJishoModal } from './dash/jisho.js';
import { loadWelcome, initWelcomeJisho } from './dash/welcome.js';
import { initKanjiDetailModal } from './dash/kanji-detail.js';

const REFRESH_INTERVAL = 5000;

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll<HTMLElement>('.nav-item[data-section]');
    const sections = document.querySelectorAll<HTMLElement>('.dash-section');

    function navigateTo(target: string): void {
        navItems.forEach(n => n.classList.remove('active'));
        const matching = document.querySelector<HTMLElement>(`.nav-item[data-section="${target}"]`);
        if (matching) matching.classList.add('active');
        sections.forEach(s => {
            s.style.display = s.id === target ? 'flex' : 'none';
        });
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e: Event) => {
            e.preventDefault();
            const target = item.dataset.section;
            if (target) navigateTo(target);
        });
    });

    document.querySelectorAll<HTMLElement>('.welcome-card[data-section]').forEach(card => {
        card.addEventListener('click', (e: Event) => {
            e.preventDefault();
            const target = card.dataset.section;
            if (target) navigateTo(target);
        });
    });

    document.getElementById('level-modal-close')?.addEventListener('click', () => {
        const modal = document.getElementById('level-modal');
        if (modal) modal.style.display = 'none';
    });
    document.getElementById('level-modal')?.addEventListener('click', (e: MouseEvent) => {
        if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).style.display = 'none';
    });

    // Initialize modules
    loadWelcome();
    initWelcomeJisho();
    loadStats();
    loadLastfm();
    initLastfmForm();
    loadDisplay();
    initDisplayButtons();
    loadRecent();
    loadThemes();
    initCreateTheme();
    initPractice();
    initVocabulary();
    initJishoModal();
    initKanjiDetailModal();

    setInterval(loadWelcome, REFRESH_INTERVAL);
    setInterval(loadStats, REFRESH_INTERVAL);
    setInterval(loadDisplay, REFRESH_INTERVAL);
});
