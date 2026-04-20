import { readingsMatch } from './utils.js';

const practiceState = {
    current: null,
    streak: 0,
    correct: 0,
    wrong: 0,
    revealed: false,
    levels: []
};

const practiceEls = {
    kanji: () => document.getElementById('practice-kanji'),
    meaning: () => document.getElementById('practice-meaning'),
    level: () => document.getElementById('practice-level'),
    onyomi: () => document.getElementById('practice-onyomi'),
    kunyomi: () => document.getElementById('practice-kunyomi'),
    onyomiCheck: () => document.getElementById('practice-onyomi-check'),
    kunyomiCheck: () => document.getElementById('practice-kunyomi-check'),
    streak: () => document.getElementById('practice-streak'),
    correctEl: () => document.getElementById('practice-correct'),
    wrongEl: () => document.getElementById('practice-wrong'),
    accuracy: () => document.getElementById('practice-accuracy'),
    submitBtn: () => document.getElementById('practice-submit'),
    skipBtn: () => document.getElementById('practice-skip'),
    nextBtn: () => document.getElementById('practice-next'),
    answer: () => document.getElementById('practice-answer'),
    answerOnyomi: () => document.getElementById('practice-answer-onyomi'),
    answerKunyomi: () => document.getElementById('practice-answer-kunyomi'),
    kanjiDisplay: () => document.querySelector('.practice-kanji-display')
};

function updatePracticeStats() {
    const els = practiceEls;
    els.streak().textContent = practiceState.streak;
    els.correctEl().textContent = practiceState.correct;
    els.wrongEl().textContent = practiceState.wrong;
    const total = practiceState.correct + practiceState.wrong;
    els.accuracy().textContent = total > 0 ? Math.round(practiceState.correct / total * 100) + '%' : '\u2014';
}

function showAnswer() {
    const k = practiceState.current;
    practiceEls.answerOnyomi().textContent = k.onyomi || '\u2014';
    practiceEls.answerKunyomi().textContent = k.kunyomi || '\u2014';
    practiceEls.answer().style.display = 'flex';
}

function setFieldResult(inputEl, checkEl, isCorrect, isSkipped) {
    inputEl.classList.remove('correct','wrong','skipped');
    checkEl.classList.remove('visible');
    checkEl.textContent = '';
    if (isSkipped) {
        inputEl.classList.add('skipped');
        checkEl.textContent = '—';
        checkEl.classList.add('visible');
    } else if (isCorrect) {
        inputEl.classList.add('correct');
        checkEl.textContent = '✓';
        checkEl.style.color = '#a6da95';
        checkEl.classList.add('visible');
    } else {
        inputEl.classList.add('wrong');
        checkEl.textContent = '✗';
        checkEl.style.color = '#ed8796';
        checkEl.classList.add('visible');
    }
}

function lockInputs() {
    practiceEls.onyomi().readOnly = true;
    practiceEls.kunyomi().readOnly = true;
    practiceState.revealed = true;
    practiceEls.submitBtn().style.display = 'none';
    practiceEls.skipBtn().style.display = 'none';
    practiceEls.nextBtn().style.display = '';
}

export function checkPractice() {
    if (practiceState.revealed || !practiceState.current) return;
    const k = practiceState.current;
    const onOk = readingsMatch(practiceEls.onyomi().value, k.onyomi);
    const kunOk = readingsMatch(practiceEls.kunyomi().value, k.kunyomi);

    setFieldResult(practiceEls.onyomi(), practiceEls.onyomiCheck(), onOk, false);
    setFieldResult(practiceEls.kunyomi(), practiceEls.kunyomiCheck(), kunOk, false);

    if (onOk && kunOk) {
        practiceState.correct++;
        practiceState.streak++;
    } else {
        practiceState.wrong++;
        practiceState.streak = 0;
    }

    updatePracticeStats();
    showAnswer();
    lockInputs();
    practiceEls.nextBtn().focus();
}

export function skipPractice() {
    if (practiceState.revealed || !practiceState.current) return;

    setFieldResult(practiceEls.onyomi(), practiceEls.onyomiCheck(), false, true);
    setFieldResult(practiceEls.kunyomi(), practiceEls.kunyomiCheck(), false, true);

    practiceState.wrong++;
    practiceState.streak = 0;
    updatePracticeStats();
    showAnswer();
    lockInputs();
    practiceEls.nextBtn().focus();
}

export async function loadPracticeKanji() {
    practiceState.revealed = false;
    const els = practiceEls;

    // Reset UI
    els.onyomi().value = '';
    els.kunyomi().value = '';
    els.onyomi().readOnly = false;
    els.kunyomi().readOnly = false;
    els.onyomi().classList.remove('correct','wrong','skipped');
    els.kunyomi().classList.remove('correct','wrong','skipped');
    els.onyomiCheck().classList.remove('visible');
    els.kunyomiCheck().classList.remove('visible');
    els.answer().style.display = 'none';
    els.submitBtn().style.display = '';
    els.skipBtn().style.display = '';
    els.nextBtn().style.display = 'none';

    try {
        const url = practiceState.levels.length > 0
            ? '/api/random-kanji?levels=' + encodeURIComponent(practiceState.levels.join(','))
            : '/api/random-kanji';
        const res = await fetch(url);
        const data = await res.json();
        practiceState.current = data;

        els.kanji().textContent = data.kanji;
        els.meaning().textContent = data.meaning || '';
        els.level().textContent = data.level || '';

        // Animate
        const disp = els.kanjiDisplay();
        disp.classList.remove('animate');
        void disp.offsetWidth;
        disp.classList.add('animate');

        els.onyomi().focus();
    } catch (err) {
        console.error('Practice kanji fetch failed:', err);
    }
}

export function initPractice() {
    document.querySelectorAll('.level-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const level = pill.dataset.level;
            if (level === 'all') {
                practiceState.levels = [];
                document.querySelectorAll('.level-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            } else {
                document.querySelector('.level-pill[data-level="all"]').classList.remove('active');
                pill.classList.toggle('active');
                const active = document.querySelectorAll('.level-pill.active:not([data-level="all"])');
                practiceState.levels = Array.from(active).map(p => p.dataset.level);
                if (practiceState.levels.length === 0) {
                    document.querySelector('.level-pill[data-level="all"]').classList.add('active');
                }
            }
            loadPracticeKanji();
        });
    });

    if (practiceEls.submitBtn()) {
        practiceEls.submitBtn().addEventListener('click', checkPractice);
        practiceEls.skipBtn().addEventListener('click', skipPractice);
        practiceEls.nextBtn().addEventListener('click', loadPracticeKanji);

        document.addEventListener('keydown', (e) => {
            const section = document.getElementById('practice');
            if (!section || section.style.display === 'none') return;

            if (e.key === 'Enter') {
                if (practiceState.revealed) loadPracticeKanji(); else checkPractice();
                e.preventDefault();
            }
            if (e.key === 'Escape' && !practiceState.revealed) {
                skipPractice();
                e.preventDefault();
            }
        });

        practiceEls.onyomi().addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                practiceEls.kunyomi().focus();
            }
        });

        const practiceNav = document.querySelector('.nav-item[data-section="practice"]');
        if (practiceNav) {
            practiceNav.addEventListener('click', () => {
                if (!practiceState.current) loadPracticeKanji();
            });
        }
    }
}
