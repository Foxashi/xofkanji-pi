import { fetchJson } from './utils.js';

export async function loadLastfm() {
    try {
        const data = await fetchJson('/api/lastfm');
        document.getElementById('lastfm-key').value = data.api_key || '';
        document.getElementById('lastfm-secret').value = data.api_secret || '';
        document.getElementById('lastfm-user').value = data.username || '';
    } catch (err) {
        console.error('Last.fm config fetch failed:', err);
    }
}

export function initLastfmForm() {
    const form = document.getElementById('lastfm-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('lastfm-msg');

        const body = {
            api_key: document.getElementById('lastfm-key').value,
            api_secret: document.getElementById('lastfm-secret').value,
            username: document.getElementById('lastfm-user').value
        };

        try {
            const res = await fetch('/api/lastfm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            msg.style.display = 'block';
            msg.className = 'form-message ' + (data.success ? 'success' : 'error');
            msg.textContent = data.message;
            setTimeout(() => { msg.style.display = 'none'; }, 4000);
        } catch (err) {
            msg.style.display = 'block';
            msg.className = 'form-message error';
            msg.textContent = 'Connection failed.';
        }
    });
}
