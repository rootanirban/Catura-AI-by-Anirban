// ============================
// ✅ SUPABASE (public/anon — same publishable key as the main app,
//    read access is gated by the "is_active = true" RLS policy)
// ============================
const supabaseUrl = "https://zhrjmnrfklzuxmfbdqhg.supabase.co";
const supabaseKey = "sb_publishable_aIbByN1rFc9V3AH41Kyz6A_e1XppA1Z";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ── Minimal, self-contained markdown → HTML ─────────────────────────────
// (fenced code, inline code, bold, italic, links, headings, lists, line breaks)
function formatSharedMessage(raw) {
    if (!raw) return "";

    const codeBlocks = [];
    let text = raw.replace(/```([\w+\-#. ]*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
        codeBlocks.push(
            `<div class="code-block"><div class="code-header"><span class="lang-label">${escapeHtml(lang.trim() || "text")}</span></div><pre><code>${escapeHtml(code.trimEnd())}</code></pre></div>`
        );
        return `\x00CODE${codeBlocks.length - 1}\x00`;
    });

    text = escapeHtml(text);
    text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    text = text.replace(/^- (.*)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
    text = text.replace(/\n/g, '<br>');

    text = text.replace(/\x00CODE(\d+)\x00/g, (_m, i) => codeBlocks[Number(i)]);
    return text;
}

// ── Thinking dropdown — mirrors the main app's .thinking-block markup ──
function splitThinking(rawText) {
    if (!rawText) return { thinking: null, answer: rawText || "" };
    const m = rawText.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
    if (m && m[1].trim()) return { thinking: m[1].trim(), answer: m[2].trim() };
    const openOnly = rawText.match(/<think>([\s\S]*)$/);
    if (openOnly && openOnly[1].trim()) return { thinking: openOnly[1].trim(), answer: "" };
    return { thinking: null, answer: rawText };
}

let _thinkingIdSeq = 0;
function buildThinkingHTML(thinkingText) {
    const id = `share-think-${Date.now()}-${_thinkingIdSeq++}`;
    return `<div class="thinking-block">
        <button type="button" class="thinking-toggle" aria-expanded="false" aria-controls="${id}" onclick="toggleThinking(this)">
            <svg class="thinking-brain-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9.5 2a3.5 3.5 0 0 0-3.5 3.5v.126A3.001 3.001 0 0 0 4 8.5v1.09a3.001 3.001 0 0 0-1 5.582V16.5A3.5 3.5 0 0 0 6.5 20a2.5 2.5 0 0 0 2.5-2.5V4.5A2.5 2.5 0 0 0 9.5 2Zm5 0A2.5 2.5 0 0 0 12 4.5v13a2.5 2.5 0 0 0 2.5 2.5A3.5 3.5 0 0 0 18 16.5v-1.328a3.001 3.001 0 0 0-1-5.582V8.5a3.001 3.001 0 0 0-2-2.874V5.5A3.5 3.5 0 0 0 14.5 2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
            <span class="thinking-label">Thinking</span>
            <svg class="thinking-arrow" width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2 1l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="thinking-content" id="${id}" role="region" aria-label="Model reasoning">
            <div class="thinking-inner">${formatSharedMessage(thinkingText)}</div>
        </div>
    </div>`;
}

window.toggleThinking = function (btn) {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const content = document.getElementById(btn.getAttribute('aria-controls'));
    if (content) content.classList.toggle('open', !expanded);
};

function renderState(title, message) {
    const box = document.getElementById('shareChatbox');
    const state = document.getElementById('shareState');
    box.style.display = 'none';
    state.style.display = 'block';
    state.innerHTML = `<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)} <a href="/">Go to Catura AI</a></p>`;
}

async function loadSharedChat() {
    // Hardened against trailing slashes / query strings, e.g.
    // /share/abc123/  or  /share/abc123?utm=x
    const slug = window.location.pathname.split('/share/')[1]?.split(/[/?#]/)[0];

    if (!slug) {
        renderState('Link not found', 'This share link looks incomplete.');
        return;
    }

    const { data, error } = await supabaseClient
        .from('shared_chats')
        .select('title, messages, is_active, created_at')
        .eq('share_slug', slug)
        .maybeSingle();

    if (error || !data || !data.is_active) {
        renderState('Chat not available', 'This shared chat may have been removed or unshared.');
        return;
    }

    if (!data.messages || data.messages.length === 0) {
        renderState('Nothing to show', 'This shared chat has no messages.');
        return;
    }

    document.title = `${data.title || 'Shared Chat'} — Catura AI`;

    const box = document.getElementById('shareChatbox');
    box.innerHTML = '';

    data.messages.forEach(msg => {
        if (msg.role === 'user') {
            const wrapper = document.createElement('div');
            wrapper.classList.add('user-msg-wrapper');
            const bubble = document.createElement('div');
            bubble.classList.add('message', 'user');
            bubble.innerText = msg.content;
            wrapper.appendChild(bubble);
            box.appendChild(wrapper);
        } else {
            const wrapper = document.createElement('div');
            wrapper.classList.add('bot-msg-wrapper');
            const botMsg = document.createElement('div');
            botMsg.classList.add('message', 'bot');

            const { thinking, answer } = splitThinking(msg.content);
            let html = '';
            if (thinking) html += buildThinkingHTML(thinking);
            html += formatSharedMessage(answer);
            botMsg.innerHTML = html;

            wrapper.appendChild(botMsg);
            box.appendChild(wrapper);
        }
    });
}

document.addEventListener('DOMContentLoaded', loadSharedChat);
