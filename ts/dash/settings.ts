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

function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function setupDangerReset(
    btnId: string,
    confirmId: string,
    codeDisplayId: string,
    codeInputId: string,
    confirmBtnId: string,
    cancelBtnId: string,
    msgId: string,
    endpoint: string
): void {
    const btn = document.getElementById(btnId);
    const confirmEl = document.getElementById(confirmId);
    const codeDisplay = document.getElementById(codeDisplayId);
    const codeInput = document.getElementById(codeInputId) as HTMLInputElement | null;
    const confirmBtn = document.getElementById(confirmBtnId);
    const cancelBtn = document.getElementById(cancelBtnId);
    const msg = document.getElementById(msgId);
    if (!btn || !confirmEl || !codeDisplay || !codeInput || !confirmBtn || !cancelBtn) return;

    let currentCode = '';

    btn.addEventListener('click', () => {
        currentCode = generateCode();
        codeDisplay.textContent = currentCode;
        codeInput.value = '';
        confirmEl.style.display = 'block';
        btn.style.display = 'none';
        codeInput.focus();
    });

    cancelBtn.addEventListener('click', () => {
        confirmEl.style.display = 'none';
        btn.style.display = '';
        if (msg) msg.style.display = 'none';
    });

    confirmBtn.addEventListener('click', async () => {
        if (codeInput.value.trim().toUpperCase() !== currentCode) {
            codeInput.classList.add('danger-input-shake');
            setTimeout(() => codeInput.classList.remove('danger-input-shake'), 500);
            return;
        }
        confirmBtn.setAttribute('disabled', 'true');
        try {
            const res = await fetch(endpoint, { method: 'POST' });
            const data = await res.json() as { success: boolean; message: string };
            confirmEl.style.display = 'none';
            btn.style.display = '';
            if (msg) {
                msg.style.display = 'block';
                msg.className = 'form-message ' + (data.success ? 'success' : 'error');
                msg.textContent = data.message;
                setTimeout(() => { if (msg) msg.style.display = 'none'; }, 5000);
            }
        } catch {
            if (msg) {
                msg.style.display = 'block';
                msg.className = 'form-message error';
                msg.textContent = 'Connection failed.';
            }
        } finally {
            confirmBtn.removeAttribute('disabled');
        }
    });
}

export function initDangerZone(): void {
    setupDangerReset(
        'danger-reset-stats-btn',
        'danger-reset-stats-confirm',
        'danger-reset-stats-code',
        'danger-reset-stats-input',
        'danger-reset-stats-ok',
        'danger-reset-stats-cancel',
        'danger-reset-stats-msg',
        '/api/reset/stats'
    );
    setupDangerReset(
        'danger-reset-kanji-btn',
        'danger-reset-kanji-confirm',
        'danger-reset-kanji-code',
        'danger-reset-kanji-input',
        'danger-reset-kanji-ok',
        'danger-reset-kanji-cancel',
        'danger-reset-kanji-msg',
        '/api/reset/kanji'
    );
}
