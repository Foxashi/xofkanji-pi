export function updateValue(id, value) {
    const el = document.getElementById(id);
    if (!el)
        return;
    const str = String(value);
    if (el.textContent !== str) {
        el.textContent = str;
        el.classList.add('updated');
        setTimeout(() => el.classList.remove('updated'), 600);
    }
}
export async function fetchJson(url, options) {
    const res = await fetch(url, options);
    return res.json();
}
function toKatakana(str) {
    return str.replace(/[\u3041-\u3096]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}
function normalizeScript(str) {
    return toKatakana(str).toLowerCase();
}
export function normalizeReading(str) {
    return String(str || '')
        .trim()
        .replace(/[\s,、，/／・.．·]+/g, '・')
        .replace(/^・|・$/g, '');
}
export function readingsMatch(input, expected) {
    if (!expected)
        return true;
    if (!input && expected)
        return false;
    const normInput = normalizeReading(input);
    const normExpected = normalizeReading(expected);
    if (normalizeScript(normInput) === normalizeScript(normExpected))
        return true;
    const inputParts = normInput.split('・').filter(Boolean);
    const expectedParts = normExpected.split('・').filter(Boolean);
    return inputParts.some(ip => expectedParts.some(ep => normalizeScript(ip) === normalizeScript(ep)));
}
export const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
export function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
