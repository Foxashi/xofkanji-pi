import type { VocabItem, VocabData } from '../types.js';
import { lookupJisho } from './jisho.js';
import { escapeHtml } from './utils.js';


let allVocab: VocabItem[] = [];
let activeLevel = 'all';
let searchQuery = '';
let isLoading = false;
let currentPage = 1;
const PAGE_SIZE = 24;

function getFiltered(): VocabItem[] {
    let list = allVocab;
    if (activeLevel !== 'all') {
        list = list.filter(item => (item.levels ?? []).includes(activeLevel));
    }
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(item =>
            (item.word ?? '').toLowerCase().includes(q) ||
            (item.reading ?? '').toLowerCase().includes(q) ||
            (item.meaning ?? '').toLowerCase().includes(q)
        );
    }
    return list;
}

function getPageCount(filtered: VocabItem[]): number {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
}

function getCurrentPageItems(filtered: VocabItem[]): VocabItem[] {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
}

function updateMeta(): void {
    const meta = document.getElementById('vocab-meta');
    if (!meta) return;
    if (allVocab.length === 0) {
        meta.textContent = 'Words from your kanji database';
        return;
    }
    const filtered = getFiltered();
    const shown = filtered.length;
    const total = allVocab.length;
    const pageCount = getPageCount(filtered);
    meta.textContent = (shown === total
        ? `${total} words in your database`
        : `${shown} of ${total} words`) + (pageCount > 1 ? ` | Page ${currentPage} of ${pageCount}` : '');
}

function renderVocabularyRows(list: VocabItem[]): string {
    if (!Array.isArray(list) || list.length === 0) {
        return '<p class="recent-empty">No vocabulary matches your current filters.</p>';
    }

    let html = '<div class="vocab-grid">';
    list.forEach(item => {
        const levelBadges = (item.levels ?? []).map(lvl => {
            const cls = 'recent-level-' + String(lvl ?? 'unknown').toLowerCase();
            return '<span class="recent-level ' + cls + '">' + escapeHtml(lvl ?? '?') + '</span>';
        }).join('');

        const kanjiChips = (item.stroke_order ?? []).map(stroke =>
            '<button class="kanji-stroke-chip" data-kanji="' + escapeHtml(stroke.kanji) +
            '" data-svg="' + escapeHtml(stroke.svg_url) + '">' + escapeHtml(stroke.kanji) + '</button>'
        ).join('');

        html += '<article class="vocab-card">' +
            '<div class="vocab-main">' +
                '<ruby class="vocab-word jisho-clickable" data-word="' + escapeHtml(item.word) + '">' + escapeHtml(item.word) + '<rt>' + escapeHtml(item.reading) + '</rt></ruby>' +
                '<div class="vocab-meaning">' + escapeHtml(item.meaning) + '</div>' +
            '</div>' +
            '<div class="vocab-meta-row">' +
                '<div class="vocab-levels">' + levelBadges + '</div>' +
                (kanjiChips ? '<div class="vocab-kanji-chips">' + kanjiChips + '</div>' : '') +
            '</div>' +
        '</article>';
    });
    html += '</div>';
    return html;
}

function applyFilter(): void {
    const container = document.getElementById('vocab-list');
    if (!container) return;
    const filtered = getFiltered();
    const pageCount = getPageCount(filtered);
    if (currentPage > pageCount) currentPage = pageCount;
    if (currentPage < 1) currentPage = 1;
    const pageItems = getCurrentPageItems(filtered);
    container.innerHTML = renderVocabularyRows(pageItems) + renderPagination(filtered);
    container.querySelectorAll<HTMLButtonElement>('.kanji-stroke-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            openStrokeModal(chip.dataset.kanji ?? '', chip.dataset.svg ?? '');
        });
    });
    container.querySelectorAll<HTMLElement>('.vocab-word').forEach(el => {
        el.title = 'Look up on Jisho';
        el.addEventListener('click', () => lookupJisho(el.dataset.word ?? ''));
    });
    // Pagination controls
    const prevBtn = document.getElementById('vocab-page-prev');
    const nextBtn = document.getElementById('vocab-page-next');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                applyFilter();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < getPageCount(filtered)) {
                currentPage++;
                applyFilter();
            }
        });
    }
    updateMeta();
}

function renderPagination(filtered: VocabItem[]): string {
    const pageCount = getPageCount(filtered);
    if (pageCount <= 1) return '';
    return `
        <div class="vocab-pagination">
            <button id="vocab-page-prev" ${currentPage === 1 ? 'disabled' : ''}>&lt; Prev</button>
            <span>Page ${currentPage} of ${pageCount}</span>
            <button id="vocab-page-next" ${currentPage === pageCount ? 'disabled' : ''}>Next &gt;</button>
        </div>
    `;
}

async function openStrokeModal(kanji: string, svgUrl: string): Promise<void> {
    const modal = document.getElementById('stroke-modal');
    const svgContainer = document.getElementById('stroke-modal-svg');
    const title = document.getElementById('stroke-modal-kanji');
    if (!modal || !svgContainer) return;

    modal.style.display = 'flex';
    if (title) title.textContent = kanji;
    svgContainer.innerHTML = '<p class="stroke-modal-loading">Loading stroke order…</p>';

    try {
        const res = await fetch(svgUrl);
        if (!res.ok) throw new Error('SVG fetch failed');
        const svgText = await res.text();
        const clean = svgText.replace(/<\?xml[^>]*\?>/, '').trim();
        svgContainer.innerHTML = clean;
        const svgEl = svgContainer.querySelector('svg');
        if (svgEl) {
            svgEl.removeAttribute('width');
            svgEl.removeAttribute('height');
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
        }
    } catch {
        svgContainer.innerHTML = '<p class="stroke-modal-loading">Could not load stroke order.</p>';
    }
}

export async function loadVocabulary(): Promise<void> {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('vocab-list');
    const meta = document.getElementById('vocab-meta');
    const refreshBtn = document.getElementById('vocab-refresh-btn') as HTMLButtonElement | null;
    if (!container || !meta) { isLoading = false; return; }

    if (refreshBtn) { refreshBtn.disabled = true; }
    container.innerHTML = '<p class="recent-empty">Loading vocabulary from your database…</p>';
    meta.textContent = 'Loading…';

    try {
        const res = await fetch('/api/vocabulary');
        const data = await res.json() as VocabData;
        allVocab = data.vocabulary ?? [];
        applyFilter();
    } catch (err) {
        console.error('Vocabulary fetch failed:', err);
        meta.textContent = '';
        container.innerHTML = '<p class="recent-empty">Failed to load vocabulary. Please try again.</p>';
    } finally {
        isLoading = false;
        if (refreshBtn) { refreshBtn.disabled = false; }
    }
}

export function initVocabulary(): void {
    // Stroke order modal
    const strokeModal = document.getElementById('stroke-modal');
    document.getElementById('stroke-modal-close')?.addEventListener('click', () => {
        if (strokeModal) strokeModal.style.display = 'none';
    });
    strokeModal?.addEventListener('click', (e: MouseEvent) => {
        if (e.target === strokeModal) strokeModal.style.display = 'none';
    });

    // Refresh button
    document.getElementById('vocab-refresh-btn')?.addEventListener('click', () => {
        allVocab = [];
        loadVocabulary();
    });

    // Search
    const searchInput = document.getElementById('vocab-search') as HTMLInputElement | null;
    searchInput?.addEventListener('input', () => {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        applyFilter();
    });

    // Level pills
    document.querySelectorAll<HTMLButtonElement>('#vocab-level-pills .level-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll<HTMLButtonElement>('#vocab-level-pills .level-pill')
                .forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeLevel = pill.dataset.level ?? 'all';
            currentPage = 1;
            applyFilter();
        });
    });

    // Auto-load on nav click
    const vocabNav = document.querySelector('.nav-item[data-section="vocabulary"]');
    if (vocabNav) {
        vocabNav.addEventListener('click', () => {
            if (allVocab.length === 0 && !isLoading) loadVocabulary();
        });
    }
}
