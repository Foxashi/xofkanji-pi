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
            row.style.cursor = "pointer";
            row.innerHTML =
                '<span class="level-label">' + level + '</span>' +
                '<div class="level-bar-bg">' +
                    '<div class="level-bar-fill" style="width: ' + pct + '%"></div>' +
                '</div>' +
                '<span class="level-count">' + count + '</span>';
            row.addEventListener("click", () => openLevelModal(level));
            container.appendChild(row);
        });
    }

    async function openLevelModal(level) {
        const modal = document.getElementById("level-modal");
        const title = document.getElementById("level-modal-title");
        const body = document.getElementById("level-modal-body");

        title.textContent = level + " Kanji";
        body.innerHTML = '<p class="recent-empty">Loading...</p>';
        modal.style.display = "flex";

        try {
            const res = await fetch("/api/kanji-by-level/" + encodeURIComponent(level));
            const data = await res.json();

            if (!data.kanji || data.kanji.length === 0) {
                body.innerHTML = '<p class="recent-empty">No kanji found.</p>';
                return;
            }

            let html = '<div class="modal-kanji-grid">';
            data.kanji.forEach(k => {
                const readings = [k.onyomi, k.kunyomi].filter(Boolean).join(" ・ ");
                const total = k.remembered + k.failed;
                const acc = total > 0 ? Math.round(k.remembered / total * 100) : 0;
                const accClass = total === 0 ? "" : (acc >= 70 ? "acc-good" : (acc >= 40 ? "acc-mid" : "acc-bad"));

                html += '<div class="modal-kanji-row">' +
                    '<span class="modal-kanji-char">' + k.kanji + '</span>' +
                    '<div class="modal-kanji-info">' +
                        '<div class="modal-kanji-meaning">' + (k.meaning || "") + '</div>' +
                        '<div class="modal-kanji-readings">' + readings + '</div>' +
                    '</div>' +
                    '<div class="modal-kanji-stats">' +
                        (total > 0 ? '<span class="modal-kanji-acc ' + accClass + '">' + acc + '%</span>' : '<span class="modal-kanji-acc">New</span>') +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
            body.innerHTML = html;
        } catch (err) {
            body.innerHTML = '<p class="recent-empty">Failed to load kanji.</p>';
            console.error("Level kanji fetch failed:", err);
        }
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

    document.getElementById("level-modal-close").addEventListener("click", () => {
        document.getElementById("level-modal").style.display = "none";
    });
    document.getElementById("level-modal").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.style.display = "none";
        }
    });

    loadStats();
    loadLastfm();
    loadDisplay();
    loadRecent();
    setInterval(loadStats, REFRESH_INTERVAL);
    setInterval(loadDisplay, REFRESH_INTERVAL);

    // ========== Reading Practice ==========
    const practiceState = {
        current: null,
        streak: 0,
        correct: 0,
        wrong: 0,
        revealed: false
    };

    const practiceEls = {
        kanji: document.getElementById("practice-kanji"),
        meaning: document.getElementById("practice-meaning"),
        level: document.getElementById("practice-level"),
        onyomi: document.getElementById("practice-onyomi"),
        kunyomi: document.getElementById("practice-kunyomi"),
        onyomiCheck: document.getElementById("practice-onyomi-check"),
        kunyomiCheck: document.getElementById("practice-kunyomi-check"),
        streak: document.getElementById("practice-streak"),
        correctEl: document.getElementById("practice-correct"),
        wrongEl: document.getElementById("practice-wrong"),
        accuracy: document.getElementById("practice-accuracy"),
        submitBtn: document.getElementById("practice-submit"),
        skipBtn: document.getElementById("practice-skip"),
        nextBtn: document.getElementById("practice-next"),
        answer: document.getElementById("practice-answer"),
        answerOnyomi: document.getElementById("practice-answer-onyomi"),
        answerKunyomi: document.getElementById("practice-answer-kunyomi"),
        kanjiDisplay: document.querySelector(".practice-kanji-display")
    };

    function normalizeReading(str) {
        // Normalize: trim, collapse whitespace, replace various separators with ・, strip dots
        return str.trim()
            .replace(/[\s,、，/／・.．·]+/g, "・")
            .replace(/^・|・$/g, "");
    }

    function readingsMatch(input, expected) {
        if (!expected) return true; // no expected reading = auto-pass
        if (!input && expected) return false;

        const normInput = normalizeReading(input);
        const normExpected = normalizeReading(expected);

        if (normInput === normExpected) return true;

        // Pass if at least one input reading matches any expected reading
        const inputParts = normInput.split("・").filter(Boolean);
        const expectedParts = normExpected.split("・").filter(Boolean);

        return inputParts.some(ip => expectedParts.includes(ip));
    }

    function updatePracticeStats() {
        practiceEls.streak.textContent = practiceState.streak;
        practiceEls.correctEl.textContent = practiceState.correct;
        practiceEls.wrongEl.textContent = practiceState.wrong;
        const total = practiceState.correct + practiceState.wrong;
        practiceEls.accuracy.textContent = total > 0
            ? Math.round(practiceState.correct / total * 100) + "%"
            : "\u2014";
    }

    function showAnswer() {
        const k = practiceState.current;
        practiceEls.answerOnyomi.textContent = k.onyomi || "\u2014";
        practiceEls.answerKunyomi.textContent = k.kunyomi || "\u2014";
        practiceEls.answer.style.display = "flex";
    }

    function setFieldResult(input, checkEl, isCorrect, isSkipped) {
        input.classList.remove("correct", "wrong", "skipped");
        checkEl.classList.remove("visible");
        checkEl.textContent = "";

        if (isSkipped) {
            input.classList.add("skipped");
            checkEl.textContent = "—";
            checkEl.classList.add("visible");
        } else if (isCorrect) {
            input.classList.add("correct");
            checkEl.textContent = "✓";
            checkEl.style.color = "#a6da95";
            checkEl.classList.add("visible");
        } else {
            input.classList.add("wrong");
            checkEl.textContent = "✗";
            checkEl.style.color = "#ed8796";
            checkEl.classList.add("visible");
        }
    }

    function lockInputs() {
        practiceEls.onyomi.readOnly = true;
        practiceEls.kunyomi.readOnly = true;
        practiceState.revealed = true;
        practiceEls.submitBtn.style.display = "none";
        practiceEls.skipBtn.style.display = "none";
        practiceEls.nextBtn.style.display = "";
    }

    function checkPractice() {
        if (practiceState.revealed || !practiceState.current) return;

        const k = practiceState.current;
        const onOk = readingsMatch(practiceEls.onyomi.value, k.onyomi);
        const kunOk = readingsMatch(practiceEls.kunyomi.value, k.kunyomi);

        setFieldResult(practiceEls.onyomi, practiceEls.onyomiCheck, onOk, false);
        setFieldResult(practiceEls.kunyomi, practiceEls.kunyomiCheck, kunOk, false);

        if (onOk && kunOk) {
            practiceState.correct++;
            practiceState.streak++;
        } else {
            practiceState.wrong++;
            practiceState.streak = 0;
        }

        updatePracticeStats();
        showAnswer();
        lockInputs();
        practiceEls.nextBtn.focus();
    }

    function skipPractice() {
        if (practiceState.revealed || !practiceState.current) return;

        setFieldResult(practiceEls.onyomi, practiceEls.onyomiCheck, false, true);
        setFieldResult(practiceEls.kunyomi, practiceEls.kunyomiCheck, false, true);

        practiceState.wrong++;
        practiceState.streak = 0;
        updatePracticeStats();
        showAnswer();
        lockInputs();
        practiceEls.nextBtn.focus();
    }

    async function loadPracticeKanji() {
        practiceState.revealed = false;

        // Reset UI
        practiceEls.onyomi.value = "";
        practiceEls.kunyomi.value = "";
        practiceEls.onyomi.readOnly = false;
        practiceEls.kunyomi.readOnly = false;
        practiceEls.onyomi.classList.remove("correct", "wrong", "skipped");
        practiceEls.kunyomi.classList.remove("correct", "wrong", "skipped");
        practiceEls.onyomiCheck.classList.remove("visible");
        practiceEls.kunyomiCheck.classList.remove("visible");
        practiceEls.answer.style.display = "none";
        practiceEls.submitBtn.style.display = "";
        practiceEls.skipBtn.style.display = "";
        practiceEls.nextBtn.style.display = "none";

        try {
            const res = await fetch("/api/random-kanji");
            const data = await res.json();
            practiceState.current = data;

            practiceEls.kanji.textContent = data.kanji;
            practiceEls.meaning.textContent = data.meaning || "";
            practiceEls.level.textContent = data.level || "";

            // Animate
            practiceEls.kanjiDisplay.classList.remove("animate");
            void practiceEls.kanjiDisplay.offsetWidth; // trigger reflow
            practiceEls.kanjiDisplay.classList.add("animate");

            practiceEls.onyomi.focus();
        } catch (err) {
            console.error("Practice kanji fetch failed:", err);
        }
    }

    if (practiceEls.submitBtn) {
        practiceEls.submitBtn.addEventListener("click", checkPractice);
        practiceEls.skipBtn.addEventListener("click", skipPractice);
        practiceEls.nextBtn.addEventListener("click", loadPracticeKanji);

        // Keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            // Only handle when practice section is visible
            const section = document.getElementById("practice");
            if (!section || section.style.display === "none") return;

            if (e.key === "Enter") {
                if (practiceState.revealed) {
                    loadPracticeKanji();
                } else {
                    checkPractice();
                }
                e.preventDefault();
            }

            if (e.key === "Escape" && !practiceState.revealed) {
                skipPractice();
                e.preventDefault();
            }
        });

        // Tab between fields
        practiceEls.onyomi.addEventListener("keydown", (e) => {
            if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                practiceEls.kunyomi.focus();
            }
        });

        // Load first kanji when practice section becomes visible
        const practiceNav = document.querySelector('.nav-item[data-section="practice"]');
        if (practiceNav) {
            practiceNav.addEventListener("click", () => {
                if (!practiceState.current) {
                    loadPracticeKanji();
                }
            });
        }
    }
});
