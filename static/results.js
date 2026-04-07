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
        resultsContainer.style.cssText = `
            margin-top: 30px;
            padding: 20px;
            background: #dcfce7;
            border: 2px solid #22c55e;
            border-radius: 8px;
            animation: slideDown 0.3s ease;
        `;

        const successMsg = document.createElement('h3');
        successMsg.textContent = `✅ Successfully Added ${data.kanji.length} Kanji`;
        successMsg.style.cssText = 'color: #166534; margin-bottom: 15px; font-size: 16px;';

        const kanjiList = document.createElement('div');
        kanjiList.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 15px;
        `;

        data.kanji.forEach(kanji => {
            const badge = document.createElement('span');
            badge.textContent = kanji;
            badge.style.cssText = `
                background: #22c55e;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 18px;
                font-weight: 600;
                min-width: 45px;
                text-align: center;
            `;
            kanjiList.appendChild(badge);
        });

        const timeInfo = document.createElement('p');
        timeInfo.textContent = `⏱️ Scan completed in ${data.time}s`;
        timeInfo.style.cssText = 'color: #166534; font-size: 12px; margin: 0;';

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
        resultsContainer.style.cssText = `
            margin-top: 30px;
            padding: 20px;
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            animation: slideDown 0.3s ease;
        `;

        const notice = document.createElement('h3');
        notice.textContent = `⚠️ Kanji Already in Database`;
        notice.style.cssText = 'color: #92400e; margin-bottom: 15px; font-size: 16px;';

        const kanjiList = document.createElement('div');
        kanjiList.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        `;

        data.kanji.forEach(kanji => {
            const badge = document.createElement('span');
            badge.textContent = kanji;
            badge.style.cssText = `
                background: #f59e0b;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 18px;
                font-weight: 600;
                min-width: 45px;
                text-align: center;
            `;
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

