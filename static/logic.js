// ============================
// ✅ SUPABASE SETUP
// ============================
const supabaseUrl = "https://zhrjmnrfklzuxmfbdqhg.supabase.co";
const supabaseKey = "sb_publishable_aIbByN1rFc9V3AH41Kyz6A_e1XppA1Z";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ============================
// ✅ USER AUTH
// ============================
let currentUser = null;

async function getUser() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error) console.error("Auth error:", error.message);
    currentUser = data?.user || null;

    if (currentUser) {
        const fullName = (
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split("@")[0] ||
            "User"
        ).trim();

        const parts = fullName.split(/\s+/).filter(Boolean);
        const initials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();

        const avatarEl   = document.getElementById("userAvatar");
        const nameEl     = document.getElementById("userFullname");
        const railAvatar = document.getElementById("railAvatar");

        if (avatarEl)   avatarEl.textContent   = initials;
        if (nameEl)     nameEl.textContent     = fullName;
        if (railAvatar) railAvatar.textContent = initials;
    }
}

// ============================
// ✅ SESSION
// ============================
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

let currentSessionId = generateSessionId();
let chatTitle = "New Chat";
let firstMessage = true;

// ============================
// ⏰ TIME-BASED GREETING
// ============================
function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
}

function getGreetingMessage(userName) {
    const timeOfDay = getTimeOfDay();
    const greetings = {
        morning: [`Good morning, ${userName}`, `Rise and shine, ${userName}!`, `☀️ Good morning, ${userName}!`],
        afternoon: [`Good afternoon, ${userName}`, `Hope you're having a great afternoon, ${userName}!`, `🌤️ Good afternoon, ${userName}!`],
        evening: [`Good evening, ${userName}`, `Evening, ${userName}!`, `🌙 Good evening, ${userName}!`],
        night: [`Good night, ${userName}`, `Night owl session, ${userName}?`, `🌌 Good night, ${userName}!`]
    };
    const list = greetings[timeOfDay];
    return list[Math.floor(Math.random() * list.length)];
}

function displayGreeting() {
    const userNameEl = document.getElementById("userFullname");
    const userName = userNameEl?.textContent || "User";
    const greeting = getGreetingMessage(userName);

    const greetingDiv = document.createElement("div");
    greetingDiv.style.cssText = `
        text-align: center;
        margin-top: 20px;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, #10a37f11 0%, #0d8c6d11 100%);
        border: 1px solid #10a37f22;
        border-radius: 12px;
        animation: fadeIn 0.6s ease-in-out;
    `;
    greetingDiv.innerHTML = `
        <div style="font-size: 24px; font-weight: 600; color: #10a37f; letter-spacing: -0.02em;">${greeting}</div>
        <div style="font-size: 14px; color: #888; margin-top: 8px;">How can I help you today?</div>
    `;

    const chatbox = document.getElementById("chatbox");
    const app = document.getElementById("app");
    if (chatbox) {
        chatbox.innerHTML = "";
        chatbox.appendChild(greetingDiv);
    }
    if (app) app.classList.add("greeting-mode");
}

// ============================
// 🔀 SIDEBAR
// ============================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const iconRail = document.getElementById("iconRail");
    const overlay = document.getElementById("sidebarOverlay");
    const hamburger = document.querySelector(".mobile-hamburger");

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
        if (hamburger) hamburger.classList.toggle("is-open", sidebar.classList.contains("open"));
    } else {
        const isOpen = sidebar.classList.contains("open");
        if (isOpen) {
            sidebar.classList.remove("open");
            iconRail.classList.add("visible");
        } else {
            sidebar.classList.add("open");
            iconRail.classList.remove("visible");
        }
    }
}

function closeSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const hamburger = document.querySelector(".mobile-hamburger");
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    if (hamburger) hamburger.classList.remove("is-open");
}

window.openSidebarTo = function (section) {
    const sidebar = document.getElementById("sidebar");
    const iconRail = document.getElementById("iconRail");
    if (window.innerWidth <= 768) {
        sidebar.classList.add("open");
        document.getElementById("sidebarOverlay").classList.add("show");
    } else {
        sidebar.classList.add("open");
        iconRail.classList.remove("visible");
    }
    if (section === 'history') showHistory();
};

function useSuggestion(el) {
    const input = document.getElementById("input");
    input.value = el.innerText.trim();
    input.focus();
    if (typeof autoResize === "function") autoResize();
}

// ============================
// 🔍 QUERY COMPLEXITY
// ============================
function isHeavyQuery(text) {
    const lower = text.toLowerCase().trim();
    if (lower.length > 80) return true;
    const heavyKeywords = [
        "explain", "write", "create", "build", "code", "script", "program", "function",
        "debug", "fix", "error", "bug", "step by step", "compare", "difference between",
        "how does", "how do i", "how to", "generate", "summarize", "analyze",
        "essay", "give me", "make a", "implement", "refactor", "optimiz",
        "algorithm", "convert", "translate"
    ];
    return heavyKeywords.some(kw => lower.includes(kw));
}

// ============================
// 🩹 REPAIR TRUNCATED
// ============================
function repairTruncated(text) {
    const fenceMatches = (text.match(/```/g) || []).length;
    if (fenceMatches % 2 !== 0) text = text.trimEnd() + "\n```";
    return text;
}

// ============================
// 🧾 MARKDOWN RENDERER
// ============================
function formatMessage(rawText) {
    if (!rawText) return "";

    const codeBlocks = [];
    let text = rawText.replace(/```([\w+\-#]*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
        const language = lang.trim() || "text";
        const escapedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        codeBlocks.push(`<div class="code-block">
            <div class="code-header">
                <span class="lang-label">${language}</span>
                <button onclick="copyCode(this)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg> Copy</button>
            </div>
            <pre><code>${escapedCode.trimEnd()}</code></pre>
        </div>`);
        return `\x00CODE${codeBlocks.length - 1}\x00`;
    });

    text = text.split(/(\x00CODE\d+\x00)/).map((part, i) => {
        if (i % 2 === 1) return part;
        return part
            .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }).join("");

    text = text.replace(/((?:[ \t]*\|.+\|\s*\n?)+)/g, (block) => {
        const rawRows = block.trim().split("\n").map(r => r.trim()).filter(Boolean);
        if (rawRows.length < 2) return block;
        const isSep = r => /^\|[\s:|\-]+\|$/.test(r);
        if (!isSep(rawRows[1])) return block;

        const parseRow = r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
        const sepCells = parseRow(rawRows[1]);
        const aligns = sepCells.map(c => {
            if (/^:-+:$/.test(c)) return 'center';
            if (/^-+:$/.test(c))  return 'right';
            return 'left';
        });

        const headers = parseRow(rawRows[0]);
        const bodyRows = rawRows.slice(2);

        const thead = `<thead><tr>${headers.map((h, i) => `<th style="text-align:${aligns[i] || 'left'}">${applyInline(h)}</th>`).join("")}</tr></thead>`;
        const tbody = `<tbody>${bodyRows.map(r => `<tr>${parseRow(r).map((c, i) => `<td style="text-align:${aligns[i] || 'left'}">${applyInline(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
        return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
    });

    const outputLines = [];
    const rawLines = text.split("\n");
    let i = 0;

    while (i < rawLines.length) {
        const line = rawLines[i];
        const trimmed = line.trim();

        const h3 = trimmed.match(/^### (.+)$/); if (h3) { outputLines.push(`<h3>${applyInline(h3[1])}</h3>`); i++; continue; }
        const h2 = trimmed.match(/^## (.+)$/);  if (h2) { outputLines.push(`<h2>${applyInline(h2[1])}</h2>`); i++; continue; }
        const h1 = trimmed.match(/^# (.+)$/);   if (h1) { outputLines.push(`<h1>${applyInline(h1[1])}</h1>`); i++; continue; }

        if (/^---+$/.test(trimmed)) { outputLines.push("<hr>"); i++; continue; }

        if (/^&gt;\s?/.test(trimmed)) {
            const bqLines = [];
            while (i < rawLines.length && /^&gt;\s?/.test(rawLines[i].trim())) {
                bqLines.push(applyInline(rawLines[i].trim().replace(/^&gt;\s?/, "")));
                i++;
            }
            outputLines.push(`<blockquote>${bqLines.join("<br>")}</blockquote>`);
            continue;
        }

        if (/^[-*•]\s/.test(trimmed)) {
            const items = [];
            while (i < rawLines.length && /^[-*•]\s/.test(rawLines[i].trim())) {
                items.push(`<li>${applyInline(rawLines[i].trim().replace(/^[-*•]\s/, ""))}</li>`);
                i++;
            }
            outputLines.push(`<ul>${items.join("")}</ul>`);
            continue;
        }

        if (/^\d+[\.)]\s/.test(trimmed)) {
            const items = [];
            while (i < rawLines.length && /^\d+[\.)]\s/.test(rawLines[i].trim())) {
                items.push(`<li>${applyInline(rawLines[i].trim().replace(/^\d+[\.)]\s/, ""))}</li>`);
                i++;
            }
            outputLines.push(`<ol>${items.join("")}</ol>`);
            continue;
        }

        if (/^\x00CODE\d+\x00$/.test(trimmed)) { outputLines.push(trimmed); i++; continue; }
        if (!trimmed) { outputLines.push(""); i++; continue; }
        if (/^<(div class="table-wrap"|table|\/div|\/table|thead|tbody|tr|th|td)/.test(trimmed)) { outputLines.push(line); i++; continue; }

        outputLines.push(applyInline(trimmed));
        i++;
    }

    let html = "";
    let paraBuf = [];
    const flushPara = () => { if (paraBuf.length) { html += `<p>${paraBuf.join(" ")}</p>`; paraBuf = []; } };
    const BLOCK_RE = /^(<(h[123]|ul|ol|blockquote|hr|div|table|thead|tbody|tr|th|td)|<\/|<div|\x00CODE)/;

    for (const ln of outputLines) {
        if (!ln) { flushPara(); continue; }
        if (BLOCK_RE.test(ln)) { flushPara(); html += ln; continue; }
        paraBuf.push(ln);
    }
    flushPara();

    html = html.replace(/\x00CODE(\d+)\x00/g, (_, idx) => codeBlocks[+idx]);
    return html;
}

function applyInline(text) {
    if (!text) return text;
    const inlineCode = [];
    text = text.replace(/`([^`]+)`/g, (_, c) => {
        inlineCode.push(`<span class="inline-code">${c.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>`);
        return `\x01IC${inlineCode.length - 1}\x01`;
    });
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>");
    text = text.replace(/__(.+?)__/g, "<u>$1</u>");
    text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    text = text.replace(/\x01IC(\d+)\x01/g, (_, i) => inlineCode[+i]);
    return text;
}

// ============================
// 📋 COPY HELPERS
// ============================
function copyCode(btn) {
    const code = btn.closest(".code-block").querySelector("code").innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "✓ Copied!";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
    }).catch(() => showToast("Failed to copy code"));
}

function copyBotAnswer(btn) {
    const wrapper = btn.closest(".bot-msg-wrapper");
    const rawText = wrapper ? wrapper.dataset.raw : "";
    if (!rawText) return;
    navigator.clipboard.writeText(rawText).then(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        btn.classList.add("copied");
        setTimeout(() => {
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
            btn.classList.remove("copied");
        }, 2000);
    }).catch(() => showToast("Failed to copy message"));
}

function copyUserMessage(btn) {
    const wrapper = btn.closest(".user-msg-wrapper");
    const text = wrapper ? wrapper.querySelector(".message.user").innerText : "";
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        btn.classList.add("copied");
        setTimeout(() => {
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
            btn.classList.remove("copied");
        }, 2000);
    }).catch(() => showToast("Failed to copy message"));
}

// ============================
// 🍞 TOAST
// ============================
function showToast(message, duration = 3000) {
    let toast = document.getElementById("toastNotif");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastNotif";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
}

// ============================
// 🤔 INDICATORS
// ============================
function createThinkingIndicator() {
    const div = document.createElement("div");
    div.classList.add("message", "bot", "typing");
    div.innerHTML = `
        <div class="thinking-wrap">
            <div class="thinking-label">
                <span class="think-icon"></span>
                AI is thinking…
            </div>
            <div class="skeleton-lines">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>`;
    return div;
}

function createLightIndicator() {
    const div = document.createElement("div");
    div.classList.add("message", "bot", "typing");
    div.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
    return div;
}

// ============================
// 📦 USER BUBBLE
// ============================
function createUserBubble(text, files) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("user-msg-wrapper");

    if (files && files.length > 0) {
        const filesDiv = document.createElement("div");
        filesDiv.innerHTML = buildFileAttachHTML(files);
        wrapper.appendChild(filesDiv);
    }

    if (text) {
        const bubble = document.createElement("div");
        bubble.classList.add("message", "user");
        bubble.innerText = text;
        wrapper.appendChild(bubble);
    }

    const copyBtn = document.createElement("button");
    copyBtn.classList.add("user-copy-btn");
    copyBtn.title = "Copy message";
    copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    copyBtn.onclick = () => copyUserMessage(copyBtn);

    wrapper.appendChild(copyBtn);
    return wrapper;
}

// ============================
// 📦 BOT WRAPPER
// ============================
function createBotWrapper() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("bot-msg-wrapper");

    const botMsg = document.createElement("div");
    botMsg.classList.add("message", "bot");

    const actionsRow = document.createElement("div");
    actionsRow.classList.add("bot-actions");
    actionsRow.innerHTML = `
        <button class="bot-copy-btn" onclick="copyBotAnswer(this)" title="Copy answer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
        </button>`;

    wrapper.appendChild(botMsg);
    wrapper.appendChild(actionsRow);
    return { wrapper, botMsg };
}

// ============================
// ✍️ STREAMER (FAST 40ms render + INSTANT first token)
// ============================
async function streamWords(botMsg, wrapper, reader, decoder, chatbox) {
    let buffer = "";
    let fullReply = "";
    let done_streaming = false;
    let renderTimer = null;

    const scheduleRender = () => {
        if (renderTimer) return;
        renderTimer = setTimeout(() => {
            renderTimer = null;
            if (fullReply) {
                botMsg.innerHTML = formatMessage(repairTruncated(fullReply)) + '<span class="stream-cursor"></span>';
                chatbox.scrollTop = chatbox.scrollHeight;
            }
        }, 40);
    };

    try {
        outer:
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") { done_streaming = true; break outer; }
                try {
                    const chunk = JSON.parse(payload);
                    if (chunk.error) {
                        if (!fullReply.trim()) botMsg.innerHTML = `<p style="color:#e06c6c">⚠️ ${chunk.error}</p>`;
                        return fullReply || "";
                    }
                    if (chunk.status) continue;
                    if (chunk.token) {
                        fullReply += chunk.token;
                        // Render the very first token instantly
                        if (fullReply.length === chunk.token.length) {
                            botMsg.innerHTML = formatMessage(repairTruncated(fullReply)) + '<span class="stream-cursor"></span>';
                            chatbox.scrollTop = chatbox.scrollHeight;
                        } else {
                            scheduleRender();
                        }
                    }
                } catch { continue; }
            }
        }
    } catch (e) { console.warn("Stream read error:", e); }

    if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }

    if (fullReply.trim()) {
        botMsg.innerHTML = formatMessage(repairTruncated(fullReply));
        wrapper.dataset.raw = fullReply;
        chatbox.scrollTop = chatbox.scrollHeight;
        return fullReply;
    }

    if (!done_streaming) {
        botMsg.innerHTML = `<p style="color:#e06c6c">⚠️ No response received. Please try again.</p>`;
    }
    return "";
}

// ============================
// ➕ NEW CHAT
// ============================
window.newChat = function () {
    const overlay = document.getElementById("settingsOverlay");
    if (overlay) overlay.classList.remove("active");

    currentSessionId = generateSessionId();
    firstMessage = true;

    const chatbox = document.getElementById("chatbox");
    const inputArea = document.getElementById("inputArea");
    const app = document.getElementById("app");

    if (chatbox) chatbox.innerHTML = "";
    if (inputArea) {
        inputArea.classList.remove("bottom");
        inputArea.classList.add("center");
    }
    if (app) app.classList.add("greeting-mode");

    displayGreeting();

    if (window.innerWidth <= 768) closeSidebar();
    showMainMenu();
    showToast("New chat started", 2000);
};

window.logoutUser = async function () {
    if (confirm("Are you sure you want to logout?")) {
        await supabaseClient.auth.signOut();
        window.location.href = "/auth.html";
    }
};

window.showMainMenu = function () {
    const menu = document.querySelector(".sidebar-menu");
    if (!menu) return;
    menu.innerHTML = `
        <div class="sidebar-item" onclick="newChat()">
            <svg class="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            New Chat
        </div>
        <div class="sidebar-item" onclick="showHistory()">
            <svg class="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Chat History
        </div>
        <div class="sidebar-item" onclick="showSettings()">
            <svg class="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m10.39-9.39l-4.24 4.24m-8.3 0l-4.24-4.24m12.53 8.53l4.24 4.24m-8.3 0l4.24-4.24"></path></svg>
            Settings
        </div>`;
};

// ============================
// ⚙️ SETTINGS
// ============================
window.showSettings = function () {
    const overlay = document.getElementById("settingsOverlay");
    const email = currentUser?.email || "Not logged in";
    const fullName = document.getElementById("userFullname")?.textContent || "User";
    const initials = document.getElementById("userAvatar")?.textContent || "?";

    overlay.innerHTML = `
        <button class="settings-close-btn" onclick="closeSettings()" title="Close">✕</button>
        <div class="settings-panel-wrap">
            <div class="settings-nav">
                <h2 class="settings-nav-title">Settings</h2>
                <div class="settings-nav-item active" onclick="showSettingsTab('general', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m10.39-9.39l-4.24 4.24m-8.3 0l-4.24-4.24m12.53 8.53l4.24 4.24m-8.3 0l4.24-4.24"></path></svg> General
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('profile', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profile
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('chats', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Chats
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('privacy', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Privacy
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('account', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"></circle><path d="M5.5 21a9 9 0 0 1 13 0"></path></svg> Account
                </div>
            </div>
            <div class="settings-content" id="settingsContent"></div>
        </div>`;

    overlay.classList.add("active");
    showSettingsTab('general', overlay.querySelector('.settings-nav-item.active'));
    if (window.innerWidth <= 768) closeSidebar();
};

window.closeSettings = function () {
    const overlay = document.getElementById("settingsOverlay");
    if (overlay) overlay.classList.remove("active");
    showMainMenu();
};

window.editDisplayName = async function () {
    const currentName = document.getElementById("userFullname")?.textContent || "User";
    const newName = prompt("Enter your new display name:", currentName);
    if (!newName || newName.trim() === "" || newName.trim() === currentName) return;

    const trimmedName = newName.trim();
    try {
        const { data, error } = await supabaseClient.auth.updateUser({ data: { full_name: trimmedName } });
        if (error) { showToast("❌ Failed to update name."); return; }

        currentUser = data.user;
        const parts = trimmedName.split(/\s+/).filter(Boolean);
        const initials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();

        ["userAvatar", "userFullname", "railAvatar"].forEach((id, idx) => {
            const el = document.getElementById(id);
            if (el) el.textContent = idx === 1 ? trimmedName : initials;
        });
        const scProfileName = document.querySelector(".sc-profile-name");
        if (scProfileName) scProfileName.textContent = trimmedName;

        showToast(`✓ Name updated to ${trimmedName}`);
        setTimeout(() => showSettingsTab('profile', document.querySelector('.settings-nav-item.active')), 500);
    } catch (err) {
        showToast("❌ Failed to update name.");
    }
};

window.showSettingsTab = function (tab, clickedEl) {
    document.querySelectorAll(".settings-nav-item").forEach(el => el.classList.remove("active"));
    if (clickedEl) clickedEl.classList.add("active");

    const content = document.getElementById("settingsContent");
    if (!content) return;

    const email = currentUser?.email || "Not logged in";
    const fullName = document.getElementById("userFullname")?.textContent || "User";
    const initials = document.getElementById("userAvatar")?.textContent || "?";

    const tabs = {
        general: `
            <div class="sc-section">
                <div class="sc-section-title">Appearance</div>
                <div class="sc-row sc-row-block">
                    <div class="sc-row-top">
                        <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path></svg>
                        <p class="sc-row-label">Theme</p>
                    </div>
                    <div class="theme-picker">
                        <button class="theme-option ${(localStorage.getItem('catura-theme') || 'dark') === 'light' ? 'active' : ''}" onclick="setTheme('light')">
                            <div class="theme-preview light-preview"><div class="tp-bar"></div><div class="tp-line"></div><div class="tp-line short"></div><div class="tp-bubble"></div></div>
                            <span>Light</span>
                        </button>
                        <button class="theme-option ${(localStorage.getItem('catura-theme') || 'dark') === 'auto' ? 'active' : ''}" onclick="setTheme('auto')">
                            <div class="theme-preview auto-preview"><div class="tp-bar"></div><div class="tp-line"></div><div class="tp-bubble"></div></div>
                            <span>Auto</span>
                        </button>
                        <button class="theme-option ${(localStorage.getItem('catura-theme') || 'dark') === 'dark' ? 'active' : ''}" onclick="setTheme('dark')">
                            <div class="theme-preview dark-preview"><div class="tp-bar"></div><div class="tp-line"></div><div class="tp-line short"></div><div class="tp-bubble"></div></div>
                            <span>Dark</span>
                        </button>
                    </div>
                </div>
                <div class="sc-row sc-row-block" style="margin-top:8px;">
                    <div class="sc-row-top">
                        <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><rect x="2" y="7" width="20" height="13" rx="2"></rect></svg>
                        <p class="sc-row-label">Chat font size</p>
                    </div>
                    <div class="font-picker">
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'default' ? 'active' : ''}" onclick="setFontSize('default')"><span class="font-sample">Aa</span><span>Default</span></button>
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'small' ? 'active' : ''}" onclick="setFontSize('small')"><span class="font-sample small-sample">Aa</span><span>Small</span></button>
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'large' ? 'active' : ''}" onclick="setFontSize('large')"><span class="font-sample large-sample">Aa</span><span>Large</span></button>
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'xlarge' ? 'active' : ''}" onclick="setFontSize('xlarge')"><span class="font-sample xlarge-sample">Aa</span><span>X-Large</span></button>
                    </div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Support</div>
                <div class="sc-row" onclick="openFeedbackModal('bug')">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Send bug report</p><p class="sc-row-sub">Help us fix issues</p></div>
                </div>
                <div class="sc-row" onclick="openFeedbackModal('feature')">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Request a feature</p><p class="sc-row-sub">Suggest improvements</p></div>
                </div>
            </div>`,

        profile: `
            <div class="sc-section">
                <div class="sc-section-title">Account</div>
                <div class="sc-profile-card">
                    <div class="sc-avatar">${initials}</div>
                    <div><p class="sc-profile-name">${fullName}</p><p class="sc-profile-email">${email}</p></div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Actions</div>
                <div class="sc-row" onclick="editDisplayName()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Edit display name</p><p class="sc-row-sub">Change how your name appears</p></div>
                </div>
                <div class="sc-row danger" onclick="logoutUser()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Log out</p><p class="sc-row-sub">Sign out of your account</p></div>
                </div>
            </div>`,

        chats: `
            <div class="sc-section">
                <div class="sc-section-title">Manage chats</div>
                <div class="sc-row" onclick="archiveAllChats()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Archive all chats</p><p class="sc-row-sub">Hide all chats from your history</p></div>
                </div>
                <div class="sc-row danger" onclick="clearAllChats()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Delete all chats</p><p class="sc-row-sub">Permanently remove all history</p></div>
                </div>
            </div>`,

        privacy: `
            <div class="sc-section">
                <div class="sc-section-title">Privacy controls</div>
                <div class="sc-row" onclick="showPrivacyModal()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Data & privacy</p><p class="sc-row-sub">View how we handle your data</p></div>
                </div>
                <div class="sc-row danger" onclick="showDeleteAccountModal()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
                    <div class="sc-row-body"><p class="sc-row-label" style="color:#e06c6c;">Delete my account</p><p class="sc-row-sub">Permanently delete your account</p></div>
                </div>
            </div>`,

        account: `
            <div class="sc-section">
                <div class="sc-section-title">Account details</div>
                <div class="sc-profile-card">
                    <div class="sc-avatar">${initials}</div>
                    <div><p class="sc-profile-name">${fullName}</p><p class="sc-profile-email">${email}</p></div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Subscription</div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <div class="sc-row-body"><p class="sc-row-label">Current plan: Free</p><p class="sc-row-sub">Unlimited chats with all models</p></div>
                </div>
            </div>`
    };
    content.innerHTML = tabs[tab] || tabs.general;
};

// ============================
// 🗂️ CHAT MGMT
// ============================
window.archiveAllChats = async function () {
    if (!confirm("Archive all chats?")) return;
    const { error } = await supabaseClient.from("chat_sessions").update({ archived: true }).eq("user_id", currentUser.id);
    if (error) showToast("❌ Archive failed");
    else { showToast("✓ All chats archived"); if (typeof showHistory === "function") showHistory(); }
};

window.clearAllChats = async function () {
    if (!confirm("Delete ALL chats permanently?")) return;
    const { error: msgErr } = await supabaseClient.from("messages").delete().eq("user_id", currentUser.id);
    if (msgErr) { showToast("❌ Failed"); return; }
    const { error: sessErr } = await supabaseClient.from("chat_sessions").delete().eq("user_id", currentUser.id);
    if (sessErr) { showToast("❌ Failed"); return; }
    showToast("✓ All chats deleted");
    const chatbox = document.getElementById("chatbox");
    const inputArea = document.getElementById("inputArea");
    const app = document.getElementById("app");
    if (chatbox) chatbox.innerHTML = "";
    currentSessionId = generateSessionId();
    firstMessage = true;
    if (inputArea) { inputArea.classList.remove("bottom"); inputArea.classList.add("center"); }
    if (app) app.classList.add("greeting-mode");
    displayGreeting();
    closeSettings();
};

async function deleteSingleChat(sessionId) {
    if (!confirm("Delete this chat?")) return;
    await supabaseClient.from("messages").delete().eq("session_id", sessionId).eq("user_id", currentUser.id);
    await supabaseClient.from("chat_sessions").delete().eq("session_id", sessionId).eq("user_id", currentUser.id);
    if (currentSessionId === sessionId) {
        currentSessionId = generateSessionId();
        firstMessage = true;
        const chatbox = document.getElementById("chatbox");
        if (chatbox) chatbox.innerHTML = "";
        document.getElementById("inputArea")?.classList.remove("bottom");
        document.getElementById("inputArea")?.classList.add("center");
        document.getElementById("app")?.classList.add("greeting-mode");
        displayGreeting();
    }
    showToast("✓ Chat deleted");
    showHistory();
}

async function renameChat(sessionId, currentTitle, titleEl) {
    const newTitle = prompt("Rename chat:", currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle) return;
    await supabaseClient.from("chat_sessions").update({ title: newTitle.trim() }).eq("session_id", sessionId).eq("user_id", currentUser.id);
    titleEl.textContent = newTitle.trim();
    showToast("✓ Renamed");
}

function closeAllMenus() {
    document.querySelectorAll(".history-dropdown.open").forEach(d => d.classList.remove("open"));
}

function buildHistoryItem(session, openSessionFn) {
    const date = new Date(session.created_at).toLocaleDateString();
    const item = document.createElement("div");
    item.classList.add("sidebar-item", "history-item");

    const info = document.createElement("div");
    info.classList.add("history-info");
    info.style.flex = "1"; info.style.minWidth = "0"; info.style.cursor = "pointer";

    const titleEl = document.createElement("span");
    titleEl.classList.add("history-title");
    titleEl.textContent = session.title || "Untitled";

    const dateEl = document.createElement("span");
    dateEl.classList.add("history-date");
    dateEl.textContent = date;

    info.appendChild(titleEl); info.appendChild(dateEl);
    info.onclick = () => {
        document.getElementById("settingsOverlay")?.classList.remove("active");
        openSessionFn(session.session_id);
    };

    const menuBtn = document.createElement("button");
    menuBtn.classList.add("history-menu-btn");
    menuBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`;

    const dropdown = document.createElement("div");
    dropdown.classList.add("history-dropdown");
    dropdown.innerHTML = `
        <button class="history-dropdown-item" data-action="open">Open chat</button>
        <button class="history-dropdown-item" data-action="rename">Rename</button>
        <button class="history-dropdown-item danger" data-action="delete">Delete</button>`;

    menuBtn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains("open");
        closeAllMenus();
        if (!isOpen) dropdown.classList.add("open");
    };

    dropdown.querySelectorAll(".history-dropdown-item").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            closeAllMenus();
            const action = btn.dataset.action;
            if (action === "open") openSessionFn(session.session_id);
            if (action === "rename") renameChat(session.session_id, session.title || "Untitled", titleEl);
            if (action === "delete") deleteSingleChat(session.session_id);
        };
    });

    document.addEventListener("click", closeAllMenus);

    const menuWrap = document.createElement("div");
    menuWrap.classList.add("history-menu-wrap");
    menuWrap.appendChild(menuBtn); menuWrap.appendChild(dropdown);

    item.appendChild(info); item.appendChild(menuWrap);
    return item;
}

// ============================
// 🚀 APP START
// ============================
document.addEventListener("DOMContentLoaded", async function () {
    initTheme();
    initFontSize();
    await getUser();

    if (!currentUser) {
        window.location.href = "/auth.html";
        return;
    }

    displayGreeting();

    const chatbox = document.getElementById("chatbox");
    const input = document.getElementById("input");
    const inputArea = document.getElementById("inputArea");
    const app = document.getElementById("app");

    window.autoResize = function () {
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
    };
    input.addEventListener("input", autoResize);

    // ============================
    // 🔥 SEND MESSAGE
    // ============================
    window.sendMessage = async function () {
        const message = input.value.trim();
        const hasFiles = (typeof attachedFiles !== 'undefined') && attachedFiles.length > 0;
        if (!message && !hasFiles) return;

        if (firstMessage) {
            chatbox.innerHTML = "";
            inputArea.classList.remove("center");
            inputArea.classList.add("bottom");
            app.classList.remove("greeting-mode");
        }

        const filesToSend = (typeof attachedFiles !== 'undefined') ? attachedFiles.slice() : [];
        if (typeof attachedFiles !== 'undefined') attachedFiles = [];
        if (typeof renderAttachedPreview === 'function') renderAttachedPreview();

        const userBubble = createUserBubble(message, filesToSend);
        chatbox.appendChild(userBubble);

        if (firstMessage) {
            firstMessage = false;
            chatTitle = (message || (filesToSend.length ? filesToSend[0].name : 'File Chat')).substring(0, 40);
            await supabaseClient.from("chat_sessions").insert([{
                session_id: currentSessionId,
                title: chatTitle,
                user_id: currentUser.id
            }]);
        }

        const fileUrls = filesToSend.map(f => f.url);
        await supabaseClient.from("messages").insert([{
            role: "user",
            content: message,
            session_id: currentSessionId,
            user_id: currentUser.id,
            file_urls: fileUrls.length > 0 ? fileUrls : null
        }]);

        input.value = "";
        input.style.height = "auto";
        chatbox.scrollTop = chatbox.scrollHeight;

        const heavy = isHeavyQuery(message || (filesToSend.length ? filesToSend[0].name : ''));
        const thinking = heavy ? createThinkingIndicator() : createLightIndicator();
        chatbox.appendChild(thinking);
        chatbox.scrollTop = chatbox.scrollHeight;

        let promptText = message;
        if (filesToSend.length > 0 && !message) {
            promptText = "Please analyse the attached file(s) and describe what you see in detail.";
        }

        let webResults = [];
        const detectedIntent = message ? detectClientIntent(message) : "general";

        if (message) {
            const thinkLabel = thinking.querySelector(".thinking-label");
            if (thinkLabel) {
                const intentLabels = {
                    weather: "🌤️ Checking live weather…",
                    finance: "💹 Fetching market data…",
                    sports: "🏏 Fetching live scores…",
                    news: "📰 Getting latest news…",
                    web_search: "🔍 Searching the web…",
                };
                const label = intentLabels[detectedIntent];
                if (label) thinkLabel.innerHTML = `<span class="think-icon"></span>${label}`;
            }
            if (webSearchEnabled && detectedIntent === "general") {
                webResults = await performWebSearch(message);
            }
        }

        try {
            const model = getSelectedModel();
            const res = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: promptText,
                    model: model,
                    file_urls: fileUrls,
                    web_results: webResults
                })
            });
            if (!res.ok) throw new Error("Server error " + res.status);

            thinking.remove();

            const { wrapper, botMsg } = createBotWrapper();
            chatbox.appendChild(wrapper);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let toolUsed = null;
            const fullReply = await streamWordsWithTools(
                botMsg, wrapper, reader, decoder, chatbox,
                (tu) => { toolUsed = tu; }
            );

            if (toolUsed) {
                const toolBadges = {
                    weather: { icon: "🌤️", label: "Live Weather" },
                    finance: { icon: "💹", label: "Market Data" },
                    sports: { icon: "🏏", label: "Live Scores" },
                    news: { icon: "📰", label: "Latest News" },
                    web_search: { icon: "🔍", label: "Web Search" },
                };
                const badge = toolBadges[toolUsed] || { icon: "🔧", label: toolUsed };
                const badgeDiv = document.createElement("div");
                badgeDiv.className = "tool-badge";
                badgeDiv.style.cssText = "display:inline-flex;align-items:center;gap:6px;font-size:11px;color:#10a37f;background:rgba(16,163,127,0.1);border:1px solid rgba(16,163,127,0.3);padding:4px 10px;border-radius:14px;margin-bottom:8px;font-weight:500;";
                badgeDiv.innerHTML = `<span>${badge.icon}</span><span>${badge.label} used</span>`;
                wrapper.insertBefore(badgeDiv, botMsg);
            }

            if (fullReply && webResults.length > 0) {
                const sourcesDiv = document.createElement("div");
                sourcesDiv.className = "search-sources";
                sourcesDiv.innerHTML = `<span class="sources-label">🌐 Sources:</span>` +
                    webResults.slice(0, 4).map(r => `<a href="${r.href}" target="_blank" rel="noopener" class="source-chip">${r.title}</a>`).join('');
                wrapper.appendChild(sourcesDiv);
            }

            if (fullReply) {
                await supabaseClient.from("messages").insert([{
                    role: "bot",
                    content: fullReply,
                    session_id: currentSessionId,
                    user_id: currentUser.id
                }]);
            }
        } catch (err) {
            try { thinking.remove(); } catch (_) {}
            console.error("❌ AI fetch failed:", err);
            const errMsg = document.createElement("div");
            errMsg.classList.add("message", "bot");
            errMsg.innerHTML = `<p style="color:#e06c6c">⚠️ Failed to get a response. Please try again.</p>`;
            chatbox.appendChild(errMsg);
        }
    };

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function loadSession(sessionId) {
        chatbox.innerHTML = "";
        inputArea.classList.remove("center");
        inputArea.classList.add("bottom");
        app.classList.remove("greeting-mode");
        currentSessionId = sessionId;
        firstMessage = false;

        const { data, error } = await supabaseClient
            .from("messages").select("*")
            .eq("session_id", sessionId)
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: true });

        if (error) { console.error("❌ Load session failed:", error.message); return; }

        data.forEach(msg => {
            if (msg.role === "user") {
                const historyFiles = (msg.file_urls && msg.file_urls.length)
                    ? msg.file_urls.map(url => ({
                        url: url,
                        name: url.split('/').pop().replace(/^\d+_[a-z0-9]+_/, ''),
                        type: /\.(png|jpg|jpeg|gif|webp)$/i.test(url) ? 'image/jpeg' : 'application/octet-stream',
                        size: 0
                    }))
                    : [];
                chatbox.appendChild(createUserBubble(msg.content, historyFiles));
            } else {
                const { wrapper, botMsg } = createBotWrapper();
                botMsg.innerHTML = formatMessage(repairTruncated(msg.content));
                wrapper.dataset.raw = msg.content;
                chatbox.appendChild(wrapper);
            }
        });

        chatbox.scrollTop = chatbox.scrollHeight;
        if (window.innerWidth <= 768) closeSidebar();
        showMainMenu();
    }

    window.showHistory = async function () {
        document.getElementById("settingsOverlay")?.classList.remove("active");
        const { data, error } = await supabaseClient
            .from("chat_sessions").select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

        if (error) return;

        const menu = document.querySelector(".sidebar-menu");
        menu.innerHTML = `
            <div class="history-header">
                <button class="back-btn" onclick="showMainMenu()">← Back</button>
                <span>Chat History</span>
            </div>`;

        if (data.length === 0) {
            menu.innerHTML += `<div class="no-history">No chats yet. Start a new chat to see history.</div>`;
            return;
        }

        data.forEach(session => menu.appendChild(buildHistoryItem(session, loadSession)));
    };
});

// ============================
// 🎨 THEME
// ============================
window.setTheme = function(theme) {
    localStorage.setItem('catura-theme', theme);
    applyTheme(theme);
    document.querySelectorAll('.theme-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.theme-option[onclick="setTheme('${theme}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    showToast(`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`, 1500);
};

function applyTheme(theme) {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!prefersDark) root.setAttribute('data-theme', 'light');
    }
}

function initTheme() {
    const saved = localStorage.getItem('catura-theme') || 'dark';
    applyTheme(saved);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('catura-theme') || 'dark') === 'auto') applyTheme('auto');
    });
}

// ============================
// 🔠 FONT SIZE
// ============================
window.setFontSize = function(size) {
    localStorage.setItem('catura-font', size);
    applyFontSize(size);
    document.querySelectorAll('.font-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.font-option[onclick="setFontSize('${size}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    showToast(`Font: ${size}`, 1500);
};

function applyFontSize(size) {
    const root = document.documentElement;
    root.removeAttribute('data-fontsize');
    if (size && size !== 'default') root.setAttribute('data-fontsize', size);
}

function initFontSize() {
    const saved = localStorage.getItem('catura-font') || 'default';
    applyFontSize(saved);
}

// ============================
// 🌐 WEB SEARCH & INTENT
// ============================
let webSearchEnabled = false;

function detectClientIntent(message) {
    const lower = message.toLowerCase();
    if (/weather|temperature|humidity|forecast|sunny|cloudy|will it rain|feels like/.test(lower)) return "weather";
    if (/share price|stock price|stock market|nse|bse|nifty|sensex|crypto|bitcoin|ethereum|exchange rate|rupee/.test(lower)) return "finance";
    if (/(tata|reliance|infosys|wipro|hdfc|icici|bajaj|sbi).*(price|stock|share)|(price|stock|share).*(tata|reliance|infosys|wipro|hdfc|icici|bajaj|sbi)/.test(lower)) return "finance";
    if (/cricket|ipl|test match|\bodi\b|\bt20\b|football|soccer|fifa|premier league|\bnba\b|\bnfl\b|tennis|live score|match today/.test(lower)) return "sports";
    if (/\bnews\b|headlines|breaking|latest news|current events|what happened|recent news/.test(lower)) return "news";
    if (/latest|currently?|right now|\btoday\b|recently?|who is|price of|how much|find (me|out)|search for|look up/.test(lower)) return "web_search";
    return "general";
}

function needsWebSearch(message) {
    return detectClientIntent(message) !== "general";
}

async function performWebSearch(query) {
    try {
        const res = await fetch(`/search?q=${encodeURIComponent(query)}&max_results=5`);
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        return [];
    }
}

// ============================
// ✍️ STREAMER WITH TOOLS (FAST)
// ============================
async function streamWordsWithTools(botMsg, wrapper, reader, decoder, chatbox, onToolUsed) {
    let buffer = "";
    let fullReply = "";
    let renderTimer = null;

    const scheduleRender = () => {
        if (renderTimer) return;
        renderTimer = setTimeout(() => {
            renderTimer = null;
            if (fullReply) {
                botMsg.innerHTML = formatMessage(repairTruncated(fullReply)) + '<span class="stream-cursor"></span>';
                chatbox.scrollTop = chatbox.scrollHeight;
            }
        }, 40);
    };

    try {
        outer:
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const payload = line.slice(6).trim();
                if (payload === "[DONE]") break outer;
                try {
                    const data = JSON.parse(payload);
                    if (data.tool_used !== undefined) {
                        if (typeof onToolUsed === "function") onToolUsed(data.tool_used);
                        continue;
                    }
                    if (data.error) {
                        if (!fullReply.trim()) botMsg.innerHTML = `<p style="color:#e06c6c">⚠️ ${data.error}</p>`;
                        if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
                        return fullReply || "";
                    }
                    if (data.token) {
                        fullReply += data.token;
                        // Render the very first token instantly for snappy feel
                        if (fullReply.length === data.token.length) {
                            botMsg.innerHTML = formatMessage(repairTruncated(fullReply)) + '<span class="stream-cursor"></span>';
                            chatbox.scrollTop = chatbox.scrollHeight;
                        } else {
                            scheduleRender();
                        }
                    }
                } catch { continue; }
            }
        }
    } catch (e) { console.warn("Stream read error:", e); }

    if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }

    if (fullReply.trim()) {
        botMsg.innerHTML = formatMessage(repairTruncated(fullReply));
        wrapper.dataset.raw = fullReply;
        chatbox.scrollTop = chatbox.scrollHeight;
        return fullReply;
    }

    botMsg.innerHTML = `<p style="color:#e06c6c">⚠️ No response received. Please try again.</p>`;
    return "";
}

window.toggleWebSearch = function() {
    webSearchEnabled = !webSearchEnabled;
    const chip = document.getElementById("webSearchChip");
    if (chip) chip.style.display = webSearchEnabled ? "flex" : "none";
    showToast(webSearchEnabled ? "🌐 Web search enabled" : "Web search disabled", 1500);
};

// ============================
// ➕ PLUS MENU
// ============================
function togglePlusMenu(e) {
    e.stopPropagation();
    document.getElementById('plusDropdown')?.classList.toggle('open');
}

document.addEventListener('click', function(e) {
    const wrap = document.getElementById('plusMenuWrap');
    if (wrap && !wrap.contains(e.target)) {
        document.getElementById('plusDropdown')?.classList.remove('open');
    }
});

function handlePlusAction(action) {
    document.getElementById('plusDropdown')?.classList.remove('open');
    if (action === 'file') document.getElementById('fileInput')?.click();
    else if (action === 'connect') showToast('Connect apps — coming soon!');
    else if (action === 'think') showToast('Think mode — coming soon!');
    else if (action === 'research') showToast('Deep research — coming soon!');
    else if (action === 'search') toggleWebSearch();
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    showToast(`Selected: ${Array.from(files).map(f => f.name).join(', ')}`);
    event.target.value = '';
}

// ============================
// 🤖 MODEL SELECTOR — FIXED
// ============================
let selectedModel = 'dagr';

window.toggleModelSelector = function (e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('modelDropdown');
    const btn = document.getElementById('modelSelectorBtn');
    if (!dropdown || !btn) return;

    const isOpen = dropdown.classList.contains('open');
    closeAllModelMenus();
    if (isOpen) return;

    // Off-screen measurement (no flicker)
    const prev = {
        visibility: dropdown.style.visibility,
        opacity: dropdown.style.opacity,
        transform: dropdown.style.transform,
        transition: dropdown.style.transition,
        left: dropdown.style.left,
        top: dropdown.style.top,
        bottom: dropdown.style.bottom,
        pointerEvents: dropdown.style.pointerEvents,
    };

    dropdown.style.transition = 'none';
    dropdown.style.visibility = 'hidden';
    dropdown.style.opacity = '0';
    dropdown.style.transform = 'none';
    dropdown.style.pointerEvents = 'none';
    dropdown.style.left = '-9999px';
    dropdown.style.top = '-9999px';
    dropdown.style.bottom = 'auto';
    dropdown.classList.add('open');

    const dropH = dropdown.offsetHeight || 200;
    const dropW = Math.max(dropdown.offsetWidth || 0, 220);

    dropdown.classList.remove('open');
    dropdown.style.transition = prev.transition;
    dropdown.style.visibility = prev.visibility;
    dropdown.style.opacity = prev.opacity;
    dropdown.style.transform = prev.transform;
    dropdown.style.pointerEvents = prev.pointerEvents;

    // Position
    const rect = btn.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    const pad = 8;

    let top = rect.top - dropH - gap;
    if (top < pad) {
        const belowTop = rect.bottom + gap;
        if (belowTop + dropH > vh - pad) {
            const spaceAbove = rect.top;
            const spaceBelow = vh - rect.bottom;
            if (spaceAbove >= spaceBelow) top = pad;
            else top = Math.max(pad, vh - dropH - pad);
        } else {
            top = belowTop;
        }
    }
    top = Math.max(pad, Math.min(top, vh - dropH - pad));

    let left = rect.right - dropW;
    if (left + dropW > vw - pad) left = vw - dropW - pad;
    if (left < pad) left = pad;

    dropdown.style.position = 'fixed';
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
    dropdown.style.bottom = 'auto';

    dropdown.classList.add('open');
    btn.classList.add('open');

    const moreModels = ['apep', 'gemma', 'gemma4'];
    if (moreModels.includes(selectedModel)) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { toggleMoreModels(null); });
        });
    }
};

window.selectModel = function (modelId, modelName) {
    selectedModel = modelId.toLowerCase();
    const modelNameEl = document.getElementById('modelName');
    if (modelNameEl) modelNameEl.textContent = modelName;
    document.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
    const activeOption = document.querySelector(`[data-model="${modelId}"]`);
    if (activeOption) activeOption.classList.add('active');
    closeAllModelMenus();
    showToast(`✓ Switched to ${modelName}`, 1500);
};

function closeAllModelMenus() {
    document.getElementById('modelDropdown')?.classList.remove('open');
    document.getElementById('modelSelectorBtn')?.classList.remove('open');
    document.getElementById('moreModelsPanel')?.classList.remove('open');
    document.getElementById('moreModelsRow')?.classList.remove('open');
}

window.toggleMoreModels = function (e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('moreModelsPanel');
    const row = document.getElementById('moreModelsRow');
    const dropdownEl = document.getElementById('modelDropdown');
    if (!panel || !row || !dropdownEl) return;

    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        row.classList.remove('open');
        return;
    }

    const prevTr = panel.style.transition;
    const prevVis = panel.style.visibility;
    const prevOp = panel.style.opacity;
    const prevTrans = panel.style.transform;
    const prevPE = panel.style.pointerEvents;

    panel.style.transition = 'none';
    panel.style.visibility = 'hidden';
    panel.style.opacity = '0';
    panel.style.transform = 'none';
    panel.style.pointerEvents = 'none';
    panel.style.left = '-9999px';
    panel.style.top = '-9999px';
    panel.classList.add('open');

    const panelW = panel.offsetWidth || 230;
    const panelH = panel.offsetHeight || 210;

    panel.classList.remove('open');
    panel.style.transition = prevTr;
    panel.style.visibility = prevVis;
    panel.style.opacity = prevOp;
    panel.style.transform = prevTrans;
    panel.style.pointerEvents = prevPE;

    const dropRect = dropdownEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 8;
    const pad = 8;

    let left = dropRect.right + gap;
    if (left + panelW > vw - pad) left = dropRect.left - panelW - gap;
    if (left < pad) left = pad;

    let top = dropRect.top;
    top = Math.max(pad, Math.min(top, vh - panelH - pad));

    panel.style.position = 'fixed';
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';

    panel.classList.add('open');
    row.classList.add('open');
};

document.addEventListener('click', function (e) {
    const wrap = document.getElementById('modelSelectorWrap');
    const panel = document.getElementById('moreModelsPanel');
    const insideWrap = wrap && wrap.contains(e.target);
    const insidePanel = panel && panel.contains(e.target);
    if (!insideWrap && !insidePanel) closeAllModelMenus();
});

window.addEventListener('resize', closeAllModelMenus);
window.addEventListener('scroll', closeAllModelMenus, true);

function getSelectedModel() {
    return selectedModel;
}

// ============================
// ✅ PRIVACY MODAL
// ============================
window.showPrivacyModal = function () {
    document.getElementById('privacyModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'privacyModal';
    modal.className = 'priv-modal-overlay';
    modal.innerHTML = `
        <div class="priv-modal-box" role="dialog" aria-modal="true">
            <div class="priv-modal-header">
                <div class="priv-modal-title-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <h2 class="priv-modal-title">Data &amp; Privacy</h2>
                </div>
                <button class="priv-modal-close" onclick="document.getElementById('privacyModal').remove()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="priv-modal-body">
                <p class="priv-intro">We respect your privacy and are committed to protecting your data.</p>
                <div class="priv-item"><div class="priv-num">1</div><div><p class="priv-item-title">Data We Collect</p><p class="priv-item-text">We may collect basic info such as your email, chat messages, and usage data.</p></div></div>
                <div class="priv-item"><div class="priv-num">2</div><div><p class="priv-item-title">How We Use Your Data</p><p class="priv-item-text">To provide responses, improve AI performance, and ensure security. We do not sell your data.</p></div></div>
                <div class="priv-item"><div class="priv-num">3</div><div><p class="priv-item-title">AI Conversations</p><p class="priv-item-text">Conversations may be stored to improve quality. Avoid sharing sensitive info.</p></div></div>
                <div class="priv-item"><div class="priv-num">4</div><div><p class="priv-item-title">Data Security</p><p class="priv-item-text">We implement reasonable security measures.</p></div></div>
                <div class="priv-item"><div class="priv-num">5</div><div><p class="priv-item-title">Your Control</p><p class="priv-item-text">You can request data deletion at any time by contacting support.</p></div></div>
                <div class="priv-contact">
                    <p class="priv-contact-title">Contact Us</p>
                    <div class="priv-contact-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <a href="mailto:support@catura.ai" class="priv-link">support@catura.ai</a>
                    </div>
                </div>
            </div>
            <div class="priv-modal-footer">
                <button class="priv-close-btn" onclick="document.getElementById('privacyModal').remove()">Close</button>
            </div>
        </div>`;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('priv-modal-open'));
};

// ============================
// ✅ DELETE ACCOUNT MODAL
// ============================
window.showDeleteAccountModal = function () {
    document.getElementById('deleteAccountModal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'deleteAccountModal';
    modal.className = 'priv-modal-overlay';
    modal.innerHTML = `
        <div class="priv-modal-box del-modal-box" role="dialog" aria-modal="true">
            <div class="del-modal-icon-wrap">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e06c6c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
            </div>
            <h2 class="del-modal-title">Delete Account</h2>
            <p class="del-modal-desc">This action is <strong>permanent and irreversible</strong>. All your data will be deleted forever.</p>
            <p class="del-modal-confirm-label">Type <span class="del-confirm-word">DELETE</span> to confirm:</p>
            <input type="text" id="deleteConfirmInput" class="del-confirm-input" placeholder="Type DELETE here" autocomplete="off" oninput="checkDeleteConfirm()">
            <div class="del-modal-actions">
                <button class="del-cancel-btn" onclick="document.getElementById('deleteAccountModal').remove()">Cancel</button>
                <button class="del-confirm-btn" id="deleteConfirmBtn" disabled onclick="executeDeleteAccount()">Delete my account</button>
            </div>
        </div>`;
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('priv-modal-open'));
    setTimeout(() => document.getElementById('deleteConfirmInput')?.focus(), 100);
};

window.checkDeleteConfirm = function () {
    const val = document.getElementById('deleteConfirmInput')?.value || '';
    const btn = document.getElementById('deleteConfirmBtn');
    if (btn) btn.disabled = val !== 'DELETE';
};

window.executeDeleteAccount = async function () {
    const btn = document.getElementById('deleteConfirmBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Deleting…'; }
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) { alert('Not logged in.'); if (btn) { btn.disabled = false; btn.textContent = 'Delete my account'; } return; }
        const res = await fetch('/delete_account', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            document.getElementById('deleteAccountModal').remove();
            await supabaseClient.auth.signOut();
            window.location.href = '/auth';
        } else {
            const data = await res.json().catch(() => ({}));
            alert(data.error || 'Failed to delete account.');
            if (btn) { btn.disabled = false; btn.textContent = 'Delete my account'; }
        }
    } catch (e) {
        alert('Network error.');
        if (btn) { btn.disabled = false; btn.textContent = 'Delete my account'; }
    }
};