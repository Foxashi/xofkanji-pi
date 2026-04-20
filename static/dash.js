import { loadStats } from './dash/stats.js';
import { loadLastfm, initLastfmForm } from './dash/lastfm.js';
import { loadDisplay, initDisplayButtons } from './dash/display.js';
import { loadThemes } from './dash/themes.js';
import { loadRecent } from './dash/recent.js';
import { initPractice } from './dash/practice.js';

const REFRESH_INTERVAL = 5000;

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.dash-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.section;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            sections.forEach(s => {
                s.style.display = s.id === target ? 'flex' : 'none';
            });
        });
    });

    document.getElementById('level-modal-close')?.addEventListener('click', () => {
        document.getElementById('level-modal').style.display = 'none';
    });
    document.getElementById('level-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.style.display = 'none';
    });

    // Initialize modules
    loadStats();
    loadLastfm();
    initLastfmForm();
    loadDisplay();
    initDisplayButtons();
    loadRecent();
    loadThemes();
    initPractice();

    setInterval(loadStats, REFRESH_INTERVAL);
    setInterval(loadDisplay, REFRESH_INTERVAL);
});

