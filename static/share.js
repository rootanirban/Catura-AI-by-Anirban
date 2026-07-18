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

// Minimal, self-contained markdown → HTML (fenced code, inline code, bold,
// italic, links, line breaks). Intentionally simple: this page has no
// dependency on logic.js's fuller formatter.
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
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    text = text.replace(/\n/g, '<br>');

    text = text.replace(/\x00CODE(\d+)\x00/g, (_m, i) => codeBlocks[Number(i)]);
    return text;
}

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

    document.title = `${data.title || 'Shared Chat'} — Catura AI`;

    const box = document.getElementById('shareChatbox');
    box.innerHTML = '';

    (data.messages || []).forEach(msg => {
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
            botMsg.innerHTML = formatSharedMessage(msg.content);
            wrapper.appendChild(botMsg);
            box.appendChild(wrapper);
        }
    });

    if ((data.messages || []).length === 0) {
        renderState('Nothing to show', 'This shared chat has no messages.');
    }
}

document.addEventListener('DOMContentLoaded', loadSharedChat);
