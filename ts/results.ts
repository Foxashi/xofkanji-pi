import type { UploadResponse } from './types.js';
import { initJishoModal, lookupJisho } from './dash/jisho.js';

let form: HTMLFormElement | null = null;

export function init(formElement: HTMLFormElement): void {
    form = formElement;
    initJishoModal();
}

export function displayResults(data: UploadResponse): void {
    removeResultsContainer();

    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'results-container';
    resultsContainer.className = 'results-container results-success';

    const successMsg = document.createElement('h3');
    successMsg.className = 'results-title';
    successMsg.textContent = `✓ Successfully Added ${data.kanji.length} Kanji`;

    const kanjiList = document.createElement('div');
    kanjiList.className = 'results-kanji-list';

    data.kanji.forEach(kanji => {
        const badge = document.createElement('span');
        badge.className = 'results-kanji-badge jisho-clickable';
        badge.textContent = kanji;
        badge.title = 'Look up on Jisho';
        badge.addEventListener('click', () => lookupJisho(kanji));
        kanjiList.appendChild(badge);
    });

    const timeInfo = document.createElement('p');
    timeInfo.className = 'results-time';
    timeInfo.textContent = `Scan completed in ${data.time}s`;

    resultsContainer.appendChild(successMsg);
    resultsContainer.appendChild(kanjiList);
    resultsContainer.appendChild(timeInfo);

    form?.appendChild(resultsContainer);
    console.log('Results displayed');
}

export function displayPartialResults(data: UploadResponse): void {
    removeResultsContainer();

    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'results-container';
    resultsContainer.className = 'results-container results-warning';

    const notice = document.createElement('h3');
    notice.className = 'results-title';
    notice.textContent = '⚠ Kanji Already in Database';

    const kanjiList = document.createElement('div');
    kanjiList.className = 'results-kanji-list';

    data.kanji.forEach(kanji => {
        const badge = document.createElement('span');
        badge.className = 'results-kanji-badge jisho-clickable';
        badge.textContent = kanji;
        badge.title = 'Look up on Jisho';
        badge.addEventListener('click', () => lookupJisho(kanji));
        kanjiList.appendChild(badge);
    });

    resultsContainer.appendChild(notice);
    resultsContainer.appendChild(kanjiList);

    form?.appendChild(resultsContainer);
    console.log('Partial results displayed');
}

export function removeResultsContainer(): void {
    const existing = document.getElementById('results-container');
    if (existing) {
        existing.remove();
        console.log('Results removed');
    }
}
