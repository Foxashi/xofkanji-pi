
const COMMITS_URL = `https://api.github.com/repos/Foxashi/xofkanji-pi/commits?per_page=30`;

interface GitHubCommit {
    sha: string;
    html_url: string;
    commit: {
        message: string;
        author: {
            name: string;
            date: string;
        };
    };
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

export async function loadChangelogs(): Promise<void> {
    const container = document.getElementById('changelog-list');
    if (!container) return;

    container.innerHTML = '<p class="changelog-loading">Loading commits…</p>';

    try {
        const res = await fetch(COMMITS_URL, {
            headers: { Accept: 'application/vnd.github+json' },
        });

        if (res.status === 403) {
            container.innerHTML = '<p class="changelog-error">GitHub API rate limit reached. Try again later.</p>';
            return;
        }
        if (!res.ok) {
            container.innerHTML = `<p class="changelog-error">Failed to fetch commits (${res.status}).</p>`;
            return;
        }

        const commits: GitHubCommit[] = await res.json();

        if (commits.length === 0) {
            container.innerHTML = '<p class="changelog-empty">No commits found.</p>';
            return;
        }

        container.innerHTML = '';

        commits.forEach(c => {
            const [title, ...bodyLines] = c.commit.message.split('\n');
            const body = bodyLines.filter(l => l.trim()).join('\n').trim();
            const sha = c.sha.slice(0, 7);
            const date = c.commit.author.date;

            const item = document.createElement('div');
            item.className = 'changelog-item';
            item.innerHTML = `
                <div class="changelog-dot"></div>
                <div class="changelog-content">
                    <span class="changelog-title">${escapeHtml(title)}</span>
                    <div class="changelog-meta">
                        <span class="changelog-author">${escapeHtml(c.commit.author.name)}</span>
                        <span class="changelog-time" title="${formatDate(date)}">${timeAgo(date)}</span>
                        <a class="changelog-sha" href="${c.html_url}" target="_blank" rel="noopener noreferrer">${sha}</a>
                    </div>
                    ${body ? `<p class="changelog-body">${escapeHtml(body)}</p>` : ''}
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        container.innerHTML = '<p class="changelog-error">Could not reach GitHub. Check your connection.</p>';
        console.error('Changelog fetch failed:', err);
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
