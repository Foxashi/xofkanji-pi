// Results display module - Singleton pattern
const Results = (() => {
    let form = null;

    function init(formElement) {
        form = formElement;
    }

    function displayResults(data) {
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
            badge.className = 'results-kanji-badge';
            badge.textContent = kanji;
            kanjiList.appendChild(badge);
        });

        const timeInfo = document.createElement('p');
        timeInfo.className = 'results-time';
        timeInfo.textContent = `Scan completed in ${data.time}s`;

        resultsContainer.appendChild(successMsg);
        resultsContainer.appendChild(kanjiList);
        resultsContainer.appendChild(timeInfo);

        form.appendChild(resultsContainer);
        console.log('Results displayed');
    }

    function displayPartialResults(data) {
        removeResultsContainer();

        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'results-container';
        resultsContainer.className = 'results-container results-warning';

        const notice = document.createElement('h3');
        notice.className = 'results-title';
        notice.textContent = `⚠ Kanji Already in Database`;

        const kanjiList = document.createElement('div');
        kanjiList.className = 'results-kanji-list';

        data.kanji.forEach(kanji => {
            const badge = document.createElement('span');
            badge.className = 'results-kanji-badge';
            badge.textContent = kanji;
            kanjiList.appendChild(badge);
        });

        resultsContainer.appendChild(notice);
        resultsContainer.appendChild(kanjiList);

        form.appendChild(resultsContainer);
        console.log('Partial results displayed');
    }

    function removeResultsContainer() {
        const existing = document.getElementById('results-container');
        if (existing) {
            existing.remove();
            console.log('Results removed');
        }
    }

    return {
        init,
        displayResults,
        displayPartialResults,
        removeResultsContainer
    };
})();

