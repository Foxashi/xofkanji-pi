import { fetchJson } from './utils.js';
import type { LastfmConfig } from '../types.js';

export async function loadLastfm(): Promise<void> {
    try {
        const data = await fetchJson<LastfmConfig>('/api/lastfm');
        (document.getElementById('lastfm-key') as HTMLInputElement).value = data.api_key ?? '';
        (document.getElementById('lastfm-secret') as HTMLInputElement).value = data.api_secret ?? '';
        (document.getElementById('lastfm-user') as HTMLInputElement).value = data.username ?? '';
    } catch (err) {
        console.error('Last.fm config fetch failed:', err);
    }
}

export function initLastfmForm(): void {
    const form = document.getElementById('lastfm-form') as HTMLFormElement | null;
    if (!form) return;

    form.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        const msg = document.getElementById('lastfm-msg');

        const body = {
            api_key: (document.getElementById('lastfm-key') as HTMLInputElement).value,
            api_secret: (document.getElementById('lastfm-secret') as HTMLInputElement).value,
            username: (document.getElementById('lastfm-user') as HTMLInputElement).value,
        };

        try {
            const res = await fetch('/api/lastfm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json() as { success: boolean; message: string };

            if (msg) {
                msg.style.display = 'block';
                msg.className = 'form-message ' + (data.success ? 'success' : 'error');
                msg.textContent = data.message;
                setTimeout(() => { msg.style.display = 'none'; }, 4000);
            }
        } catch (err) {
            if (msg) {
                msg.style.display = 'block';
                msg.className = 'form-message error';
                msg.textContent = 'Connection failed.';
            }
        }
    });
}
