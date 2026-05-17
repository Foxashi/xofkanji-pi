import { fetchJson } from './utils.js';
function val(id) {
    return document.getElementById(id).value;
}
async function postSettings(body, msgId) {
    const msg = document.getElementById(msgId);
    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (msg) {
            msg.style.display = 'block';
            msg.className = 'form-message ' + (data.success ? 'success' : 'error');
            msg.textContent = data.message;
            setTimeout(() => { msg.style.display = 'none'; }, 4000);
        }
    }
    catch {
        if (msg) {
            msg.style.display = 'block';
            msg.className = 'form-message error';
            msg.textContent = 'Connection failed.';
        }
    }
}
export function initSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-cat');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.querySelectorAll('.settings-panel').forEach(panel => {
                panel.style.display = panel.id === `settings-panel-${target}` ? 'block' : 'none';
            });
        });
    });
}
export async function loadTimingSettings() {
    try {
        const data = await fetchJson('/api/settings');
        document.getElementById('setting-kanji-change-time').value = String(data.kanji_change_time);
        document.getElementById('setting-lastfm-update-time').value = String(data.lastfm_update_time);
        document.getElementById('setting-failed-interval').value = String(data.failed_interval);
        document.getElementById('setting-max-interval').value = String(data.max_interval);
        document.getElementById('setting-kanji-reload-interval').value = String(data.kanji_reload_interval);
        document.getElementById('setting-theme-reload-interval').value = String(data.theme_reload_interval);
        document.getElementById('setting-srs-ease-factor').value = String(data.srs_ease_factor);
        document.getElementById('setting-screen-width').value = String(data.screen_width);
        document.getElementById('setting-screen-height').value = String(data.screen_height);
    }
    catch (err) {
        console.error('Failed to load settings:', err);
    }
}
export function initTimingForm() {
    document.getElementById('timing-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await postSettings({
            kanji_change_time: parseInt(val('setting-kanji-change-time')),
            lastfm_update_time: parseInt(val('setting-lastfm-update-time')),
            failed_interval: parseInt(val('setting-failed-interval')),
            max_interval: parseInt(val('setting-max-interval')),
            kanji_reload_interval: parseInt(val('setting-kanji-reload-interval')),
            theme_reload_interval: parseInt(val('setting-theme-reload-interval')),
        }, 'timing-msg');
    });
}
export function initSrsForm() {
    document.getElementById('srs-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await postSettings({
            srs_ease_factor: parseFloat(val('setting-srs-ease-factor')),
        }, 'srs-msg');
    });
}
export function initDisplayCfgForm() {
    document.getElementById('display-cfg-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await postSettings({
            screen_width: parseInt(val('setting-screen-width')),
            screen_height: parseInt(val('setting-screen-height')),
        }, 'display-cfg-msg');
    });
}
