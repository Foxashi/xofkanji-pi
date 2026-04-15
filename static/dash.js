document.addEventListener("DOMContentLoaded", () => {
    const REFRESH_INTERVAL = 5000;
    let previousStats = {};

    const navItems = document.querySelectorAll(".nav-item[data-section]");
    const sections = document.querySelectorAll(".dash-section");

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const target = item.dataset.section;
            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");
            sections.forEach(s => {
                s.style.display = s.id === target ? "flex" : "none";
            });
        });
    });

    function updateValue(id, value) {
        const el = document.getElementById(id);
        const str = String(value);
        if (el.textContent !== str) {
            el.textContent = str;
            el.classList.add("updated");
            setTimeout(() => el.classList.remove("updated"), 600);
        }
    }

    async function loadStats() {
        try {
            const res = await fetch("/api/stats");
            const data = await res.json();

            updateValue("stat-total", data.total_kanji);
            updateValue("stat-shown", data.total_shown);
            updateValue("stat-remembered", data.total_remembered);
            updateValue("stat-failed", data.total_failed);
            updateValue("stat-accuracy", data.accuracy + "%");
            updateValue("stat-due", data.due_now);

            const updated = document.getElementById("last-updated");
            if (updated) {
                updated.textContent = "Updated " + new Date().toLocaleTimeString();
            }

            renderLevels(data.levels);
            previousStats = data;
        } catch (err) {
            console.error("Stats fetch failed:", err);
        }
    }

    function renderLevels(levels) {
        const container = document.getElementById("level-bars");
        const order = ["N5", "N4", "N3", "N2", "N1", "Unknown"];
        const present = order.filter(l => levels[l]);

        if (present.length === 0) {
            container.innerHTML = '<p style="color: rgb(147,154,183); font-size:13px;">No kanji data yet.</p>';
            return;
        }

        const max = Math.max(...present.map(l => levels[l]));

        if (container.children.length === present.length) {
            present.forEach((level, i) => {
                const row = container.children[i];
                const fill = row.querySelector(".level-bar-fill");
                const count = row.querySelector(".level-count");
                const pct = max > 0 ? (levels[level] / max) * 100 : 0;
                fill.style.width = pct + "%";
                count.textContent = levels[level];
            });
            return;
        }

        container.innerHTML = "";
        present.forEach(level => {
            const count = levels[level];
            const pct = max > 0 ? (count / max) * 100 : 0;
            const cls = "level-" + level.toLowerCase();

            const row = document.createElement("div");
            row.className = "level-row " + cls;
            row.innerHTML =
                '<span class="level-label">' + level + '</span>' +
                '<div class="level-bar-bg">' +
                    '<div class="level-bar-fill" style="width: ' + pct + '%"></div>' +
                '</div>' +
                '<span class="level-count">' + count + '</span>';
            container.appendChild(row);
        });
    }

    async function loadLastfm() {
        try {
            const res = await fetch("/api/lastfm");
            const data = await res.json();
            document.getElementById("lastfm-key").value = data.api_key || "";
            document.getElementById("lastfm-secret").value = data.api_secret || "";
            document.getElementById("lastfm-user").value = data.username || "";
        } catch (err) {
            console.error("Last.fm config fetch failed:", err);
        }
    }

    document.getElementById("lastfm-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = document.getElementById("lastfm-msg");

        const body = {
            api_key: document.getElementById("lastfm-key").value,
            api_secret: document.getElementById("lastfm-secret").value,
            username: document.getElementById("lastfm-user").value
        };

        try {
            const res = await fetch("/api/lastfm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            msg.style.display = "block";
            msg.className = "form-message " + (data.success ? "success" : "error");
            msg.textContent = data.message;
            setTimeout(() => { msg.style.display = "none"; }, 4000);
        } catch (err) {
            msg.style.display = "block";
            msg.className = "form-message error";
            msg.textContent = "Connection failed.";
        }
    });

    async function loadDisplay() {
        try {
            const res = await fetch("/api/display");
            const data = await res.json();
            const dot = document.getElementById("display-dot");
            const label = document.getElementById("display-status-text");
            const kanjiCard = document.getElementById("current-kanji-card");
            const offlineCard = document.getElementById("display-offline-card");

            if (data.running) {
                dot.className = "status-dot online";
                label.textContent = "Running";
                kanjiCard.style.display = "flex";
                offlineCard.style.display = "none";

                document.getElementById("current-kanji").textContent = data.kanji || "";
                document.getElementById("current-level").textContent = data.level || "";
                document.getElementById("current-onyomi").textContent = data.onyomi || "";
                document.getElementById("current-kunyomi").textContent = data.kunyomi || "";
                document.getElementById("current-meaning").textContent = data.meaning || "";
            } else {
                dot.className = "status-dot offline";
                label.textContent = "Stopped";
                kanjiCard.style.display = "none";
                offlineCard.style.display = "block";
            }
        } catch (err) {
            console.error("Display state fetch failed:", err);
        }
    }

    async function sendDisplayAction(action) {
        try {
            const res = await fetch("/api/display/" + action, { method: "POST" });
            const data = await res.json();
            setTimeout(loadDisplay, 1500);
        } catch (err) {
            console.error("Display action failed:", err);
        }
    }

    document.getElementById("btn-restart").addEventListener("click", (e) => { e.preventDefault(); sendDisplayAction("restart"); });
    document.getElementById("btn-stop").addEventListener("click", (e) => { e.preventDefault(); sendDisplayAction("stop"); });

    async function loadRecent() {
        try {
            const res = await fetch("/api/recent-kanji");
            const data = await res.json();
            const container = document.getElementById("recent-list");

            if (!data.recent || data.recent.length === 0) {
                container.innerHTML = '<p class="recent-empty">No kanji scanned yet.</p>';
                return;
            }

            let html = '<div class="recent-grid">';
            data.recent.forEach(k => {
                const lvl = (k.level || "Unknown").toLowerCase();
                const readings = [k.onyomi, k.kunyomi].filter(Boolean).join(" ・ ");
                html += '<div class="recent-row">' +
                    '<span class="recent-char">' + k.kanji + '</span>' +
                    '<div class="recent-info">' +
                        '<div class="recent-meaning">' + (k.meaning || "") + '</div>' +
                        '<div class="recent-readings">' + readings + '</div>' +
                    '</div>' +
                    '<span class="recent-level recent-level-' + lvl + '">' + (k.level || "?") + '</span>' +
                '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        } catch (err) {
            console.error("Recent kanji fetch failed:", err);
        }
    }

    loadStats();
    loadLastfm();
    loadDisplay();
    loadRecent();
    setInterval(loadStats, REFRESH_INTERVAL);
    setInterval(loadDisplay, REFRESH_INTERVAL);
});
