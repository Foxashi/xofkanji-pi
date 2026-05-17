import { fetchJson } from './utils.js';

interface AllSettings {
    kanji_change_time: number;
    lastfm_update_time: number;
    failed_interval: number;
    max_interval: number;
    kanji_reload_interval: number;
    theme_reload_interval: number;
    srs_ease_factor: number;
    screen_width: number;
    screen_height: number;
}

function val(id: string): string {
    return (document.getElementById(id) as HTMLInputElement).value;
}

async function postSettings(body: Partial<AllSettings>, msgId: string): Promise<void> {
    const msg = document.getElementById(msgId);
    try {
     const res = await fetch('/api/settings', {
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
    } catch {
        if (msg) {
            msg.style.display = 'block';
            msg.className = 'form-message error';
            msg.textContent = 'Connection failed.';
        }
    }
}

export function initSettingsTabs(): void {
    const tabs = document.querySelectorAll<HTMLElement>('.settings-cat');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.querySelectorAll<HTMLElement>('.settings-panel').forEach(panel => {
                panel.style.display = panel.id === `settings-panel-${target}` ? 'block' : 'none';
            });
        });
    });
}

export async function loadTimingSettings(): Promise<void> {
    try {
        const data = await fetchJson<AllSettings>('/api/settings');
        (document.getElementById('setting-kanji-change-time')     as HTMLInputElement).value = String(data.kanji_change_time);
        (document.getElementById('setting-lastfm-update-time')    as HTMLInputElement).value = String(data.lastfm_update_time);
        (document.getElementById('setting-failed-interval')       as HTMLInputElement).value = String(data.failed_interval);
        (document.getElementById('setting-max-interval')          as HTMLInputElement).value = String(data.max_interval);
        (document.getElementById('setting-kanji-reload-interval') as HTMLInputElement).value = String(data.kanji_reload_interval);
        (document.getElementById('setting-theme-reload-interval') as HTMLInputElement).value = String(data.theme_reload_interval);
        (document.getElementById('setting-srs-ease-factor')       as HTMLInputElement).value = String(data.srs_ease_factor);
        (document.getElementById('setting-screen-width')          as HTMLInputElement).value = String(data.screen_width);
        (document.getElementById('setting-screen-height')         as HTMLInputElement).value = String(data.screen_height);
    } catch (err) {
        console.error('Failed to load settings:', err);
    }
}

export function initTimingForm(): void {
    document.getElementById('timing-form')?.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        await postSettings({
            kanji_change_time:     parseInt(val('setting-kanji-change-time')),
            lastfm_update_time:    parseInt(val('setting-lastfm-update-time')),
            failed_interval:       parseInt(val('setting-failed-interval')),
            max_interval:          parseInt(val('setting-max-interval')),
            kanji_reload_interval: parseInt(val('setting-kanji-reload-interval')),
            theme_reload_interval: parseInt(val('setting-theme-reload-interval')),
        }, 'timing-msg');
    });
}

export function initSrsForm(): void {
    document.getElementById('srs-form')?.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        await postSettings({
            srs_ease_factor: parseFloat(val('setting-srs-ease-factor')),
        }, 'srs-msg');
    });
}

export function initDisplayCfgForm(): void {
    document.getElementById('display-cfg-form')?.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        await postSettings({
            screen_width:  parseInt(val('setting-screen-width')),
            screen_height: parseInt(val('setting-screen-height')),
        }, 'display-cfg-msg');
    });
}
