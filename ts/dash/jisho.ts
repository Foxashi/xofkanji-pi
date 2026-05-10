interface JishoSense {
    english_definitions: string[];
    parts_of_speech: string[];
    tags: string[];
    info: string[];
}

interface JishoJapanese {
    word?: string;
    reading?: string;
}

interface JishoEntry {
    slug: string;
    japanese: JishoJapanese[];
    senses: JishoSense[];
    is_common: boolean;
    jlpt: string[];
}

interface JishoResponse {
    data: JishoEntry[];
}

function escapeHtml(str: string | undefined | null): string {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const KANJI_RE = /[\u4E00-\u9FFF]/g;

function kanjiVgUrl(char: string): string {
    const code = (char.codePointAt(0) ?? 0).toString(16).padStart(5, '0');
    return 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/' + code + '.svg';
}

function fetchStrokeOrder(bodyEl: HTMLElement, chars: string[]): void {
    bodyEl.querySelectorAll<HTMLElement>('.jisho-stroke-item').forEach((item, i) => {
        const char = chars[i];
        if (!char) return;
        fetch(kanjiVgUrl(char))
            .then(r => { if (!r.ok) throw new Error(); return r.text(); })
            .then(svgText => {
                const clean = svgText.replace(/<\?xml[^>]*\?>/, '').trim();
                item.innerHTML = clean;
                const svgEl = item.querySelector('svg');
                if (svgEl) {
                    svgEl.removeAttribute('width');
                    svgEl.removeAttribute('height');
                }
            })
            .catch(() => { item.innerHTML = '<span class="jisho-stroke-loading">—</span>'; });
    });
}

export function initJishoModal(): void {
    const modal = document.getElementById('jisho-modal');
    document.getElementById('jisho-modal-close')?.addEventListener('click', closeJishoModal);
    modal?.addEventListener('click', (e: MouseEvent) => {
        if (e.target === modal) closeJishoModal();
    });
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            const m = document.getElementById('jisho-modal');
            if (m && m.style.display !== 'none') closeJishoModal();
        }
    });
}

export function closeJishoModal(): void {
    const modal = document.getElementById('jisho-modal');
    if (modal) modal.style.display = 'none';
}

export async function lookupJisho(query: string): Promise<void> {
    const modal = document.getElementById('jisho-modal');
    const titleEl = document.getElementById('jisho-modal-title');
    const bodyEl = document.getElementById('jisho-modal-body');
    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.textContent = query;
    bodyEl.innerHTML = '<p class="jisho-loading">Looking up…</p>';
    modal.style.display = 'flex';

    const kanjiChars = [...new Set(Array.from(query.match(KANJI_RE) ?? []))];
    const strokesHtml = kanjiChars.length > 0
        ? '<div class="jisho-strokes">' +
          kanjiChars.map(() => '<div class="jisho-stroke-item"><span class="jisho-stroke-loading">…</span></div>').join('') +
          '</div>'
        : '';

    try {
        const res = await fetch('/api/jisho?keyword=' + encodeURIComponent(query));
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json() as JishoResponse;

        if (!data.data || data.data.length === 0) {
            bodyEl.innerHTML = strokesHtml + '<p class="jisho-empty">No results found.</p>';
            fetchStrokeOrder(bodyEl, kanjiChars);
            return;
        }

        const entries = data.data.slice(0, 5);
        let html = strokesHtml + '<div class="jisho-entries">';

        entries.forEach(entry => {
            const jp = entry.japanese[0] ?? {};
            const word = jp.word ?? jp.reading ?? query;
            const reading = jp.word ? (jp.reading ?? '') : '';
            const jlpt = entry.jlpt.length > 0
                ? entry.jlpt.map(j => j.replace('jlpt-', '').toUpperCase()).join(', ')
                : null;

            html += '<div class="jisho-entry">';
            html += '<div class="jisho-entry-header">';
            html += '<span class="jisho-word">' + escapeHtml(word) + '</span>';
            if (reading) html += '<span class="jisho-reading">【' + escapeHtml(reading) + '】</span>';
            if (jlpt) html += '<span class="jisho-tag jisho-jlpt">' + escapeHtml(jlpt) + '</span>';
            if (entry.is_common) html += '<span class="jisho-tag jisho-common">common</span>';
            html += '</div>';

            html += '<ol class="jisho-senses">';
            entry.senses.slice(0, 4).forEach(sense => {
                const pos = sense.parts_of_speech.length > 0
                    ? '<span class="jisho-pos">' + escapeHtml(sense.parts_of_speech.join(', ')) + '</span>'
                    : '';
                const defs = escapeHtml(sense.english_definitions.join('; '));
                const extra = sense.info.length > 0
                    ? ' <span class="jisho-info">(' + escapeHtml(sense.info.join(', ')) + ')</span>'
                    : '';
                html += '<li class="jisho-sense">' + pos + defs + extra + '</li>';
            });
            html += '</ol>';
            html += '</div>';
        });

        html += '</div>';
        html += '<p class="jisho-link"><a href="https://jisho.org/search/' +
            encodeURIComponent(query) +
            '" target="_blank" rel="noopener noreferrer">View on Jisho →</a></p>';
        bodyEl.innerHTML = html;
        fetchStrokeOrder(bodyEl, kanjiChars);
    } catch {
        bodyEl.innerHTML = '<p class="jisho-empty">Could not fetch results. Please try again.</p>';
    }
}
