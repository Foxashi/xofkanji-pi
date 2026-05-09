import type { VocabItem, VocabData } from '../types.js';

function escapeHtml(str: string | undefined | null): string {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getIntValue(id: string, fallback: number, min: number, max: number): number {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) return fallback;
    const parsed = parseInt(input.value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function renderVocabularyRows(list: VocabItem[]): string {
    if (!Array.isArray(list) || list.length === 0) {
        return '<p class="recent-empty">No matching vocabulary found yet for the kanji in your database.</p>';
    }

    let html = '<div class="vocab-grid">';
    list.forEach(item => {
        const levelBadges = (item.levels ?? []).map(lvl => {
            const cls = 'recent-level-' + String(lvl ?? 'unknown').toLowerCase();
            return '<span class="recent-level ' + cls + '">' + escapeHtml(lvl ?? '?') + '</span>';
        }).join('');

        const strokes = (item.stroke_order ?? []).map(stroke => {
            const label = escapeHtml(stroke.kanji);
            const url = escapeHtml(stroke.svg_url);
            return '<a class="stroke-chip" href="' + url + '" target="_blank" rel="noopener noreferrer" title="Open stroke order for ' + label + '">' +
                '<img class="stroke-preview" src="' + url + '" alt="Stroke order ' + label + '">' +
                '<span class="stroke-label">' + label + '</span>' +
            '</a>';
        }).join('');

        html += '<article class="vocab-card">' +
            '<div class="vocab-main">' +
                '<div class="vocab-word">' + escapeHtml(item.word) + '</div>' +
                '<div class="vocab-reading">' + escapeHtml(item.reading) + '</div>' +
                '<div class="vocab-meaning">' + escapeHtml(item.meaning) + '</div>' +
            '</div>' +
            '<div class="vocab-meta-row">' +
                '<div class="vocab-levels">' + levelBadges + '</div>' +
                '<div class="vocab-strokes">' + strokes + '</div>' +
            '</div>' +
        '</article>';
    });
    html += '</div>';
    return html;
}

export async function loadVocabulary(): Promise<void> {
    const container = document.getElementById('vocab-list');
    const meta = document.getElementById('vocab-meta');
    const button = document.getElementById('vocab-generate-btn') as HTMLButtonElement | null;
    if (!container || !meta || !button) return;

    const limit = getIntValue('vocab-limit', 40, 5, 120);
    const perKanji = getIntValue('vocab-per-kanji', 8, 2, 15);

    button.disabled = true;
    button.textContent = 'Generating...';
    container.innerHTML = '<p class="recent-empty">Building vocabulary from your kanji list...</p>';

    try {
        const url = '/api/vocabulary?limit=' + encodeURIComponent(limit) + '&per_kanji=' + encodeURIComponent(perKanji);
        const res = await fetch(url);
        const data = await res.json() as VocabData;

        const generated = new Date((data.generated_at ?? 0) * 1000);
        const generatedLabel = Number.isNaN(generated.getTime())
            ? 'just now'
            : generated.toLocaleTimeString();

        meta.textContent =
            (data.vocabulary ? data.vocabulary.length : 0) + ' words from ' +
            (data.source_kanji_count ?? 0) + ' known kanji • updated ' + generatedLabel;

        container.innerHTML = renderVocabularyRows(data.vocabulary ?? []);
    } catch (err) {
        console.error('Vocabulary fetch failed:', err);
        meta.textContent = '';
        container.innerHTML = '<p class="recent-empty">Failed to generate vocabulary. Please try again.</p>';
    } finally {
        button.disabled = false;
        button.textContent = 'Generate';
    }
}

export function initVocabulary(): void {
    const button = document.getElementById('vocab-generate-btn') as HTMLButtonElement | null;
    const limitInput = document.getElementById('vocab-limit') as HTMLInputElement | null;
    const perInput = document.getElementById('vocab-per-kanji') as HTMLInputElement | null;
    if (!button || !limitInput || !perInput) return;

    button.addEventListener('click', () => {
        loadVocabulary();
    });

    [limitInput, perInput].forEach(input => {
        input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadVocabulary();
            }
        });
    });

    const vocabNav = document.querySelector('.nav-item[data-section="vocabulary"]');
    if (vocabNav) {
        vocabNav.addEventListener('click', () => {
            const listEl = document.getElementById('vocab-list') as HTMLElement | null;
            if (!listEl || listEl.dataset.loaded === '1') return;
            listEl.dataset.loaded = '1';
            loadVocabulary();
        });
    }
}
