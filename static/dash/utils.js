export function updateValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    const str = String(value);
    if (el.textContent !== str) {
        el.textContent = str;
        el.classList.add("updated");
        setTimeout(() => el.classList.remove("updated"), 600);
    }
}

export async function fetchJson(url, options) {
    const res = await fetch(url, options);
    return res.json();
}

export function normalizeReading(str) {
    return String(str || "").trim()
        .replace(/[\s,、，/／・.．·]+/g, "・")
        .replace(/^・|・$/g, "");
}

export function readingsMatch(input, expected) {
    if (!expected) return true;
    if (!input && expected) return false;

    const normInput = normalizeReading(input);
    const normExpected = normalizeReading(expected);
    if (normInput === normExpected) return true;

    const inputParts = normInput.split("・").filter(Boolean);
    const expectedParts = normExpected.split("・").filter(Boolean);
    return inputParts.some(ip => expectedParts.includes(ip));
}

export const rgb = (c) => "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
