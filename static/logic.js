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

        const avatarEl  = document.getElementById("userAvatar");
        const nameEl    = document.getElementById("userFullname");
        const railAvatar = document.getElementById("railAvatar");

        if (avatarEl)   avatarEl.textContent  = initials;
        if (nameEl)     nameEl.textContent     = fullName;
        if (railAvatar) railAvatar.textContent = initials;
    }
}

// ============================
// ✅ SESSION MANAGEMENT
// ============================
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

let currentSessionId = generateSessionId();
let chatTitle = "New Chat";
let firstMessage = true;

// ============================
// 👻 GHOST CHAT STATE
// ============================
let ghostChatEnabled = false;
let ghostMemory = [];          // sliding window — max 12 exchanges (24 messages)
const GHOST_WINDOW = 24;       // 12 user + 12 bot = 24 messages kept

window.toggleGhostChat = function () {
    ghostChatEnabled = !ghostChatEnabled;
    const btn    = document.getElementById('ghostChatBtn');
    const banner = document.getElementById('ghostBanner');

    if (ghostChatEnabled) {
        // Activate ghost mode
        ghostMemory = [];
        btn?.classList.add('ghost-active');
        if (banner) banner.style.display = 'flex';
        document.getElementById('app')?.classList.add('ghost-mode');
        // Start fresh ghost session — show ghost greeting
        newChat();
        showToast('Ghost Chat ON — nothing will be saved');
    } else {
        // Deactivate — wipe ghost memory, return to normal
        ghostMemory = [];
        btn?.classList.remove('ghost-active');
        if (banner) banner.style.display = 'none';
        document.getElementById('app')?.classList.remove('ghost-mode');
        // Clear ghost chat and show normal greeting
        newChat();
        showToast('Ghost Chat OFF — back to normal');
    }
};


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
        morning: [
            `Good morning, ${userName}`,
            `Rise and shine, ${userName}!`,
            `Good morning! Ready to code, ${userName}?`,
            `☀️ Good morning, ${userName}!`,
        ],
        afternoon: [
            `Good afternoon, ${userName}`,
            `Hope you're having a great afternoon, ${userName}!`,
            `Afternoon, ${userName}!`,
            `🌤️ Good afternoon, ${userName}!`,
        ],
        evening: [
            `Good evening, ${userName}`,
            `Evening, ${userName}!`,
            `Good evening! Let's build something, ${userName}`,
            `🌙 Good evening, ${userName}!`,
        ],
        night: [
            `Good night, ${userName}`,
            `Night owl coding session, ${userName}?`,
            `Burning the midnight oil, ${userName}?`,
            `🌌 Good night, ${userName}!`,
        ]
    };
    
    const greetingList = greetings[timeOfDay];
    return greetingList[Math.floor(Math.random() * greetingList.length)];
}

function displayGreeting() {
    const userNameEl = document.getElementById("userFullname");
    const nickname = localStorage.getItem("catura_call_name");
    const userName = nickname && nickname.trim() ? nickname.trim() : (userNameEl?.textContent || "User");

    const isGhost = typeof ghostChatEnabled !== 'undefined' && ghostChatEnabled;

    const greetingText = isGhost
        ? " You saw nothing. Ghost Mode enabled."
        : getGreetingMessage(userName);

    const subText = isGhost
        ? "Nothing is saved. Nothing is remembered."
        : "How can I help you today?";

    // Colors: ghost = red palette, normal = green palette
    const accentColor  = isGhost ? "#e05555"   : "#10a37f";
    const accentColor2 = isGhost ? "#c03030"   : "#0d8c6d";
    const subColor     = isGhost ? "#a06060"   : "#888";
    const bgGradient   = isGhost
        ? "linear-gradient(135deg, #e0555511 0%, #c0303011 100%)"
        : "linear-gradient(135deg, #10a37f11 0%, #0d8c6d11 100%)";
    const borderColor  = isGhost ? "#e0555522" : "#10a37f22";

    // Create greeting element
    const greetingDiv = document.createElement("div");
    greetingDiv.style.cssText = `
        text-align: center;
        margin-top: 20px;
        margin-bottom: 30px;
        padding: 20px;
        background: ${bgGradient};
        border: 1px solid ${borderColor};
        border-radius: 12px;
        animation: fadeIn 0.6s ease-in-out;
    `;
    greetingDiv.innerHTML = `
        <div style="font-size: 24px; font-weight: 600; color: ${accentColor}; letter-spacing: -0.02em;">
            ${greetingText}
        </div>
        <div style="font-size: 14px; color: ${subColor}; margin-top: 8px;">
            ${subText}
        </div>
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
// 🔀 SIDEBAR TOGGLE
// ============================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const iconRail = document.getElementById("iconRail");
    const overlay  = document.getElementById("sidebarOverlay");
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
    const sidebar  = document.getElementById("sidebar");
    const overlay  = document.getElementById("sidebarOverlay");
    const hamburger = document.querySelector(".mobile-hamburger");
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    if (hamburger) hamburger.classList.remove("is-open");
}

window.openSidebarTo = function (section) {
    const sidebar  = document.getElementById("sidebar");
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

// ============================
// 💡 SUGGESTIONS
// ============================
function useSuggestion(el) {
    const input = document.getElementById("input");
    input.value = el.innerText.trim();
    input.focus();
    if (typeof autoResize === "function") autoResize();
}

// ============================
// �� QUERY COMPLEXITY DETECTOR
// ============================
function isHeavyQuery(text) {
    const lower = text.toLowerCase().trim();
    if (lower.length > 80) return true;
    const heavyKeywords = [
        "explain", "write", "create", "build",
        "code", "script", "program", "function",
        "debug", "fix", "error", "bug",
        "step by step", "line by line", "breakdown",
        "compare", "difference between", " vs ",
        "how does", "how do i", "how to",
        "generate", "summarize", "analyze",
        "essay", "give me", "make a",
        "implement", "refactor", "optimiz",
        "algorithm", "convert", "translate"
    ];
    return heavyKeywords.some(kw => lower.includes(kw));
}

// ============================
// 🩹 REPAIR TRUNCATED RESPONSES
// ============================
// If the AI was cut off mid-output (token limit or relay handoff),
// the response may end with an unclosed code fence (```).
// This closes any dangling fences so the markdown renderer doesn't break.
function repairTruncated(text) {
    const fenceMatches = (text.match(/```/g) || []).length;
    // Odd number of ``` means one is unclosed
    if (fenceMatches % 2 !== 0) {
        // Close it — append newline + closing fence
        text = text.trimEnd() + "\n```";
    }
    return text;
}

// ============================
// 🧾 MARKDOWN RENDERER — v3
// Full ChatGPT/Claude-quality rendering:
//   h1–h6, ul, ol, roman-numeral lists, alpha lists,
//   nested lists, blockquotes, tables, code, inline formatting.
// ============================
function formatMessage(rawText) {
    if (!rawText) return "";

    // ── STEP 1: Stash fenced code blocks ──────────────────────────────────
    const codeBlocks = [];
    let text = rawText.replace(/```([\w+\-#. ]*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
        const language = lang.trim() || "text";
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
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

    // ── STEP 2: Escape HTML in non-code sections only ─────────────────────
    text = text.split(/(\x00CODE\d+\x00)/).map((part, i) => {
        if (i % 2 === 1) return part;
        return part
            .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }).join("");

    // ── STEP 3: Tables ────────────────────────────────────────────────────
    text = text.replace(/((?:[ \t]*\|.+\|\s*\n?)+)/g, (block) => {
        const rawRows = block.trim().split("\n").map(r => r.trim()).filter(Boolean);
        if (rawRows.length < 2) return block;
        const isSep = r => /^\|[\s:|\-]+\|$/.test(r);
        if (!isSep(rawRows[1])) return block;

        const parseRow = r =>
            r.replace(/^\||\|$/g, "").split("|").map(c => c.trim());

        const sepCells = parseRow(rawRows[1]);
        const aligns   = sepCells.map(c => {
            if (/^:-+:$/.test(c)) return 'center';
            if (/^-+:$/.test(c))  return 'right';
            return 'left';
        });

        const headers = parseRow(rawRows[0]);
        const bodyRows = rawRows.slice(2);

        const thead = `<thead><tr>${
            headers.map((h, i) =>
                `<th style="text-align:${aligns[i] || 'left'}">${applyInline(h)}</th>`
            ).join("")
        }</tr></thead>`;

        const tbody = `<tbody>${
            bodyRows.map(r =>
                `<tr>${parseRow(r).map((c, i) =>
                    `<td style="text-align:${aligns[i] || 'left'}">${applyInline(c)}</td>`
                ).join("")}</tr>`
            ).join("")
        }</tbody>`;

        return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
    });

    // ── STEP 4: Block-level elements ──────────────────────────────────────
    const outputLines = [];
    const rawLines    = text.split("\n");
    let i = 0;

    // Helper: detect list-item type
    const isUL      = s => /^[-*•+]\s/.test(s);
    const isOL      = s => /^\d+[.)]\s/.test(s);
    const isRoman   = s => /^[ivxlcdmIVXLCDM]+[.)]\s/i.test(s) && s.length < 20;
    const isAlpha   = s => /^[a-z][.)]\s/.test(s) || /^[A-Z][.)]\s/.test(s);

    while (i < rawLines.length) {
        const line    = rawLines[i];
        const trimmed = line.trim();

        // Headings h1–h6
        const h6 = trimmed.match(/^#{6}\s+(.+)$/); if (h6) { outputLines.push(`<h6>${applyInline(h6[1])}</h6>`); i++; continue; }
        const h5 = trimmed.match(/^#{5}\s+(.+)$/);  if (h5) { outputLines.push(`<h5>${applyInline(h5[1])}</h5>`); i++; continue; }
        const h4 = trimmed.match(/^#{4}\s+(.+)$/);  if (h4) { outputLines.push(`<h4>${applyInline(h4[1])}</h4>`); i++; continue; }
        const h3 = trimmed.match(/^###\s+(.+)$/);   if (h3) { outputLines.push(`<h3>${applyInline(h3[1])}</h3>`); i++; continue; }
        const h2 = trimmed.match(/^##\s+(.+)$/);    if (h2) { outputLines.push(`<h2>${applyInline(h2[1])}</h2>`); i++; continue; }
        const h1 = trimmed.match(/^#\s+(.+)$/);     if (h1) { outputLines.push(`<h1>${applyInline(h1[1])}</h1>`); i++; continue; }

        // Horizontal rule
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { outputLines.push("<hr>"); i++; continue; }

        // Blockquote — collect consecutive > lines
        if (/^&gt;\s?/.test(trimmed)) {
            const bqLines = [];
            while (i < rawLines.length && /^&gt;\s?/.test(rawLines[i].trim())) {
                bqLines.push(applyInline(rawLines[i].trim().replace(/^&gt;\s?/, "")));
                i++;
            }
            outputLines.push(`<blockquote>${bqLines.join("<br>")}</blockquote>`);
            continue;
        }

        // Unordered list (-, *, •, +) — supports indented sub-lists
        if (isUL(trimmed)) {
            outputLines.push(buildList(rawLines, i, 'ul'));
            // advance i past all consumed lines
            let consumed = countListLines(rawLines, i, isUL);
            i += consumed;
            continue;
        }

        // Roman numeral list (i. ii. iii. / I. II. III.)
        if (isRoman(trimmed) && !isOL(trimmed)) {
            const items = [];
            const listClass = /^[ivxlcdm]+[.)]/i.test(trimmed) ? 'list-roman' : 'list-roman-upper';
            while (i < rawLines.length && isRoman(rawLines[i].trim()) && !isOL(rawLines[i].trim())) {
                const t = rawLines[i].trim();
                items.push(`<li>${applyInline(t.replace(/^[ivxlcdmIVXLCDM]+[.)]\s/, ""))}</li>`);
                i++;
            }
            outputLines.push(`<ol class="${listClass}">${items.join("")}</ol>`);
            continue;
        }

        // Alpha list (a. b. c. / A. B. C.)
        if (isAlpha(trimmed)) {
            const items = [];
            const upper = /^[A-Z][.)]/.test(trimmed);
            while (i < rawLines.length && isAlpha(rawLines[i].trim())) {
                const t = rawLines[i].trim();
                items.push(`<li>${applyInline(t.replace(/^[a-zA-Z][.)]\s/, ""))}</li>`);
                i++;
            }
            outputLines.push(`<ol class="${upper ? 'list-alpha-upper' : 'list-alpha'}">${items.join("")}</ol>`);
            continue;
        }

        // Ordered list (1. 2. 3.) — preserve original numbers
        if (isOL(trimmed)) {
            const items = [];
            while (i < rawLines.length && isOL(rawLines[i].trim())) {
                const t = rawLines[i].trim();
                const numMatch = t.match(/^(\d+)[.)]\s/);
                const num = numMatch ? parseInt(numMatch[1], 10) : null;
                const content = applyInline(t.replace(/^\d+[.)]\s/, ""));
                items.push(num !== null ? `<li value="${num}">${content}</li>` : `<li>${content}</li>`);
                i++;
            }
            outputLines.push(`<ol>${items.join("")}</ol>`);
            continue;
        }

        // Code placeholder — pass through
        if (/^\x00CODE\d+\x00$/.test(trimmed)) {
            outputLines.push(trimmed);
            i++;
            continue;
        }

        // Blank line — paragraph break
        if (!trimmed) {
            outputLines.push("");
            i++;
            continue;
        }

        // Table pass-through
        if (/^<(div class="table-wrap"|table|\/div|\/table|thead|tbody|tr|th|td)/.test(trimmed)) {
            outputLines.push(line);
            i++;
            continue;
        }

        // Plain text — apply inline formatting
        outputLines.push(applyInline(trimmed));
        i++;
    }

    // ── STEP 5: Group plain text lines into <p> blocks ────────────────────
    // Key fix: each non-blank, non-block line becomes its own <p> rather than
    // being merged with its neighbour — prevents run-on walls of text.
    let html    = "";
    let paraBuf = [];

    const flushPara = () => {
        if (paraBuf.length) {
            // Join lines that are truly continuation (no blank separator) into one <p>,
            // but treat each blank-separated group as its own paragraph.
            html += `<p>${paraBuf.join(" ")}</p>`;
            paraBuf = [];
        }
    };

    const BLOCK_RE = /^(<(h[1-6]|ul|ol|blockquote|hr|div|table|thead|tbody|tr|th|td)|<\/|<div|\x00CODE)/;

    for (const ln of outputLines) {
        if (!ln) { flushPara(); continue; }
        if (BLOCK_RE.test(ln)) { flushPara(); html += ln; continue; }
        paraBuf.push(ln);
    }
    flushPara();

    // ── STEP 6: Restore code blocks ───────────────────────────────────────
    html = html.replace(/\x00CODE(\d+)\x00/g, (_, idx) => codeBlocks[+idx]);

    // ── STEP 7: Merge adjacent same-type list blocks ──────────────────────
    html = html.replace(/<\/ol>\s*<ol>/g, "");
    html = html.replace(/<\/ul>\s*<ul>/g, "");

    return html;
}

// ── Nested list builder ───────────────────────────────────────────────────────
// Handles indented sub-lists by tracking leading whitespace depth.
function buildList(lines, start, type) {
    const items = [];
    let i = start;
    const isItem = type === 'ul'
        ? s => /^[-*•+]\s/.test(s)
        : s => /^\d+[.)]\s/.test(s);

    while (i < lines.length && isItem(lines[i].trim())) {
        const content = applyInline(lines[i].trim().replace(/^[-*•+]\s|^\d+[.)]\s/, ""));
        items.push(`<li>${content}</li>`);
        i++;
    }
    return `<${type}>${items.join("")}</${type}>`;
}

function countListLines(lines, start, isItem) {
    let count = 0;
    let i = start;
    while (i < lines.length && isItem(lines[i].trim())) { count++; i++; }
    return count || 1;
}

// ── Inline formatting helper (bold, italic, inline-code, links) ──────────────
function applyInline(text) {
    if (!text) return text;
    // Inline code — protect first so bold/italic don't match inside it
    const inlineCode = [];
    text = text.replace(/`([^`]+)`/g, (_, c) => {
        inlineCode.push(`<span class="inline-code">${c.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>`);
        return `\x01IC${inlineCode.length - 1}\x01`;
    });

    // Bold+italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic (only single asterisk surrounded by non-space)
    text = text.replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "<em>$1</em>");
    // Underline via __text__
    text = text.replace(/__(.+?)__/g, "<u>$1</u>");
    // Strikethrough
    text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");
    // Links  [label](url)
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Restore inline code
    text = text.replace(/\x01IC(\d+)\x01/g, (_, i) => inlineCode[+i]);
    return text;
}

// ============================
// 📋 COPY CODE
// ============================
function copyCode(btn) {
    const code = btn.closest(".code-block").querySelector("code").innerText;
    navigator.clipboard.writeText(code).then(() => {
        btn.textContent = "✓ Copied!";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
    }).catch(() => showToast("Failed to copy code"));
}

// ============================
// 📋 COPY BOT ANSWER
// ============================
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

// ============================
// 📋 COPY USER MESSAGE
// ============================
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
// 🤔 THINKING INDICATOR
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

// ============================
// 💬 DOTS INDICATOR
// ============================
function createLightIndicator() {
    const div = document.createElement("div");
    div.classList.add("message", "bot", "typing");
    div.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
    return div;
}

// ============================
// 📦 USER BUBBLE (supports file attachments)
// ============================
function createUserBubble(text, files) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("user-msg-wrapper");

    // File attachments (images + docs) shown above text
    if (files && files.length > 0) {
        const filesDiv = document.createElement("div");
        filesDiv.innerHTML = buildFileAttachHTML(files);
        wrapper.appendChild(filesDiv);
    }

    // Text bubble (only if there is text)
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
        <button class="bot-copy-btn" onclick="copyBotAnswer(this)" title="Copy">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>`;

    // Per-response disclaimer — mobile only, always moves to latest response
    const isMobileDisclaimer = window.innerWidth <= 768;
    if (isMobileDisclaimer) {
        // Remove disclaimer from all previous bot wrappers so it only shows on latest
        document.querySelectorAll(".bot-response-disclaimer").forEach(el => el.remove());

        const disclaimer = document.createElement("div");
        disclaimer.classList.add("bot-response-disclaimer");
        disclaimer.innerHTML = `
            <img src="static/logo.png" alt="" style="width:14px;height:14px;border-radius:3px;opacity:0.45;flex-shrink:0;">
            <span>Catura can make mistakes. Double-check responses.</span>`;
        wrapper.appendChild(botMsg);
        wrapper.appendChild(actionsRow);
        wrapper.appendChild(disclaimer);
    } else {
        wrapper.appendChild(botMsg);
        wrapper.appendChild(actionsRow);
    }
    return { wrapper, botMsg };
}


// ============================
// ➕ NEW CHAT
// ============================
window.newChat = function () {
    const overlay = document.getElementById("settingsOverlay");
    if (overlay) overlay.classList.remove("active");

    currentSessionId = generateSessionId();
    firstMessage = true;

    const chatbox   = document.getElementById("chatbox");
    const inputArea = document.getElementById("inputArea");
    const app       = document.getElementById("app");

    if (chatbox)   chatbox.innerHTML = "";
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

// ============================
// 🚪 LOGOUT
// ============================
window.logoutUser = async function () {
    if (confirm("Are you sure you want to logout?")) {
        await supabaseClient.auth.signOut();
        window.location.href = "/auth.html";
    }
};

// ============================
// 👤 USER PROFILE DROPDOWN
// ============================
window.toggleUserDropdown = function (e) {
    e.stopPropagation();
    const dropdown = document.getElementById("userDropdown");
    const btn      = document.getElementById("userProfileBtn");
    const isOpen   = dropdown.classList.contains("open");
    if (isOpen) {
        dropdown.classList.remove("open");
        btn.classList.remove("active");
    } else {
        dropdown.classList.add("open");
        btn.classList.add("active");
    }
};

window.closeUserDropdown = function () {
    document.getElementById("userDropdown")?.classList.remove("open");
    document.getElementById("userProfileBtn")?.classList.remove("active");
};

// Close dropdown when clicking anywhere outside
document.addEventListener("click", function (e) {
    const wrap = document.getElementById("userProfileWrap");
    if (wrap && !wrap.contains(e.target)) {
        closeUserDropdown();
    }
});

window.goToProfile = function () {
    closeUserDropdown();
    showSettings();
    // After settings opens, switch to profile tab
    setTimeout(() => {
        const profileTab = document.querySelector('.settings-nav-item[onclick*="profile"]');
        if (profileTab) profileTab.click();
    }, 50);
};

// ============================
// 🧭 MAIN MENU
// ============================
window.showMainMenu = function () {
    // Close history accordion if open
    const trigger = document.getElementById("historyAccordionTrigger");
    const list    = document.getElementById("historyAccordionList");
    if (trigger) trigger.classList.remove("open");
    if (list)    { list.classList.remove("open"); list.innerHTML = ""; }
};

// ============================
// ⚙️ SETTINGS OVERLAY
// ============================
// ============================
// ⚙️ SETTINGS OVERLAY
// ============================
window.showSettings = function () {
    const overlay = document.getElementById("settingsOverlay");
    const email    = currentUser?.email || "Not logged in";
    const fullName = document.getElementById("userFullname")?.textContent || "User";
    const initials = document.getElementById("userAvatar")?.textContent  || "?";

    overlay.innerHTML = `
        <button class="settings-close-btn" onclick="closeSettings()" title="Close">✕</button>
        <div class="settings-panel-wrap">
            <div class="settings-nav">
                <h2 class="settings-nav-title">Settings</h2>
                <div class="settings-nav-item active" onclick="showSettingsTab('general', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m10.39-9.39l-4.24 4.24m-8.3 0l-4.24-4.24m12.53 8.53l4.24 4.24m-8.3 0l4.24-4.24"></path>
                    </svg> General
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('profile', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg> Profile
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('chats', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg> Chats
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('privacy', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg> Privacy
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('speech', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="8" y2="18"></line>
                        <line x1="12" y1="3" x2="12" y2="21"></line>
                        <line x1="16" y1="7" x2="16" y2="17"></line>
                        <line x1="4" y1="9" x2="4" y2="15"></line>
                        <line x1="20" y1="9" x2="20" y2="15"></line>
                    </svg> Speech
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('personalization', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg> Personalization
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('datacontrols', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                    </svg> Data controls
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('account', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="7" r="4"></circle>
                        <path d="M5.5 21a9 9 0 0 1 13 0"></path>
                    </svg> Account
                </div>
                <div class="settings-nav-item" onclick="showSettingsTab('shortcuts', this)">
                    <svg class="sn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                        <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"></path>
                    </svg> Shortcuts
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

// ============================
// ✏️ EDIT DISPLAY NAME
// ============================
window.editDisplayName = async function () {
    const currentName = document.getElementById("userFullname")?.textContent || "User";
    const newName = prompt("Enter your new display name:", currentName);
    
    if (!newName || newName.trim() === "" || newName.trim() === currentName) {
        return;
    }

    const trimmedName = newName.trim();

    try {
        const { data, error } = await supabaseClient.auth.updateUser({
            data: { full_name: trimmedName }
        });

        if (error) {
            console.error("❌ Update failed:", error.message);
            showToast("❌ Failed to update name. Please try again.");
            return;
        }

        currentUser = data.user;

        const parts = trimmedName.split(/\s+/).filter(Boolean);
        const initials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();

        const avatarEl    = document.getElementById("userAvatar");
        const nameEl      = document.getElementById("userFullname");
        const railAvatar  = document.getElementById("railAvatar");
        const scProfileName = document.querySelector(".sc-profile-name");

        if (avatarEl)   avatarEl.textContent  = initials;
        if (nameEl)     nameEl.textContent    = trimmedName;
        if (railAvatar) railAvatar.textContent = initials;
        if (scProfileName) scProfileName.textContent = trimmedName;

        showToast(`✓ Name updated to ${trimmedName}`);
        
        setTimeout(() => {
            showSettingsTab('profile', document.querySelector('.settings-nav-item.active'));
        }, 500);

    } catch (err) {
        console.error("❌ Error:", err);
        showToast("❌ Failed to update name. Please try again.");
    }
};

window.editCaturaCallName = function () {
    const existing = document.getElementById('caturaCallNameModal');
    if (existing) existing.remove();

    const current = localStorage.getItem('catura_call_name') || '';

    const modal = document.createElement('div');
    modal.id = 'caturaCallNameModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);animation:caturaModalFadeIn 0.2s ease;';

    modal.innerHTML = `
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;width:min(400px,92vw);padding:28px 24px 20px;box-shadow:0 24px 64px rgba(0,0,0,0.7);position:relative;animation:caturaModalSlideUp 0.25s cubic-bezier(0.34,1.2,0.64,1);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(16,163,127,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <div>
                <p style="margin:0;font-size:15px;font-weight:600;color:#eee;">What should Catura call you?</p>
                <p style="margin:2px 0 0;font-size:12px;color:#666;">Only shown in your home screen greeting</p>
            </div>
        </div>
        <div style="height:1px;background:#222;margin:16px 0;"></div>
        <input id="caturaCallNameInput" type="text" placeholder="Enter a name or nickname…" maxlength="40"
            value="${current.replace(/"/g,'&quot;')}"
            style="width:100%;box-sizing:border-box;background:#111;border:1.5px solid #333;border-radius:10px;padding:11px 14px;font-size:14px;color:#eee;outline:none;transition:border-color 0.2s;font-family:inherit;"
            onfocus="this.style.borderColor='#10a37f'" onblur="this.style.borderColor='#333'"
            onkeydown="if(event.key==='Enter')document.getElementById('caturaCallNameSave').click();if(event.key==='Escape')document.getElementById('caturaCallNameModal').remove();"
        >
        <p style="margin:8px 0 16px;font-size:11px;color:#555;">This name only appears in the "Good morning, …" greeting. Your display name stays unchanged.</p>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button onclick="document.getElementById('caturaCallNameModal').remove()"
                style="padding:9px 18px;border-radius:8px;border:1px solid #333;background:transparent;color:#999;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:background 0.15s;"
                onmouseover="this.style.background='#222'" onmouseout="this.style.background='transparent'">Cancel</button>
            <button id="caturaCallNameSave"
                style="padding:9px 20px;border-radius:8px;border:none;background:#10a37f;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.15s;"
                onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'"
                onclick="
                    const val = document.getElementById('caturaCallNameInput').value.trim();
                    if (val) {
                        localStorage.setItem('catura_call_name', val);
                    } else {
                        localStorage.removeItem('catura_call_name');
                    }
                    document.getElementById('caturaCallNameModal').remove();
                    if (typeof showToast === 'function') showToast(val ? '✓ Greeting name updated' : '✓ Greeting name cleared');
                    if (typeof displayGreeting === 'function') displayGreeting();
                ">Save</button>
        </div>
    </div>
    <style>
        @keyframes caturaModalFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes caturaModalSlideUp { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
    </style>`;

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    requestAnimationFrame(() => document.getElementById('caturaCallNameInput')?.focus());
};

// ============================
// 🔲 COMING SOON HELPER
// ============================
function comingSoonSection(title, items) {
    const rows = items.map(({ icon, label, sub }) => `
        <div class="sc-row disabled">
            <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${icon}
            </svg>
            <div class="sc-row-body">
                <p class="sc-row-label">${label}</p>
                <p class="sc-row-sub soon">${sub || 'Coming soon'}</p>
            </div>
        </div>`).join('');
    return `<div class="sc-section"><div class="sc-section-title">${title}</div>${rows}</div>`;
}

window.showSettingsTab = function (tab, clickedEl) {
    document.querySelectorAll(".settings-nav-item").forEach(el => el.classList.remove("active"));
    if (clickedEl) clickedEl.classList.add("active");

    const content  = document.getElementById("settingsContent");
    if (!content) return;

    const email    = currentUser?.email || "Not logged in";
    const fullName = document.getElementById("userFullname")?.textContent || "User";
    const initials = document.getElementById("userAvatar")?.textContent  || "?";

    const tabs = {

        general: `
            <div class="sc-section">
                <div class="sc-section-title">Appearance</div>

                <div class="sc-row sc-row-block">
                    <div class="sc-row-top">
                        <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path>
                        </svg>
                        <p class="sc-row-label">Theme</p>
                    </div>
                    <div class="theme-picker">
                        <button class="theme-option ${(localStorage.getItem('catura-theme') || 'dark') === 'light' ? 'active' : ''}" onclick="setTheme('light')" title="Light">
                            <div class="theme-preview light-preview">
                                <div class="tp-bar"></div>
                                <div class="tp-line"></div>
                                <div class="tp-line short"></div>
                                <div class="tp-bubble"></div>
                            </div>
                            <span>Light</span>
                        </button>
                        <button class="theme-option ${(localStorage.getItem('catura-theme') || 'dark') === 'auto' ? 'active' : ''}" onclick="setTheme('auto')" title="Auto">
                            <div class="theme-preview auto-preview">
                                <div class="tp-half-light"></div>
                                <div class="tp-half-dark"></div>
                                <div class="tp-bar"></div>
                                <div class="tp-line"></div>
                                <div class="tp-bubble"></div>
                            </div>
                            <span>Auto</span>
                        </button>
                        <button class="theme-option ${(localStorage.getItem('catura-theme') || 'dark') === 'dark' ? 'active' : ''}" onclick="setTheme('dark')" title="Dark">
                            <div class="theme-preview dark-preview">
                                <div class="tp-bar"></div>
                                <div class="tp-line"></div>
                                <div class="tp-line short"></div>
                                <div class="tp-bubble"></div>
                            </div>
                            <span>Dark</span>
                        </button>
                    </div>
                </div>

                <div class="sc-row sc-row-block" style="margin-top:8px;">
                    <div class="sc-row-top">
                        <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="4 7 4 4 20 4 20 7"></polyline>
                            <rect x="2" y="7" width="20" height="13" rx="2"></rect>
                            <path d="M9 17v-3m6 3v-3"></path>
                        </svg>
                        <p class="sc-row-label">Chat font size</p>
                    </div>
                    <div class="font-picker">
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'default' ? 'active' : ''}" onclick="setFontSize('default')">
                            <span class="font-sample">Aa</span>
                            <span>Default</span>
                        </button>
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'small' ? 'active' : ''}" onclick="setFontSize('small')">
                            <span class="font-sample small-sample">Aa</span>
                            <span>Small</span>
                        </button>
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'large' ? 'active' : ''}" onclick="setFontSize('large')">
                            <span class="font-sample large-sample">Aa</span>
                            <span>Large</span>
                        </button>
                        <button class="font-option ${(localStorage.getItem('catura-font') || 'default') === 'xlarge' ? 'active' : ''}" onclick="setFontSize('xlarge')">
                            <span class="font-sample xlarge-sample">Aa</span>
                            <span>X-Large</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Support</div>
                <div class="sc-row" onclick="openFeedbackModal('bug')">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Send bug report</p>
                        <p class="sc-row-sub">Help us fix issues</p>
                    </div>
                </div>
                <div class="sc-row" onclick="openFeedbackModal('feature')">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Request a feature</p>
                        <p class="sc-row-sub">Suggest improvements</p>
                    </div>
                </div>
            </div>`,

        profile: `
            <div class="sc-section">
                <div class="sc-section-title">Account</div>
                <div class="sc-profile-card">
                    <div class="sc-avatar">${initials}</div>
                    <div>
                        <p class="sc-profile-name">${fullName}</p>
                        <p class="sc-profile-email">${email}</p>
                    </div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Actions</div>
                <div class="sc-row" onclick="editDisplayName()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Edit display name</p>
                        <p class="sc-row-sub">Change how your name appears</p>
                    </div>
                </div>
                <div class="sc-row" onclick="editCaturaCallName()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">What should Catura call you?</p>
                        <p class="sc-row-sub">Set a nickname for your greeting</p>
                    </div>
                </div>
                <div class="sc-row danger" onclick="logoutUser()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Log out</p>
                        <p class="sc-row-sub">Sign out of your account</p>
                    </div>
                </div>
            </div>`,

        chats: `
            <div class="sc-section">
                <div class="sc-section-title">Manage chats</div>
                <div class="sc-row" onclick="archiveAllChats()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="21 8 21 21 3 21 3 8"></polyline>
                        <rect x="1" y="3" width="22" height="5"></rect>
                        <line x1="10" y1="12" x2="14" y2="12"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Archive all chats</p>
                        <p class="sc-row-sub">Hide all chats from your history</p>
                    </div>
                </div>
                <div class="sc-row danger" onclick="clearAllChats()">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Delete all chats</p>
                        <p class="sc-row-sub">Permanently remove all history</p>
                    </div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Preferences</div>
                <div class="sc-row" onclick="exportChatHistory()" style="cursor:pointer;">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Export chat history</p>
                        <p class="sc-row-sub">Download all your chats as a JSON file</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:8px;">
                        <polyline points="8 17 12 21 16 17"></polyline>
                        <line x1="12" y1="12" x2="12" y2="21"></line>
                        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
                    </svg>
                </div>
            </div>`,

        privacy: `
            <div class="sc-section">
                <div class="sc-section-title">Privacy controls</div>

                <!-- ✅ Data & Privacy — clickable, opens modal -->
                <div class="sc-row" onclick="showPrivacyModal()" style="cursor:pointer;">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Data & privacy</p>
                        <p class="sc-row-sub">View how we collect and use your data</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:8px;">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>


            </div>

            <!-- Toggles section -->
            <div class="sc-section">
                <div class="sc-section-title">Data preferences</div>

                <!-- Toggle 1: Location metadata -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">Location metadata</p>
                            <p class="sc-row-sub">Allow approximate location to improve nearby, regional, and timezone-aware responses.</p>
                        </div>
                        <label class="toggle-switch" title="Enable location metadata">
                            <input type="checkbox" id="locationMetadataToggle" onchange="handleLocationToggle(this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Toggle 2: Help to improve us — coming soon -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
                                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">Help to improve us</p>
                            <p class="sc-row-sub">Share anonymized usage data to help improve Catura AI <span class="badge-soon">Coming soon</span></p>
                        </div>
                        <label class="toggle-switch disabled-toggle" title="Coming soon">
                            <input type="checkbox" disabled>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>`,

        // ============================
        // 🔊 SPEECH TAB
        // ============================
        speech: `
            <div class="sc-section">
                <div class="sc-section-title">Voice & speech</div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Voice input</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Text-to-speech</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="8" y1="6" x2="8" y2="18"></line>
                        <line x1="12" y1="3" x2="12" y2="21"></line>
                        <line x1="16" y1="7" x2="16" y2="17"></line>
                        <line x1="4" y1="9" x2="4" y2="15"></line>
                        <line x1="20" y1="9" x2="20" y2="15"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Voice style</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
            </div>`,

        // ============================
        // 🎨 PERSONALIZATION TAB
        // ============================
        personalization: `
            <div class="sc-section">
                <div class="sc-section-title">Custom instructions</div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Custom instructions</p>
                        <p class="sc-row-sub soon">Tell Catura how to respond — coming soon</p>
                    </div>
                </div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">AI personality</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Memory</div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Memory & context</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
            </div>`,

        // ============================
        // 🗄️ DATA CONTROLS TAB
        // ============================
        datacontrols: `
            <div class="sc-section">
                <div class="sc-section-title">Your data</div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Export all data</p>
                        <p class="sc-row-sub soon">Download a copy of your data — coming soon</p>
                    </div>
                </div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Manage stored data</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Data sharing preferences</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
            </div>`,

        // ============================
        // 👤 ACCOUNT TAB
        // ============================
        account: `
            <div class="sc-section">
                <div class="sc-section-title">Account details</div>
                <div class="sc-profile-card">
                    <div class="sc-avatar">${initials}</div>
                    <div>
                        <p class="sc-profile-name">${fullName}</p>
                        <p class="sc-profile-email">${email}</p>
                    </div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Subscription</div>
                <div class="sc-row" onclick="openPlansModal()" style="cursor:pointer;">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Upgrade plan</p>
                        <p class="sc-row-sub soon">View all plans</p>
                    </div>
                </div>
                <div class="sc-row">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Current plan: Free</p>
                        <p class="sc-row-sub">Access to core models and features</p>
                    </div>
                </div>
            </div>
            <div class="sc-section">
                <div class="sc-section-title">Security</div>
                <div class="sc-row" onclick="openChangePasswordModal()" style="cursor:pointer;">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Change password</p>
                        <p class="sc-row-sub">Update your account password</p>
                    </div>
                </div>
                <div class="sc-row disabled">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="M12 8v4M12 16h.01"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label">Two-factor authentication</p>
                        <p class="sc-row-sub soon">Coming soon</p>
                    </div>
                </div>
                <div class="sc-row danger" onclick="showDeleteAccountModal()" style="cursor:pointer;">
                    <svg class="sc-row-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6M14 11v6"></path>
                        <path d="M9 6V4h6v2"></path>
                    </svg>
                    <div class="sc-row-body">
                        <p class="sc-row-label" style="color:#e06c6c;">Delete my account</p>
                        <p class="sc-row-sub">Permanently delete your account and all data</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e06c6c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-left:8px;">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </div>`,

        // ============================
        // ⌨️ SHORTCUTS TAB
        // ============================
        shortcuts: (() => {
            const sc = JSON.parse(localStorage.getItem('catura-shortcuts') || '{"darkMode":true,"newChat":true,"voice":false,"addFiles":true,"openSettings":true,"ghostChat":true}');
            return `
            <div class="sc-section">
                <div class="sc-section-title">Keyboard Shortcuts</div>
                <p class="sc-section-desc">Enable or disable keyboard shortcuts for quick actions.</p>

                <!-- Dark Mode -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">Dark mode</p>
                            <p class="sc-row-sub">Toggle dark/light theme <kbd class="shortcut-key">Ctrl</kbd>+<kbd class="shortcut-key">D</kbd></p>
                        </div>
                        <label class="toggle-switch" title="Toggle Dark Mode shortcut">
                            <input type="checkbox" id="sc-toggle-darkMode" ${sc.darkMode ? 'checked' : ''} onchange="saveShortcutToggle('darkMode', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- New Chat -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">New chat</p>
                            <p class="sc-row-sub">Start a new conversation <kbd class="shortcut-key">Ctrl</kbd>+<kbd class="shortcut-key">Shift</kbd>+<kbd class="shortcut-key">N</kbd></p>
                        </div>
                        <label class="toggle-switch" title="Toggle New Chat shortcut">
                            <input type="checkbox" id="sc-toggle-newChat" ${sc.newChat ? 'checked' : ''} onchange="saveShortcutToggle('newChat', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Voice -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">Voice input</p>
                            <p class="sc-row-sub">Activate voice input <kbd class="shortcut-key">Ctrl</kbd>+<kbd class="shortcut-key">Shift</kbd>+<kbd class="shortcut-key">V</kbd> <span class="badge-soon">Coming soon</span></p>
                        </div>
                        <label class="toggle-switch disabled-toggle" title="Coming soon">
                            <input type="checkbox" disabled>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Add Files -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">Add files</p>
                            <p class="sc-row-sub">Open file picker <kbd class="shortcut-key">Ctrl</kbd>+<kbd class="shortcut-key">U</kbd></p>
                        </div>
                        <label class="toggle-switch" title="Toggle Add Files shortcut">
                            <input type="checkbox" id="sc-toggle-addFiles" ${sc.addFiles ? 'checked' : ''} onchange="saveShortcutToggle('addFiles', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Open Settings -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 61a11 11 0 1 1 0-22 11 11 0 0 1 0 22zm38-7-7.7-1.4a31.7 31.7 0 0 0-2.4-5.7l4.4-6.5a3 3 0 0 0-.4-3.8l-8.5-8.5a3 3 0 0 0-3.8-.4l-6.5 4.4a31.7 31.7 0 0 0-5.7-2.4L56 22a3 3 0 0 0-3-2.5h-6A3 3 0 0 0 44 22l-1.4 7.7a31.7 31.7 0 0 0-5.7 2.4l-6.5-4.4a3 3 0 0 0-3.8.4l-8.5 8.5a3 3 0 0 0-.4 3.8l4.4 6.5a31.7 31.7 0 0 0-2.4 5.7L12 54a3 3 0 0 0-2.5 3v6A3 3 0 0 0 12 66l7.7 1.4a31.7 31.7 0 0 0 2.4 5.7l-4.4 6.5a3 3 0 0 0 .4 3.8l8.5 8.5a3 3 0 0 0 3.8.4l6.5-4.4a31.7 31.7 0 0 0 5.7 2.4L44 78a3 3 0 0 0 3 2.5h6A3 3 0 0 0 56 78l1.4-7.7a31.7 31.7 0 0 0 5.7-2.4l6.5 4.4a3 3 0 0 0 3.8-.4l8.5-8.5a3 3 0 0 0 .4-3.8l-4.4-6.5a31.7 31.7 0 0 0 2.4-5.7L88 46a3 3 0 0 0 2.5-3v-6A3 3 0 0 0 88 34z"/>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">Open settings</p>
                            <p class="sc-row-sub">Open the settings panel <kbd class="shortcut-key">Ctrl</kbd>+<kbd class="shortcut-key">A</kbd></p>
                        </div>
                        <label class="toggle-switch" title="Toggle Open Settings shortcut">
                            <input type="checkbox" id="sc-toggle-openSettings" ${sc.openSettings ? 'checked' : ''} onchange="saveShortcutToggle('openSettings', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Ghost Chat -->
                <div class="sc-row-block">
                    <div class="sc-row-top">
                        <div class="sc-row-icon-wrap">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 10h.01"></path><path d="M15 10h.01"></path>
                                <path d="M12 2a8 8 0 0 1 8 8v10l-3-3-3 3-3-3-3 3-3-3V10a8 8 0 0 1 8-8z"></path>
                            </svg>
                        </div>
                        <div class="sc-row-body">
                            <p class="sc-row-label">Ghost chat</p>
                            <p class="sc-row-sub">Toggle ghost chat mode <kbd class="shortcut-key">Ctrl</kbd>+<kbd class="shortcut-key">G</kbd></p>
                        </div>
                        <label class="toggle-switch" title="Toggle Ghost Chat shortcut">
                            <input type="checkbox" id="sc-toggle-ghostChat" ${sc.ghostChat ? 'checked' : ''} onchange="saveShortcutToggle('ghostChat', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

            </div>`;
        })()
    };

    content.innerHTML = tabs[tab] || tabs.general;
};

// ============================
// ⌨️ KEYBOARD SHORTCUTS
// ============================
window.saveShortcutToggle = function(key, value) {
    const sc = JSON.parse(localStorage.getItem('catura-shortcuts') || '{"darkMode":true,"newChat":true,"voice":false,"addFiles":true,"openSettings":true,"ghostChat":true}');
    sc[key] = value;
    localStorage.setItem('catura-shortcuts', JSON.stringify(sc));
    showToast(value ? `✓ Shortcut enabled` : `Shortcut disabled`);
};

function getShortcuts() {
    return JSON.parse(localStorage.getItem('catura-shortcuts') || '{"darkMode":true,"newChat":true,"voice":false,"addFiles":true,"openSettings":true,"ghostChat":true}');
}

document.addEventListener('keydown', function(e) {
    const sc = getShortcuts();
    const tag = document.activeElement?.tagName;
    const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;

    // Ctrl+D — Dark mode toggle
    if (sc.darkMode && e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'd') {
        if (isInput) return;
        e.preventDefault();
        const current = localStorage.getItem('catura-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        if (typeof setTheme === 'function') setTheme(next);
        else document.documentElement.setAttribute('data-theme', next);
        showToast(`Theme: ${next.charAt(0).toUpperCase() + next.slice(1)}`);
        return;
    }

    // Ctrl+Shift+N — New chat
    if (sc.newChat && e.ctrlKey && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (typeof newChat === 'function') newChat();
        return;
    }

    // Ctrl+U — Add files
    if (sc.addFiles && e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        const fi = document.getElementById('fileInput');
        if (fi) fi.click();
        return;
    }

    // Ctrl+A — Open settings
    if (sc.openSettings && e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'a') {
        if (isInput) return;
        e.preventDefault();
        if (typeof showSettings === 'function') showSettings();
        return;
    }

    // Ctrl+G — Toggle ghost chat
    if (sc.ghostChat && e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'g') {
        if (isInput) return;
        e.preventDefault();
        if (typeof toggleGhostChat === 'function') toggleGhostChat();
        return;
    }
});

// ============================
// 📥 EXPORT CHAT HISTORY
// ============================
window.exportChatHistory = async function () {
    if (!currentUser) { showToast('❌ Not logged in'); return; }

    showToast('⏳ Preparing export…');

    try {
        // 1. Fetch all sessions
        const { data: sessions, error: sessErr } = await supabaseClient
            .from('chat_sessions')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true });

        if (sessErr) throw sessErr;

        // 2. Fetch all messages
        const { data: messages, error: msgErr } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true });

        if (msgErr) throw msgErr;

        // 3. Group messages under their sessions
        const sessionMap = {};
        (sessions || []).forEach(s => {
            sessionMap[s.session_id || s.id] = {
                title: s.title || 'Untitled chat',
                created_at: s.created_at,
                messages: []
            };
        });

        (messages || []).forEach(m => {
            const key = m.session_id;
            if (sessionMap[key]) {
                sessionMap[key].messages.push({
                    role: m.role,
                    content: m.content,
                    created_at: m.created_at
                });
            }
        });

        // 4. Build export object
        const exportData = {
            exported_at: new Date().toISOString(),
            user_email: currentUser.email,
            total_chats: Object.keys(sessionMap).length,
            total_messages: (messages || []).length,
            chats: Object.values(sessionMap)
        };

        // 5. Download as JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `catura-chats-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`✓ Exported ${exportData.total_chats} chats successfully`);

    } catch (err) {
        console.error('Export error:', err);
        showToast('❌ Export failed. Please try again.');
    }
};

// ============================
// 🗂️ ARCHIVE ALL CHATS
// ============================
window.archiveAllChats = async function () {
    if (!confirm("Archive all chats? They will be hidden from your history.")) return;
    const { error } = await supabaseClient
        .from("chat_sessions").update({ archived: true }).eq("user_id", currentUser.id);
    if (error) {
        console.error("❌ Archive error:", error.code, error.message, error.details, error.hint);
        showToast("❌ Archive failed: " + (error.message || "Check console for details"));
    } else {
        showToast("✓ All chats archived successfully");
        if (typeof loadChatHistory === "function") loadChatHistory();
        else if (typeof showHistory === "function") showHistory();
    }
};

// ============================
// 🗑️ DELETE ALL CHATS
// ============================
window.clearAllChats = async function () {
    if (!confirm("Delete ALL chats permanently? This cannot be undone.")) return;

    const { error: msgErr } = await supabaseClient.from("messages").delete().eq("user_id", currentUser.id);
    if (msgErr) { showToast("❌ Failed to delete messages"); return; }

    const { error: sessErr } = await supabaseClient.from("chat_sessions").delete().eq("user_id", currentUser.id);
    if (sessErr) { showToast("❌ Failed to delete sessions"); return; }

    showToast("✓ All chats deleted successfully");

    const chatbox   = document.getElementById("chatbox");
    const inputArea = document.getElementById("inputArea");
    const app       = document.getElementById("app");

    if (chatbox) chatbox.innerHTML = "";
    currentSessionId = generateSessionId();
    firstMessage = true;
    if (inputArea) {
        inputArea.classList.remove("bottom");
        inputArea.classList.add("center");
    }
    if (app) app.classList.add("greeting-mode");
    displayGreeting();
    closeSettings();
};

// ============================
// 🗑️ DELETE SINGLE CHAT
// ============================
async function deleteSingleChat(sessionId) {
    if (!confirm("Delete this chat? This cannot be undone.")) return;

    const { error: msgErr } = await supabaseClient.from("messages").delete()
        .eq("session_id", sessionId).eq("user_id", currentUser.id);
    if (msgErr) { showToast("❌ Failed to delete messages"); return; }

    const { error: sessErr } = await supabaseClient.from("chat_sessions").delete()
        .eq("session_id", sessionId).eq("user_id", currentUser.id);
    if (sessErr) { showToast("❌ Failed to delete session"); return; }

    if (currentSessionId === sessionId) {
        currentSessionId = generateSessionId();
        firstMessage = true;
        const chatbox   = document.getElementById("chatbox");
        const inputArea = document.getElementById("inputArea");
        const app       = document.getElementById("app");
        if (chatbox) chatbox.innerHTML = "";
        if (inputArea) {
            inputArea.classList.remove("bottom");
            inputArea.classList.add("center");
        }
        if (app) app.classList.add("greeting-mode");
        displayGreeting();
    }

    showToast("✓ Chat deleted");
    showHistory();
}

// ============================
// ✏️ RENAME CHAT
// ============================
async function renameChat(sessionId, currentTitle, titleEl) {
    const newTitle = prompt("Rename chat:", currentTitle);
    if (!newTitle || newTitle.trim() === currentTitle) return;

    const { error } = await supabaseClient.from("chat_sessions")
        .update({ title: newTitle.trim() })
        .eq("session_id", sessionId)
        .eq("user_id", currentUser.id);

    if (error) { showToast("❌ Failed to rename chat"); return; }
    titleEl.textContent = newTitle.trim();
    showToast("✓ Chat renamed");
}

// ============================
// ⋯ HISTORY 3-DOT MENU
// ============================
function closeAllMenus() {
    document.querySelectorAll(".history-dropdown.open").forEach(d => d.classList.remove("open"));
}

function buildHistoryItem(session, openSessionFn) {
    const date = new Date(session.created_at).toLocaleDateString();

    const item = document.createElement("div");
    item.classList.add("sidebar-item", "history-item");
    item.dataset.sessionId = session.session_id;

    const info = document.createElement("div");
    info.classList.add("history-info");
    info.style.flex = "1";
    info.style.minWidth = "0";
    info.style.cursor = "pointer";

    const titleEl = document.createElement("span");
    titleEl.classList.add("history-title");
    titleEl.textContent = session.title || "Untitled";

    const dateEl = document.createElement("span");
    dateEl.classList.add("history-date");
    dateEl.textContent = date;

    info.appendChild(titleEl);
    info.appendChild(dateEl);
    info.onclick = () => {
        const overlay = document.getElementById("settingsOverlay");
        if (overlay) overlay.classList.remove("active");
        openSessionFn(session.session_id);
    };

    const menuBtn = document.createElement("button");
    menuBtn.classList.add("history-menu-btn");
    menuBtn.title = "Options";
    menuBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5"  r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
        </svg>`;

    const dropdown = document.createElement("div");
    dropdown.classList.add("history-dropdown");
    dropdown.innerHTML = `
        <button class="history-dropdown-item" data-action="open">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Open chat
        </button>
        <button class="history-dropdown-item" data-action="rename">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Rename
        </button>
        <button class="history-dropdown-item danger" data-action="delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Delete chat
        </button>`;

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
            if (action === "open")   openSessionFn(session.session_id);
            if (action === "rename") renameChat(session.session_id, session.title || "Untitled", titleEl);
            if (action === "delete") deleteSingleChat(session.session_id);
        };
    });

    // NOTE: closeAllMenus on document click is registered once at module level (below buildHistoryItem).

    const menuWrap = document.createElement("div");
    menuWrap.classList.add("history-menu-wrap");
    menuWrap.appendChild(menuBtn);
    menuWrap.appendChild(dropdown);

    item.appendChild(info);
    item.appendChild(menuWrap);
    return item;
}

// ── Single global handler to close all history dropdowns on outside click ──
document.addEventListener("click", closeAllMenus);

// ============================
// 🚀 APP START
// ============================
document.addEventListener("DOMContentLoaded", async function () {

    initTheme();
    initFontSize();
    initWebSearchUI();

    // ── Sidebar: open on desktop, closed on mobile ────────────────────────
    if (window.innerWidth > 768) {
        document.getElementById('sidebar')?.classList.add('open');
    }

    await getUser();

    if (!currentUser) {
        window.location.href = "/auth.html";
        return;
    }

    displayGreeting();

    const chatbox   = document.getElementById("chatbox");
    const input     = document.getElementById("input");
    const inputArea = document.getElementById("inputArea");
    const app       = document.getElementById("app");

    window.autoResize = function () {
        input.style.height = "auto";
        input.style.height = input.scrollHeight + "px";
    };
    input.addEventListener("input", autoResize);

    // ============================
    // 🔥 SEND MESSAGE — with file upload support
    // ============================
    window.sendMessage = async function () {
        const message  = input.value.trim();
        const hasFiles = (typeof attachedFiles !== 'undefined') && attachedFiles.length > 0;
        if (!message && !hasFiles) return;

        // ── Layout transition on first message ──────────────────────────────
        if (firstMessage) {
            chatbox.innerHTML = "";
            inputArea.classList.remove("center");
            inputArea.classList.add("bottom");
            app.classList.remove("greeting-mode");
        }

        // ── Snapshot + immediately clear attached files from preview ─────────
        const filesToSend = (typeof attachedFiles !== 'undefined') ? attachedFiles.slice() : [];
        if (typeof attachedFiles !== 'undefined') attachedFiles = [];
        if (typeof renderAttachedPreview === 'function') renderAttachedPreview();

        // ── Build user bubble (text + file previews) ─────────────────────────
        const userBubble = createUserBubble(message, filesToSend);
        chatbox.appendChild(userBubble);

        // ── Session: create on very first message ────────────────────────────
        if (firstMessage) {
            firstMessage = false;

            if (!ghostChatEnabled) {
            // Immediately insert with a placeholder title, then update with AI-generated one
            chatTitle = (message || (filesToSend.length ? filesToSend[0].name : 'File Chat')).substring(0, 40);
            const { error } = await supabaseClient.from("chat_sessions").insert([{
                session_id: currentSessionId,
                title     : chatTitle,
                user_id   : currentUser.id
            }]);
            if (error) console.error("❌ Session insert failed:", error.message);

            // 🏷️ Generate a smart AI title in the background
            const msgForTitle = message || (filesToSend.length ? filesToSend[0].name : '');
            if (msgForTitle) {
                fetch("/generate-title", {
                    method : "POST",
                    headers: { "Content-Type": "application/json" },
                    body   : JSON.stringify({ message: msgForTitle })
                })
                .then(r => r.json())
                .then(data => {
                    const aiTitle = data.title?.trim();
                    if (aiTitle && aiTitle.length > 1) {
                        chatTitle = aiTitle;
                        // Update in Supabase
                        supabaseClient.from("chat_sessions")
                            .update({ title: aiTitle })
                            .eq("session_id", currentSessionId)
                            .then(({ error: updErr }) => {
                                if (updErr) console.error("❌ Title update failed:", updErr.message);
                            });
                        // Update in history accordion if it's open
                        const histList = document.getElementById("historyAccordionList");
                        if (histList) {
                            const titleEls = histList.querySelectorAll(".history-title");
                            titleEls.forEach(el => {
                                // Find the item whose session matches (it'll be the first/top one)
                                const item = el.closest("[data-session-id]");
                                if (item && item.dataset.sessionId === currentSessionId) {
                                    el.textContent = aiTitle;
                                }
                            });
                        }
                    }
                })
                .catch(err => console.warn("Title gen failed:", err));
            }
            } // end !ghostChatEnabled
        }

        // ── File URLs (needed for DB save + fetch payload) ───────────────────
        const fileUrls = filesToSend.map(function(f) { return f.url; });

        // ── Save user message to DB ──────────────────────────────────────────
        if (!ghostChatEnabled) {
        const { error: userError } = await supabaseClient.from("messages").insert([{
            role      : "user",
            content   : message,
            session_id: currentSessionId,
            user_id   : currentUser.id,
            file_urls : fileUrls.length > 0 ? fileUrls : null
        }]);
        if (userError) console.error("❌ User message save failed:", userError.message);
        }

        // ── Clear input ──────────────────────────────────────────────────────
        input.value = "";
        input.style.height = "auto";
        chatbox.scrollTop = chatbox.scrollHeight;

        // ── Thinking indicator ───────────────────────────────────────────────
        const heavy   = isHeavyQuery(message || (filesToSend.length ? filesToSend[0].name : ''));
        const thinking = heavy ? createThinkingIndicator() : createLightIndicator();
        chatbox.appendChild(thinking);
        chatbox.scrollTop = chatbox.scrollHeight;

        // ── Set streaming state + create abort controller ────────────────────
        activeAbortController = new AbortController();
        setStreamingState(true);

        // ── Build prompt text ────────────────────────────────────────────────
        let promptText = message;
        if (filesToSend.length > 0 && !message) {
            promptText = "Please analyse the attached file(s) and describe what you see in detail.";
        }

        // ── TOOL ROUTER: detect intent, update thinking label ──────────────
        // Backend handles ALL tool execution (search, weather, finance, etc.)
        // Frontend only detects intent to show the right "thinking" label.
        // We NEVER run frontend search — it causes spurious Sources chips on greetings.
        const webResults = [];
        const detectedIntent = message ? detectClientIntent(message) : "general";

        try {
            const model = getSelectedModel();

            // ── Build ghost history payload (sliding window) ─────────────────
            if (ghostChatEnabled) {
                ghostMemory.push({ role: "user", content: promptText });
                if (ghostMemory.length > GHOST_WINDOW) {
                    ghostMemory = ghostMemory.slice(ghostMemory.length - GHOST_WINDOW);
                }
            }

            const res = await fetch("/chat", {
                method : "POST",
                headers: { "Content-Type": "application/json" },
                signal : activeAbortController ? activeAbortController.signal : undefined,
                body   : JSON.stringify({
                    prompt    : promptText,
                    model     : model,
                    file_urls : ghostChatEnabled ? [] : fileUrls,
                    web_results: webResults,
                    web_search_enabled: ghostChatEnabled ? false : webSearchEnabled,
                    ghost_mode : ghostChatEnabled,
                    ghost_history: ghostChatEnabled ? ghostMemory.slice(0, -1) : []
                })
            });
            if (!res.ok) throw new Error("Server error " + res.status);

            const reader    = res.body.getReader();
            const decoder   = new TextDecoder();

            // ── Stream with tool-badge support ──────────────────────────────
            // thinking indicator stays visible until first real token arrives
            let toolUsed = null;
            let wrapper = null;
            let botMsg = null;
            let pendingSources = null;

            const fullReply = await streamWordsWithTools(
                null, null, reader, decoder, chatbox,
                (tu) => { toolUsed = tu; },
                // onFirstToken: create bot wrapper lazily on first real content
                () => {
                    if (!wrapper) {
                        thinking.remove();
                        const created = createBotWrapper();
                        wrapper = created.wrapper;
                        botMsg  = created.botMsg;
                        chatbox.appendChild(wrapper);
                    }
                    return { wrapper, botMsg };
                },
                // onToolRunning: update thinking label
                (intentLabel) => {
                    const thinkLabelEl = thinking.querySelector(".thinking-label");
                    if (thinkLabelEl) {
                        thinkLabelEl.innerHTML = `<span class="think-icon"></span>${intentLabel}`;
                    }
                },
                // onSources: store sources to render after answer
                (sources) => { pendingSources = sources; }
            );

            // ── Reset streaming state ────────────────────────────────────────
            activeAbortController = null;
            setStreamingState(false);

            // ── Show tool badge above message ────────────────────────────────
            if (toolUsed && wrapper) {
                const toolBadges = {
                    clock:      { icon: "🕐", label: "Live Clock" },
                    weather:    { icon: "🌤️", label: "Live Weather" },
                    finance:    { icon: "💹", label: "Market Data" },
                    sports:     { icon: "🏏", label: "Live Scores" },
                    news:       { icon: "📰", label: "Latest News" },
                    web_search: { icon: "🔍", label: "Web Search" },
                    wikipedia:  { icon: "📖", label: "Wikipedia" },
                };
                const badge = toolBadges[toolUsed] || { icon: "🔧", label: toolUsed };
                const badgeDiv = document.createElement("div");
                badgeDiv.className = "tool-badge";
                badgeDiv.setAttribute("data-tool", toolUsed);
                badgeDiv.innerHTML = `<span class="tool-badge-icon">${badge.icon}</span><span class="tool-badge-label">${badge.label} used</span>`;
                wrapper.insertBefore(badgeDiv, botMsg);
            }

            // ── Show sources section below answer (with citation numbers) ─────
            if (pendingSources && pendingSources.length > 0 && wrapper) {
                const sourcesDiv = document.createElement("div");
                sourcesDiv.className = "sources-section";
                const chips = pendingSources.map(s => {
                    if (!s.url) return '';
                    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(s.domain)}&sz=16`;
                    const numBadge = s.num ? `<span class="source-num">[${s.num}]</span>` : '';
                    const trustClass = s.trust >= 80 ? 'trust-high' : s.trust >= 60 ? 'trust-med' : 'trust-low';
                    return `<a class="source-chip ${trustClass}" href="${s.url}" target="_blank" rel="noopener noreferrer" title="${s.title || s.domain}">
                        ${numBadge}
                        <img class="source-favicon" src="${favicon}" onerror="this.style.display='none'" alt="">
                        <span class="source-domain">${s.domain}</span>
                    </a>`;
                }).filter(Boolean).join("");
                const count = pendingSources.filter(s => s.url).length;
                sourcesDiv.innerHTML = `
                    <div class="sources-label">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        ${count} Source${count !== 1 ? 's' : ''}
                    </div>
                    <div class="sources-chips">${chips}</div>`;
                wrapper.appendChild(sourcesDiv);
            }

            if (fullReply) {
                if (ghostChatEnabled) {
                    // Append bot reply to ghost memory (sliding window)
                    ghostMemory.push({ role: "assistant", content: fullReply });
                    if (ghostMemory.length > GHOST_WINDOW) {
                        ghostMemory = ghostMemory.slice(ghostMemory.length - GHOST_WINDOW);
                    }
                } else {
                const { error: botError } = await supabaseClient.from("messages").insert([{
                    role      : "bot",
                    content   : fullReply,
                    session_id: currentSessionId,
                    user_id   : currentUser.id
                }]);
                if (botError) console.error("❌ Bot message save failed:", botError.message);
                }
            }

        } catch (err) {
            activeAbortController = null;
            setStreamingState(false);
            try { thinking.remove(); } catch (_) {}
            // Don't show error if user intentionally stopped the response
            if (err && err.name === 'AbortError') return;
            console.error("❌ AI fetch failed:", err);
            const existingWrapper = chatbox.querySelector(".bot-msg-wrapper:last-child");
            if (!existingWrapper || existingWrapper.querySelector(".message.bot")?.innerHTML?.trim() === "") {
                const errMsg = document.createElement("div");
                errMsg.classList.add("message", "bot");
                errMsg.innerHTML = `<p style="color:#e06c6c">⚠️ Failed to get a response. Please try again.</p>`;
                chatbox.appendChild(errMsg);
            }
        }    };

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // ============================
    // 📂 LOAD SESSION
    // ============================
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
                // Reconstruct file objects from stored URLs for history display
                const historyFiles = (msg.file_urls && msg.file_urls.length)
                    ? msg.file_urls.map(function(url) {
                        return { url: url, name: url.split('/').pop().replace(/^\d+_[a-z0-9]+_/, ''), type: /\.(png|jpg|jpeg|gif|webp)$/i.test(url) ? 'image/jpeg' : 'application/octet-stream', size: 0 };
                      })
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

    // ============================
    // 📜 SHOW HISTORY
    // ============================
    window.showHistory = async function () {
        // Compatibility: called from icon rail / openSidebarTo — just open accordion
        await openHistoryAccordion();
    };

    window.toggleHistoryAccordion = async function () {
        const trigger   = document.getElementById("historyAccordionTrigger");
        const list      = document.getElementById("historyAccordionList");
        const searchWrap = document.getElementById("historySearchWrap");
        if (!trigger || !list) return;

        const isOpen = trigger.classList.contains("open");

        if (isOpen) {
            // Close accordion
            trigger.classList.remove("open");
            list.classList.remove("open");
            list.innerHTML = "";
            if (searchWrap) {
                searchWrap.classList.remove("open");
                // Reset search
                const inp = document.getElementById("historySearchInput");
                const clr = document.getElementById("historySearchClear");
                if (inp) inp.value = "";
                if (clr) clr.classList.remove("visible");
            }
        } else {
            // Open accordion — load chats
            await openHistoryAccordion();
        }
    };

    // Cache of loaded sessions for client-side search
    let _cachedSessions = [];

    async function openHistoryAccordion() {
        const trigger    = document.getElementById("historyAccordionTrigger");
        const list       = document.getElementById("historyAccordionList");
        const searchWrap = document.getElementById("historySearchWrap");
        if (!trigger || !list) return;

        // Mark as open
        trigger.classList.add("open");
        list.classList.add("open");
        if (searchWrap) searchWrap.classList.add("open");
        list.innerHTML = `<div style="padding:8px 14px;font-size:12px;color:#555;">Loading…</div>`;

        if (!currentUser) {
            list.innerHTML = `<div style="padding:8px 14px;font-size:12px;color:#666;">Please log in to see history.</div>`;
            return;
        }

        const { data, error } = await supabaseClient
            .from("chat_sessions").select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false });

        if (error) {
            list.innerHTML = `<div style="padding:8px 14px;font-size:12px;color:#e06c6c;">Failed to load history.</div>`;
            console.error("❌ History failed:", error.message);
            return;
        }

        _cachedSessions = data || [];
        list.innerHTML = "";

        if (_cachedSessions.length === 0) {
            list.innerHTML = `<div class="no-history">No chats yet. Start a new chat to see history.</div>`;
            return;
        }

        _cachedSessions.forEach(session => {
            const item = buildHistoryItem(session, loadSession);
            list.appendChild(item);
        });
    }

    // ── Chat search ──────────────────────────────────────────────────────────
    window.filterHistoryList = function (query) {
        const list = document.getElementById("historyAccordionList");
        const clr  = document.getElementById("historySearchClear");
        if (!list) return;

        // Show/hide clear button
        if (clr) clr.classList.toggle("visible", query.trim().length > 0);

        // Remove any previous no-results message
        const prev = list.querySelector(".history-no-results");
        if (prev) prev.remove();

        const q = query.trim().toLowerCase();
        const items = list.querySelectorAll(".history-item");
        let visibleCount = 0;

        items.forEach(item => {
            const sid = item.dataset.sessionId;
            const session = _cachedSessions.find(s => s.session_id === sid);
            if (!session) { item.style.display = ""; return; }

            // Search title + any snippet stored on the session object
            const haystack = [
                session.title || "",
                session.snippet || session.preview || session.last_message || ""
            ].join(" ").toLowerCase();

            const matches = !q || haystack.includes(q);
            item.style.display = matches ? "" : "none";
            if (matches) visibleCount++;
        });

        if (q && visibleCount === 0) {
            const msg = document.createElement("div");
            msg.className = "history-no-results";
            msg.textContent = `No chats match "${query}"`;
            list.appendChild(msg);
        }
    };

    window.clearHistorySearch = function () {
        const inp = document.getElementById("historySearchInput");
        if (inp) { inp.value = ""; inp.focus(); }
        window.filterHistoryList("");
    };

});

// ============================
// 🎨 THEME SYSTEM
// ============================
window.setTheme = function(theme) {
    localStorage.setItem('catura-theme', theme);
    applyTheme(theme);
    // Update active button
    document.querySelectorAll('.theme-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.theme-option[onclick="setTheme('${theme}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    showToast(`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`, 1500);
};

function applyTheme(theme) {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!prefersDark) root.setAttribute('data-theme', 'light');
    }
    // dark = default, no attribute needed
}

function initTheme() {
    const saved = localStorage.getItem('catura-theme') || 'dark';
    applyTheme(saved);
    // Listen for system preference changes (for auto mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('catura-theme') || 'dark') === 'auto') applyTheme('auto');
    });
}

// ============================
// 🔠 FONT SIZE SYSTEM
// ============================
window.setFontSize = function(size) {
    localStorage.setItem('catura-font', size);
    applyFontSize(size);
    document.querySelectorAll('.font-option').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.font-option[onclick="setFontSize('${size}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    showToast(`Font size: ${size.charAt(0).toUpperCase() + size.slice(1)}`, 1500);
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
// 🌐 WEB SEARCH & INTENT SYSTEM
// ============================
let webSearchEnabled = false;  // true = force web search on every message

// ── Client-side intent detector ─────────────────────────────────────────────
// Mirrors backend detect_intent() — used ONLY for UI labels (thinking text).
// Actual tool execution always happens on the backend.
function detectClientIntent(message) {
    const lower = message.toLowerCase().trim();

    // Identity → general
    if (/which model|what model|what ai|which ai|are you|who are you|your model|who (made|created|built) you/.test(lower)) return "general";

    // ── GREETINGS → always "general", never search ───────────────────────
    const GREETING_EXACT = new Set([
        "hi","hii","hiii","hiiii","hey","heya","hello","helo","hellow",
        "yo","sup","wassup","whatsup","howdy","hola","ola",
        "bonjour","bonsoir","salut","ciao","hallo","hei",
        "kamon acho","kemon acho","ki obostha","ki holo",
        "kya haal","kya haal hai","kaise ho","kaise hain",
        "theek ho","theek hain","sab theek",
        "vanakkam","namaskaram","sukhamano","ela unnaru",
        "sat sri akal","kem cho","maja ma",
        "aadab","adaab","assalamualaikum","salam",
        "namaste","namaskar","pranam","nomoskar",
        "thanks","thank you","thx","ty","thnx","thankyou",
        "bye","goodbye","see ya","cya","alvida",
        "ok","okay","okk","k","kk","cool","nice","great","awesome",
        "yes","no","yep","nope","yeah","nah","sure","hmm","hm","ohh","oh"
    ]);
    if (GREETING_EXACT.has(lower)) return "general";

    const words = lower.split(/\s+/);
    if (words.length <= 5) {
        const GREETING_STARTS = [
            "hi ","hii","hey ","hello","good morning","good afternoon",
            "good evening","good night","good day","greetings",
            "how are you","how r u","how are u","how ru",
            "what's up","whats up","sup ","yo ","hola ","bonjour",
            "namaste","namaskar","nomoskar","pranam",
            "kamon","kemon","kaise ho","kya haal","kem cho",
            "sat sri","vanakkam",
            "thanks","thank ","thx","bye","goodbye","nice ","cool ","great ","awesome "
            // FIX: removed stray comma inside "awesome," string → "awesome "
        ];
        if (GREETING_STARTS.some(g => lower.startsWith(g))) return "general";
    }

    // ── REAL-TIME OVERRIDE — must run BEFORE wikipedia check ─────────────
    const realtimeSignals = /\bnow\b|\bnew\b|\bcurrent(ly)?\b|\blatest\b|\btoday\b|\brecent(ly)?\b|\bright now\b|\bat (the )?moment\b|\bthis (year|month|week|day)\b|\b2024\b|\b2025\b|\b2026\b|\bjust (happened|announced|elected|appointed|named|won|became)\b/;
    const infoSeeking = /\bwho\b|\bwhat\b|\bwhich\b|\bwhere\b|\bwhen\b|\btell me\b|\bfind\b/;
    if (infoSeeking.test(lower) && realtimeSignals.test(lower)) return "web_search";

    // ── CLOCK ─────────────────────────────────────────────────────────────
    if (/\btime\b|\bclock\b|\bwhat time\b|\bcurrent time\b|\btimezone\b|\btime zone\b|\bist\b|\butc\b|\bgmt\b/.test(lower)) return "clock";
    if (/\bwhat\s+(time|hour|day|date)\s+(is\s+it|now)\b|\bcurrent\s+(time|date|day|hour)\b|\btime\s+(in|at|of)\s+\w+|\btoday'?s?\s+date\b|^\s*(time|date|what time|what date)\??\s*$|\btimezone\b/.test(lower)) return "clock";

    // ── WEATHER ───────────────────────────────────────────────────────────
    if (/weather|temperature|humidity|forecast|sunny|cloudy|will it rain|feels like/.test(lower)) return "weather";
    if (/\bweather\s+(in|at|of|today|tomorrow|now|right now)\b|\btemperature\s+(in|at|of|today|tomorrow|now|right now|outside)\b|\bhumidity\s+(in|today|now)\b|\b(will|is)\s+it\s+(rain|snow|hot|cold|sunny|cloudy)\b|\bforecast\b|\bfeels\s+like\b|\bhow\s+(hot|cold|warm)\s+is\s+it\b|today'?s?\s+weather|^\s*weather\??\s*$/.test(lower)) return "weather";

    // ── FINANCE ───────────────────────────────────────────────────────────
    if (/share price|stock price|stock market|nse|bse|nifty|sensex|crypto|bitcoin|ethereum|exchange rate|rupee/.test(lower)) return "finance";
    if (/(tata|reliance|infosys|wipro|hdfc|icici|bajaj|sbi).*(price|stock|share)|(price|stock|share).*(tata|reliance|infosys|wipro|hdfc|icici|bajaj|sbi)/.test(lower)) return "finance";
    if (/\b(share|stock)\s+price\b|\bprice\s+of\s+\w+\s+(share|stock)\b|\b(nifty|sensex|nasdaq)\s+(today|now|live|current)\b|\b(bitcoin|btc|ethereum|eth|crypto)\s+(price|today|now|live|current|rate)\b|\bprice\s+of\s+(bitcoin|btc|ethereum)\b|\b(dollar|usd|inr|rupee|euro)\s+(rate|today|live|current|exchange)\b|\b(tata|reliance|infosys|wipro|hdfc|icici|bajaj|sbi|adani|maruti|tcs|airtel|paytm|zomato|nykaa|irctc)\s+(share|stock|price)\b/.test(lower)) return "finance";

    // ── SPORTS ────────────────────────────────────────────────────────────
    if (/cricket|ipl|test match|\bodi\b|\bt20\b|football|soccer|fifa|premier league|\bnba\b|\bnfl\b|tennis|live score|match today/.test(lower)) return "sports";
    if (/\b(live|today'?s?|current)\s+(score|match)\b|\bscore\s+(of|today|now|live)\b|\b(ipl|test match|odi|t20|world cup)\s+(today|score|match|live|now|result)\b|\bwho\s+(won|is winning|is playing)\s+(today|now|the match)\b|\bcricket\s+(score|match|live|today)\b|\bfootball\s+(score|match|live|today)\b/.test(lower)) return "sports";

    // ── NEWS ──────────────────────────────────────────────────────────────
    if (/\bnews\b|headlines|breaking|latest news|current events|what happened|recent news/.test(lower)) return "news";
    if (/\b(latest|todays?|recent|breaking|current)\s+news\b|\bnews\s+(today|now|about|on)\b|\bheadlines\b|\bbreaking\s+(news|story)\b|what'?s?\s+happening\s+(today|now)|what\s+happened\s+(today|yesterday|recently)|current\s+events|^\s*news\??\s*$/.test(lower)) return "news";

    // ── WIKIPEDIA (no real-time signals) ──────────────────────────────────
    const hasRealtime = /\b(latest|today|now|current|recent|2024|2025|2026)\b/.test(lower);
    if (!hasRealtime) {
        if (/^tell me about\s+[a-z]|^information (about|on)\s+\w|^facts about\s+\w|^who was\s+[A-Z]|^biography of\s+\w|^history of\s+[A-Z]|\bcapital of\s+\w|\bpopulation of\s+\w|^who is\s+[A-Z][a-z]+\s+[A-Z][a-z]+|\bborn (in|on)\s+\d{4}\b/.test(message)) {
            return "wikipedia";
        }
    }

    // ── WEB SEARCH (real-time / fresh data) ───────────────────────────────
    if (/\blatest\b|\bnewest\b|\bmost recent\b|\btoday\b|\btonight\b|\bthis (week|month|year)\b|\bcurrent(ly)?\b|\bright now\b|\brecently?\b|\bjust (announced|launched|happened|released)\b|\b(202[4-9])\b|\bbreaking\b/.test(lower)) return "web_search";
    if (/who is (the )?(current|new|now|present)\s+(cm|chief minister|pm|prime minister|president|governor|mayor|minister|ceo|chairman)|latest version of|new(est)? (version|update|release|feature)|just (launched|released|announced)|github trending|reddit (saying|trending)|huggingface.{0,30}(latest|new|recent)/.test(lower)) return "web_search";
    if (/\bis\s+\w+\s+(down|up|working|running|having issues|offline)\s+(right now|today|currently)\b|currently rank|now ranking|seo.{0,15}(update|new|latest|this (week|month))/.test(lower)) return "web_search";

    // Default → general
    return "general";
}


// ── performWebSearch (legacy manual toggle) ──────────────────────────────────
async function performWebSearch(query) {
    try {
        const res  = await fetch(`/search?q=${encodeURIComponent(query)}&max_results=5`);
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        console.error("❌ Web search failed:", e);
        return [];
    }
}

// ── streamWordsWithTools — word-queue streaming animator (ChatGPT/Claude style) ──
async function streamWordsWithTools(botMsgInitial, wrapperInitial, reader, decoder, chatbox, onToolUsed, onFirstToken, onToolRunning, onSources) {
    let buffer      = "";
    let fullReply   = "";       // complete received text (source of truth)
    let displayed   = "";       // what has been rendered so far
    let wordQueue   = [];       // words waiting to be painted
    let gotWrapper  = false;
    let streamDone  = false;    // SSE stream finished
    let animRunning = false;

    // Support both old (direct elements) and new (lazy callback) API
    let botMsg  = botMsgInitial;
    let wrapper = wrapperInitial;

    const getOrCreateWrapper = () => {
        if (!gotWrapper && typeof onFirstToken === "function") {
            const result = onFirstToken();
            if (result) { wrapper = result.wrapper; botMsg = result.botMsg; }
            gotWrapper = true;
        }
        return { wrapper, botMsg };
    };

    const intentLabels = {
        clock:      "🕐 Checking live time…",
        weather:    "🌤️ Checking live weather…",
        finance:    "💹 Fetching market data…",
        sports:     "🏏 Fetching live scores…",
        news:       "📰 Getting latest news…",
        web_search: "🔍 Searching the web…",
        wikipedia:  "📖 Looking up Wikipedia…",
    };

    // ── Word-queue drain loop ────────────────────────────────────────────────
    // Runs on rAF; emits ~2-3 words per frame (~40-50 ms between renders) for
    // a fast but readable pace — similar to ChatGPT / Claude.
    const WORDS_PER_TICK = 2;   // words painted per animation frame
    const RENDER_EVERY   = 2;   // re-parse markdown every N ticks (keeps it smooth)
    let   tickCount      = 0;

    const drainQueue = () => {
        const { botMsg: bm } = getOrCreateWrapper();
        if (!bm) { if (!streamDone || wordQueue.length) requestAnimationFrame(drainQueue); return; }

        if (wordQueue.length === 0) {
            if (!streamDone) {
                // waiting for more tokens — keep loop alive
                requestAnimationFrame(drainQueue);
            } else {
                // stream finished AND queue empty — do final render
                // Strip inline citation numbers [1][2] from display; keep fullReply raw for storage
                // NOTE: Do NOT collapse whitespace (\s{2,} → ' ') here — it destroys newlines
                // needed for markdown lists, paragraphs, and code blocks.
                const displayReply = fullReply.replace(/\[\d+\](\[\d+\])*/g, '').trimEnd();
                animRunning = false;
                bm.innerHTML = formatMessage(repairTruncated(displayReply));
                bm.classList.remove("streaming");
                if (wrapper) wrapper.dataset.raw = fullReply;
                chatbox.scrollTop = chatbox.scrollHeight;
            }
            return;
        }

        // Paint WORDS_PER_TICK words this frame
        const batch = wordQueue.splice(0, WORDS_PER_TICK);
        displayed += batch.join("");
        tickCount++;

        if (tickCount % RENDER_EVERY === 0 || (streamDone && wordQueue.length === 0)) {
            // Full markdown re-parse (kept infrequent to stay fast)
            bm.innerHTML = formatMessage(repairTruncated(displayed));
            if (!(streamDone && wordQueue.length === 0)) {
                bm.classList.add("streaming");
            } else {
                bm.classList.remove("streaming");
            }
        } else {
            // Lightweight: just append a text node for speed between re-parses
            const cursor = bm.querySelector(".stream-cursor");
            if (cursor) {
                cursor.insertAdjacentText("beforebegin", batch.join(""));
            } else {
                bm.innerHTML = formatMessage(repairTruncated(displayed));
                bm.classList.add("streaming");
            }
        }

        chatbox.scrollTop = chatbox.scrollHeight;
        requestAnimationFrame(drainQueue);
    };

    // Push incoming text into word-queue, splitting on whitespace boundaries
    // so each "word + its trailing space" is one queue entry.
    const enqueueText = (text) => {
        // Split keeping the delimiter (space/newline) attached to the left token
        const parts = text.split(/(?<=\s)/);
        for (const p of parts) if (p) wordQueue.push(p);
        if (!animRunning) { animRunning = true; requestAnimationFrame(drainQueue); }
    };

    // ── SSE reader loop ──────────────────────────────────────────────────────
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
                    if (data.sources !== undefined) {
                        if (typeof onSources === "function") onSources(data.sources);
                        continue;
                    }
                    if (data.status === "tool_running") {
                        const label = intentLabels[data.intent] || "🔍 Fetching data…";
                        if (typeof onToolRunning === "function") onToolRunning(label);

                        // Inject search skeleton into chatbox for web_search
                        if (data.intent === "web_search" && !document.getElementById("search-skeleton-placeholder")) {
                            const skeletonWrap = document.createElement("div");
                            skeletonWrap.id = "search-skeleton-placeholder";
                            skeletonWrap.className = "search-skeleton-outer";
                            skeletonWrap.innerHTML = `
                                <div class="search-skeleton-label">🔍 Searching the web…</div>
                                <div class="search-skeleton">
                                    <div class="skeleton-line sk-w90"></div>
                                    <div class="skeleton-line sk-w75"></div>
                                    <div class="skeleton-line sk-w85"></div>
                                    <div class="skeleton-line sk-w60"></div>
                                </div>`;
                            chatbox.appendChild(skeletonWrap);
                            chatbox.scrollTop = chatbox.scrollHeight;
                        }
                        continue;
                    }
                    if (data.error) {
                        const sk = document.getElementById("search-skeleton-placeholder");
                        if (sk) sk.remove();
                        const { botMsg: bm } = getOrCreateWrapper();
                        if (!fullReply.trim() && bm) bm.innerHTML = `<p style="color:#e06c6c">⚠️ ${data.error}</p>`;
                        streamDone = true;
                        return fullReply || "";
                    }
                    if (data.token) {
                        // Remove search skeleton the moment real content arrives
                        const sk = document.getElementById("search-skeleton-placeholder");
                        if (sk) sk.remove();

                        fullReply += data.token;
                        enqueueText(data.token);
                    }
                } catch { continue; }
            }
        }
    } catch (e) { console.warn("Stream read error:", e); }

    // Clean up skeleton if somehow still present (no tokens arrived)
    const skFallback = document.getElementById("search-skeleton-placeholder");
    if (skFallback) skFallback.remove();

    // Signal animator that no more tokens are coming
    streamDone = true;

    // Wait for the animator to finish draining the queue before returning
    await new Promise(resolve => {
        const poll = () => animRunning ? requestAnimationFrame(poll) : resolve();
        requestAnimationFrame(poll);
    });

    const { wrapper: w, botMsg: bm } = getOrCreateWrapper();

    if (fullReply.trim()) {
        if (bm) {
            // Only re-render if the drain loop didn't already do it (animRunning was set false there)
            // Strip citation numbers but preserve all whitespace/newlines for markdown
            const displayReply = fullReply.replace(/\[\d+\](\[\d+\])*/g, '').trimEnd();
            bm.innerHTML = formatMessage(repairTruncated(displayReply));
            if (w) w.dataset.raw = fullReply;
        }
        chatbox.scrollTop = chatbox.scrollHeight;
        return fullReply;
    }

    if (bm) bm.innerHTML = `<p style="color:#e06c6c">⚠️ No response received. Please try again.</p>`;
    return "";
}

// ============================================================
// 🛑 STOP BUTTON — abort controller for streaming responses
// ============================================================
let activeAbortController = null;
let isStreaming = false;

function setStreamingState(streaming) {
    isStreaming = streaming;
    const btn = document.getElementById('sendBtn');
    if (!btn) return;
    if (streaming) {
        btn.classList.add('is-stopping');
        btn.title = 'Stop generating';
    } else {
        btn.classList.remove('is-stopping');
        btn.title = 'Send message';
    }
}

window.handleSendOrStop = function () {
    if (isStreaming) {
        // Abort the current stream
        if (activeAbortController) {
            activeAbortController.abort();
            activeAbortController = null;
        }
        setStreamingState(false);
        showToast('Response stopped', 1500);
    } else {
        sendMessage();
    }
};

window.toggleWebSearch = function() {
    webSearchEnabled = !webSearchEnabled;

    // Update the dropdown item's visual state
    const searchItem = document.querySelector('.plus-dropdown-item[data-action="search"]');
    if (searchItem) {
        if (webSearchEnabled) {
            searchItem.classList.add('search-active');
        } else {
            searchItem.classList.remove('search-active');
        }
    }

    if (webSearchEnabled) {
        showToast('🔍 Web search ON — Catura will search the web', 2000);
    } else {
        showToast('🔍 Web search OFF — Catura decides automatically', 2000);
    }
};
function togglePlusMenu(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('plusDropdown');
    dropdown.classList.toggle('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const wrap = document.getElementById('plusMenuWrap');
    if (wrap && !wrap.contains(e.target)) {
        const dropdown = document.getElementById('plusDropdown');
        if (dropdown) dropdown.classList.remove('open');
    }
});

function handlePlusAction(action) {
    const dropdown = document.getElementById('plusDropdown');
    if (dropdown) dropdown.classList.remove('open');

    if (action === 'file') {
        const fi = document.getElementById('fileInput');
        if (fi) fi.click();
    } else if (action === 'connect') {
        showToast('Connect apps — coming soon!');
    } else if (action === 'think') {
        showToast('Think mode — coming soon!');
    } else if (action === 'research') {
        showToast('Deep research — coming soon!');
    } else if (action === 'search') {
        toggleWebSearch();
    }
}

// ── Init web-search active state in the plus dropdown on page load ─────────
function initWebSearchUI() {
    const searchItem = document.querySelector('.plus-dropdown-item[data-action="search"]');
    if (!searchItem) return;
    if (webSearchEnabled) {
        searchItem.classList.add('search-active');
    } else {
        searchItem.classList.remove('search-active');
    }
}

// NOTE: handleFileSelect is defined in file-upload.js (the real implementation).
// Do NOT define a stub here — it would override the real one since this file
// loads before file-upload.js.

// ============================
// 🤖 MODEL SELECTOR
// ============================
let selectedModel = 'dagr'; // Default model — options: dagr, apep, sambhav, Gemma4, nivo, Laguna

window.toggleModelSelector = function (e) {
    e.stopPropagation();
    const dropdown = document.getElementById('modelDropdown');
    const btn = document.getElementById('modelSelectorBtn');

    const isOpen = dropdown.classList.contains('open');
    closeAllModelMenus();

    if (!isOpen) {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Mobile: bottom-sheet, CSS handles positioning
            dropdown.style.top    = '';
            dropdown.style.left   = '';
            dropdown.style.bottom = '';
            dropdown.classList.add('open');
            btn.classList.add('open');

            const moreModels = ['apep', 'gemma', 'gemma4', 'nivo', 'laguna'];
            if (moreModels.includes(selectedModel)) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { toggleMoreModels(null); });
                });
            }
        } else {
            // Desktop: floating dropdown with positioning
            const rect = btn.getBoundingClientRect();

            dropdown.style.visibility = 'hidden';
            dropdown.style.opacity = '0';
            dropdown.style.transform = 'none';
            dropdown.style.display = 'block';
            dropdown.style.top = '-9999px';
            dropdown.style.left = '-9999px';
            const dropH = dropdown.scrollHeight || 180;
            const dropW = Math.max(dropdown.offsetWidth || 0, 220);
            dropdown.style.display = '';
            dropdown.style.top = '';
            dropdown.style.left = '';
            dropdown.style.visibility = '';
            dropdown.style.opacity = '';
            dropdown.style.transform = '';

            let top = rect.top - dropH - 8;
            if (top < 8) top = rect.bottom + 8;
            top = Math.max(8, Math.min(top, window.innerHeight - dropH - 8));

            let left = rect.right - dropW;
            if (left < 8) left = 8;
            if (left + dropW > window.innerWidth - 8) left = window.innerWidth - dropW - 8;

            dropdown.style.top    = top + 'px';
            dropdown.style.left   = left + 'px';
            dropdown.style.bottom = 'auto';

            dropdown.classList.add('open');
            btn.classList.add('open');

            const moreModels = ['apep', 'gemma', 'gemma4', 'nivo', 'laguna'];
            if (moreModels.includes(selectedModel)) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => { toggleMoreModels(null); });
                });
            }
        }
    }
};

window.selectModel = function (modelId, modelName, e) {
    if (e) e.stopPropagation();
    selectedModel = modelId.toLowerCase();

    const modelNameEl = document.getElementById('modelName');
    if (modelNameEl) modelNameEl.textContent = modelName;

    document.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('active'));
    const activeOption = document.querySelector(`[data-model="${modelId}"]`);
    if (activeOption) activeOption.classList.add('active');

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        setTimeout(() => {
            closeAllModelMenus();
            showToast(`✓ Switched to ${modelName}`, 1500);
        }, 180);
    } else {
        closeAllModelMenus();
        showToast(`✓ Switched to ${modelName}`, 1500);
    }
};

function closeAllModelMenus() {
    const dropdown = document.getElementById('modelDropdown');
    const btn = document.getElementById('modelSelectorBtn');
    if (dropdown) dropdown.classList.remove('open');
    if (btn) btn.classList.remove('open');
    const panel = document.getElementById('moreModelsPanel');
    const row   = document.getElementById('moreModelsRow');
    if (panel) panel.classList.remove('open');
    if (row)   row.classList.remove('open');
}

window.toggleMoreModels = function (e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const panel = document.getElementById('moreModelsPanel');
    const row   = document.getElementById('moreModelsRow');
    if (!panel || !row) return;

    const isOpen = panel.classList.contains('open');
    if (isOpen) {
        panel.classList.remove('open');
        row.classList.remove('open');
        return;
    }

    const isMobile = window.innerWidth <= 768;

    if (!isMobile) {
        // Desktop: position panel to the right of the dropdown, always within viewport
        const dropdownEl = document.getElementById('modelDropdown');
        if (!dropdownEl) return;

        const panelW   = 230;
        const gap      = 8;
        const margin   = 8;
        const dropRect = dropdownEl.getBoundingClientRect();

        // Temporarily show panel off-screen to measure its real height
        panel.style.visibility = 'hidden';
        panel.style.display    = 'block';
        panel.style.top        = '-9999px';
        panel.style.left       = '-9999px';
        const panelH = panel.scrollHeight || 260;
        panel.style.display    = '';
        panel.style.top        = '';
        panel.style.left       = '';
        panel.style.visibility = '';

        // Horizontal: prefer right of dropdown, fall back to left
        let left = dropRect.right + gap;
        if (left + panelW > window.innerWidth - margin) {
            left = dropRect.left - panelW - gap;
        }
        if (left < margin) left = margin;

        // Vertical: try to align top with dropdown top.
        // If that pushes the panel below the viewport, anchor its BOTTOM
        // to the dropdown bottom (grows upward) — same as Claude's behaviour.
        let top = dropRect.top;
        if (top + panelH > window.innerHeight - margin) {
            // Anchor bottom of panel to bottom of dropdown
            top = dropRect.bottom - panelH;
        }
        // Never go above the top of the viewport
        top = Math.max(margin, top);

        panel.style.left = left + 'px';
        panel.style.top  = top + 'px';
    } else {
        // Mobile: close main dropdown, open sub-panel as new bottom-sheet
        panel.style.left = '';
        panel.style.top  = '';
        const dropdown = document.getElementById('modelDropdown');
        const btn = document.getElementById('modelSelectorBtn');
        if (dropdown) dropdown.classList.remove('open');
        if (btn) btn.classList.remove('open');
    }

    panel.classList.add('open');
    row.classList.add('open');
};

// Back button: close more-models panel and reopen main dropdown
window.goBackToMainModels = function (e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const panel    = document.getElementById('moreModelsPanel');
    const row      = document.getElementById('moreModelsRow');
    const dropdown = document.getElementById('modelDropdown');
    const btn      = document.getElementById('modelSelectorBtn');

    if (panel) panel.classList.remove('open');
    if (row)   row.classList.remove('open');

    if (dropdown) {
        dropdown.style.top    = '';
        dropdown.style.left   = '';
        dropdown.style.bottom = '';
        dropdown.classList.add('open');
    }
    if (btn) btn.classList.add('open');
};

// Close dropdown when clicking outside
document.addEventListener('click', function (e) {
    const wrap     = document.getElementById('modelSelectorWrap');
    const dropdown = document.getElementById('modelDropdown');
    const panel    = document.getElementById('moreModelsPanel');
    const insideWrap     = wrap     && wrap.contains(e.target);
    const insideDropdown = dropdown && dropdown.contains(e.target);
    const insidePanel    = panel    && panel.contains(e.target);
    if (!insideWrap && !insideDropdown && !insidePanel) {
        closeAllModelMenus();
    }
});

// Get currently selected model
function getSelectedModel() {
    return selectedModel;
}

// ============================================================
// ✅ PRIVACY POLICY MODAL
// ============================================================
window.showPrivacyModal = function () {
    // Remove any existing
    document.getElementById('privacyModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'privacyModal';
    modal.className = 'priv-modal-overlay';
    modal.innerHTML = `
        <div class="priv-modal-box" role="dialog" aria-modal="true" aria-label="Data & Privacy">
            <div class="priv-modal-header">
                <div class="priv-modal-title-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <h2 class="priv-modal-title">Data &amp; Privacy</h2>
                </div>
                <button class="priv-modal-close" onclick="document.getElementById('privacyModal').remove()" aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="priv-modal-body">
                <p class="priv-intro">We respect your privacy and are committed to protecting your data.</p>

                <div class="priv-item">
                    <div class="priv-num">1</div>
                    <div>
                        <p class="priv-item-title">Data We Collect</p>
                        <p class="priv-item-text">We may collect basic information such as your email address, chat messages, and usage data to improve our AI services.</p>
                    </div>
                </div>
                <div class="priv-item">
                    <div class="priv-num">2</div>
                    <div>
                        <p class="priv-item-title">How We Use Your Data</p>
                        <p class="priv-item-text">Your data is used to provide responses, improve AI performance, and ensure security. We do not sell your personal data to third parties.</p>
                    </div>
                </div>
                <div class="priv-item">
                    <div class="priv-num">3</div>
                    <div>
                        <p class="priv-item-title">AI Conversations</p>
                        <p class="priv-item-text">Your conversations may be stored and analyzed to improve the quality of responses. Avoid sharing sensitive or personal information.</p>
                    </div>
                </div>
                <div class="priv-item">
                    <div class="priv-num">4</div>
                    <div>
                        <p class="priv-item-title">Email &amp; Authentication</p>
                        <p class="priv-item-text">We use your email for account creation, login verification (OTP), and password recovery. We do not send spam.</p>
                    </div>
                </div>
                <div class="priv-item">
                    <div class="priv-num">5</div>
                    <div>
                        <p class="priv-item-title">Data Security</p>
                        <p class="priv-item-text">We implement reasonable security measures to protect your data, but no system is completely secure.</p>
                    </div>
                </div>
                <div class="priv-item">
                    <div class="priv-num">6</div>
                    <div>
                        <p class="priv-item-title">Third-Party Services</p>
                        <p class="priv-item-text">We may use trusted third-party services (such as authentication and email providers) to operate our platform.</p>
                    </div>
                </div>
                <div class="priv-item">
                    <div class="priv-num">7</div>
                    <div>
                        <p class="priv-item-title">Your Control</p>
                        <p class="priv-item-text">You can request deletion of your data at any time by contacting support.</p>
                    </div>
                </div>
                <div class="priv-item">
                    <div class="priv-num">8</div>
                    <div>
                        <p class="priv-item-title">Changes to Policy</p>
                        <p class="priv-item-text">We may update this policy from time to time. Continued use of the service means you accept the changes.</p>
                    </div>
                </div>

                <div class="priv-contact">
                    <p class="priv-contact-title">Contact Us</p>
                    <div class="priv-contact-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <a href="mailto:support@yourdomain.co" class="priv-link">support@yourdomain.co</a>
                    </div>
                    <div class="priv-contact-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                        </svg>
                        <a href="https://github.com/**************" target="_blank" rel="noopener" class="priv-link">github.com/**************</a>
                    </div>
                    <div class="priv-contact-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect x="2" y="9" width="4" height="12"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                        <a href="https://linkedin.com/in/************************" target="_blank" rel="noopener" class="priv-link">linkedin.com/in/************************</a>
                    </div>
                </div>
            </div>
            <div class="priv-modal-footer">
                <button class="priv-close-btn" onclick="document.getElementById('privacyModal').remove()">Close</button>
            </div>
        </div>
    `;

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
    // Animate in
    requestAnimationFrame(() => modal.classList.add('priv-modal-open'));
};

// ============================================================
// ✅ DELETE ACCOUNT MODAL
// ============================================================
window.showDeleteAccountModal = function () {
    document.getElementById('deleteAccountModal')?.remove();

    const userEmail = currentUser?.email || '';

    const modal = document.createElement('div');
    modal.id = 'deleteAccountModal';
    modal.className = 'priv-modal-overlay';
    modal.innerHTML = `
        <div class="priv-modal-box del-modal-box" role="dialog" aria-modal="true" aria-label="Delete Account">
            <div class="del-modal-icon-wrap">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e06c6c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                    <path d="M10 11v6M14 11v6"></path>
                    <path d="M9 6V4h6v2"></path>
                </svg>
            </div>
            <h2 class="del-modal-title">Delete Account</h2>
            <p class="del-modal-desc">This action is <strong>permanent and irreversible</strong>. All your conversations, settings, and account data will be deleted forever.</p>
            <p class="del-modal-confirm-label">Type <span class="del-confirm-word">${userEmail}</span> to confirm:</p>
            <input type="email" id="deleteConfirmInput" class="del-confirm-input" placeholder="${userEmail}" autocomplete="off" oninput="checkDeleteConfirm()">
            <div class="del-modal-actions">
                <button class="del-cancel-btn" onclick="document.getElementById('deleteAccountModal').remove()">Cancel</button>
                <button class="del-confirm-btn" id="deleteConfirmBtn" disabled onclick="executeDeleteAccount()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                    </svg>
                    Delete my account
                </button>
            </div>
        </div>
    `;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('priv-modal-open'));

    // Focus input
    setTimeout(() => document.getElementById('deleteConfirmInput')?.focus(), 100);
};

// Enable the delete button only when user types their email exactly
window.checkDeleteConfirm = function () {
    const val = document.getElementById('deleteConfirmInput')?.value || '';
    const btn = document.getElementById('deleteConfirmBtn');
    const userEmail = currentUser?.email || '';
    if (btn) btn.disabled = val.trim().toLowerCase() !== userEmail.toLowerCase();
};

// Execute account deletion — pure Supabase client-side
window.executeDeleteAccount = async function () {
    const btn = document.getElementById('deleteConfirmBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ Deleting…';
    }

    try {
        if (!currentUser) {
            alert('You are not logged in. Please refresh and try again.');
            if (btn) { btn.disabled = false; btn.textContent = 'Delete my account'; }
            return;
        }

        const userId = currentUser.id;

        // 1. Delete all messages for this user
        const { error: msgErr } = await supabaseClient
            .from('messages')
            .delete()
            .eq('user_id', userId);
        if (msgErr) console.warn('messages delete:', msgErr.message);

        // 2. Delete all chat sessions for this user
        const { error: sessErr } = await supabaseClient
            .from('chat_sessions')
            .delete()
            .eq('user_id', userId);
        if (sessErr) console.warn('chat_sessions delete:', sessErr.message);

        // 3. Delete the auth user via Supabase (requires RLS + auth.users delete policy, OR use Admin API)
        const { error: authErr } = await supabaseClient.rpc('delete_user');

        if (authErr) {
            // Fallback: sign out and inform user to contact support for full removal
            console.error('Auth delete error:', authErr.message);
            await supabaseClient.auth.signOut();
            document.getElementById('deleteAccountModal')?.remove();
            alert('Your data has been cleared. Your login account will be fully removed within 24 hours. You have been signed out.');
            window.location.href = '/auth';
            return;
        }

        // 4. Sign out and redirect
        await supabaseClient.auth.signOut();
        document.getElementById('deleteAccountModal')?.remove();
        window.location.href = '/auth';

    } catch (e) {
        console.error('Delete account error:', e);
        alert('Something went wrong. Please try again or contact support.');
        if (btn) { btn.disabled = false; btn.textContent = 'Delete my account'; }
    }
};
// ── CHANGE PASSWORD MODAL ─────────────────────────────────────────────────────
// ── CHANGE PASSWORD — Supabase reauthenticate() OTP flow ─────────────────────
//
//  STEP 1 (chpw-step-1): User enters new password + confirm
//         → clicks "Send verification code"
//         → we call supabaseClient.auth.reauthenticate()
//         → Supabase emails a 6-digit OTP using the Reauthentication template
//
//  STEP 2 (chpw-step-2): User enters the 6-digit OTP from email
//         → clicks "Verify & update password"
//         → we call supabaseClient.auth.verifyOtp({ type:'reauthentication', token })
//           which re-auths the session, then immediately call updateUser({ password })
//
// ─────────────────────────────────────────────────────────────────────────────

const eyeSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeOffSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

window.openChangePasswordModal = function () {
    document.getElementById('changePasswordModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'changePasswordModal';
    modal.className = 'priv-modal-overlay';
    modal.innerHTML = `
        <div class="priv-modal-box chpw-modal-box" role="dialog" aria-modal="true" aria-label="Change Password">

            <!-- ── STEP 1: New password fields ── -->
            <div id="chpw-step-1">
                <div class="chpw-modal-icon-wrap">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h2 class="chpw-modal-title">Change Password</h2>
                <p class="chpw-modal-desc">Enter your new password. We'll send a verification code to <strong id="chpwEmailDisplay" style="color:#e8eaf0;"></strong> to confirm it's you.</p>

                <div class="chpw-field-wrap">
                    <label class="chpw-label">New Password</label>
                    <div class="chpw-input-wrap">
                        <input type="password" id="chpwNewInput" class="chpw-input" placeholder="New password (min 8 characters)" autocomplete="new-password" oninput="chpwValidateStep1()">
                        <button class="chpw-eye-btn" type="button" onclick="chpwToggleEye('chpwNewInput',this)" tabindex="-1">${eyeSVG}</button>
                    </div>
                </div>

                <div class="chpw-field-wrap">
                    <label class="chpw-label">Confirm New Password</label>
                    <div class="chpw-input-wrap">
                        <input type="password" id="chpwConfirmInput" class="chpw-input" placeholder="Confirm new password" autocomplete="new-password" oninput="chpwValidateStep1()">
                        <button class="chpw-eye-btn" type="button" onclick="chpwToggleEye('chpwConfirmInput',this)" tabindex="-1">${eyeSVG}</button>
                    </div>
                </div>

                <p id="chpwStep1Error" class="chpw-error" style="display:none;"></p>

                <div class="del-modal-actions" style="margin-top:20px;">
                    <button class="del-cancel-btn" onclick="document.getElementById('changePasswordModal').remove()">Cancel</button>
                    <button class="chpw-save-btn" id="chpwStep1Btn" disabled onclick="chpwSendOtp()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.15 3.4 2 2 0 0 1 3.12 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/>
                        </svg>
                        Send verification code
                    </button>
                </div>
            </div>

            <!-- ── STEP 2: OTP entry ── -->
            <div id="chpw-step-2" style="display:none;">
                <div class="chpw-modal-icon-wrap" style="background:rgba(16,163,127,0.12); border-color:rgba(16,163,127,0.3);">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10a37f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </div>
                <h2 class="chpw-modal-title">Check your email</h2>
                <p class="chpw-modal-desc">We sent a 6-digit verification code to <strong id="chpwEmailDisplay2" style="color:#e8eaf0;"></strong>. Enter it below to update your password.</p>

                <div class="chpw-field-wrap">
                    <label class="chpw-label">Verification Code</label>
                    <input type="text" id="chpwOtpInput" class="chpw-input chpw-otp-input" placeholder="000000" maxlength="6" autocomplete="one-time-code" oninput="chpwValidateStep2()" style="letter-spacing:8px; font-size:22px; font-weight:700; text-align:center;">
                </div>

                <p id="chpwStep2Error" class="chpw-error" style="display:none;"></p>

                <p class="chpw-resend-row">
                    Didn't receive it? 
                    <button class="chpw-resend-btn" id="chpwResendBtn" onclick="chpwResendOtp()">Resend code</button>
                </p>

                <div class="del-modal-actions" style="margin-top:20px;">
                    <button class="del-cancel-btn" onclick="chpwBackToStep1()">← Back</button>
                    <button class="chpw-save-btn" id="chpwStep2Btn" disabled onclick="chpwVerifyAndUpdate()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Verify &amp; update password
                    </button>
                </div>
            </div>

        </div>
    `;

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('priv-modal-open'));

    // Show user's email in the description
    const email = currentUser?.email || '';
    document.getElementById('chpwEmailDisplay').textContent  = email;
    document.getElementById('chpwEmailDisplay2').textContent = email;

    setTimeout(() => document.getElementById('chpwNewInput')?.focus(), 100);
};

window.chpwToggleEye = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden ? eyeOffSVG : eyeSVG;
};

window.chpwValidateStep1 = function () {
    const pw  = document.getElementById('chpwNewInput')?.value    || '';
    const cpw = document.getElementById('chpwConfirmInput')?.value || '';
    const btn = document.getElementById('chpwStep1Btn');
    const err = document.getElementById('chpwStep1Error');
    if (!btn || !err) return;

    if (pw.length > 0 && pw.length < 8) {
        err.textContent = 'Password must be at least 8 characters.';
        err.style.display = 'block'; btn.disabled = true; return;
    }
    if (cpw.length > 0 && pw !== cpw) {
        err.textContent = 'Passwords do not match.';
        err.style.display = 'block'; btn.disabled = true; return;
    }
    err.style.display = 'none';
    btn.disabled = !(pw.length >= 8 && pw === cpw);
};

window.chpwValidateStep2 = function () {
    const otp = document.getElementById('chpwOtpInput')?.value.replace(/\D/g,'') || '';
    // keep only digits
    if (document.getElementById('chpwOtpInput'))
        document.getElementById('chpwOtpInput').value = otp;
    const btn = document.getElementById('chpwStep2Btn');
    if (btn) btn.disabled = otp.length !== 6;
};

window.chpwSendOtp = async function () {
    const btn = document.getElementById('chpwStep1Btn');
    const err = document.getElementById('chpwStep1Error');
    const origHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '⏳ Sending…';

    try {
        const { error } = await supabaseClient.auth.reauthenticate();
        if (error) throw error;

        // Switch to step 2
        document.getElementById('chpw-step-1').style.display = 'none';
        document.getElementById('chpw-step-2').style.display = 'block';
        setTimeout(() => document.getElementById('chpwOtpInput')?.focus(), 100);

    } catch (e) {
        err.textContent = e.message || 'Failed to send code. Please try again.';
        err.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = origHTML;
    }
};

window.chpwResendOtp = async function () {
    const btn   = document.getElementById('chpwResendBtn');
    const err   = document.getElementById('chpwStep2Error');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
        const { error } = await supabaseClient.auth.reauthenticate();
        if (error) throw error;
        btn.textContent = '✓ Sent!';
        if (err) err.style.display = 'none';
        setTimeout(() => { btn.disabled = false; btn.textContent = 'Resend code'; }, 30000);
    } catch (e) {
        err.textContent = e.message || 'Failed to resend. Try again.';
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Resend code';
    }
};

window.chpwBackToStep1 = function () {
    document.getElementById('chpw-step-2').style.display = 'none';
    document.getElementById('chpw-step-1').style.display = 'block';
    document.getElementById('chpwStep2Error').style.display = 'none';
    document.getElementById('chpwOtpInput').value = '';
    document.getElementById('chpwStep2Btn').disabled = true;
};

window.chpwVerifyAndUpdate = async function () {
    const otp = document.getElementById('chpwOtpInput')?.value.trim() || '';
    const pw  = document.getElementById('chpwNewInput')?.value        || '';
    const btn = document.getElementById('chpwStep2Btn');
    const err = document.getElementById('chpwStep2Error');

    if (otp.length !== 6 || pw.length < 8) return;

    const saveBtnHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Verify &amp; update password';

    btn.disabled = true;
    btn.innerHTML = '⏳ Updating…';

    try {
        // ✅ FIXED: Supabase reauthenticate() sends a nonce-based OTP.
        // The correct flow is to pass the OTP directly as the `nonce` inside
        // updateUser() — NOT via verifyOtp() which is for a different flow.
        const { error: updateErr } = await supabaseClient.auth.updateUser(
            { password: pw },
            { nonce: otp }
        );

        if (updateErr) {
            const isNonceErr = updateErr.message?.toLowerCase().includes('nonce') ||
                               updateErr.message?.toLowerCase().includes('expired') ||
                               updateErr.message?.toLowerCase().includes('invalid');
            err.textContent = isNonceErr
                ? 'Code expired or invalid. Click "Resend code" to get a new one.'
                : (updateErr.message || 'Failed to update password. Please try again.');
            err.style.display = 'block';
            btn.disabled = false;
            btn.innerHTML = saveBtnHTML;
            return;
        }

        document.getElementById('changePasswordModal')?.remove();
        showToast('✓ Password updated successfully');

    } catch (e) {
        err.textContent = e.message || 'Network error. Please try again.';
        err.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = saveBtnHTML;
    }
};

// ============================
// 📍 LOCATION METADATA SYSTEM
// Privacy-safe: city/region/timezone only.
// No GPS history. No continuous tracking.
// Raw coordinates deleted immediately after reverse-geocoding.
// ============================

// Keys for localStorage (toggle preference + cached metadata)
const LOC_TOGGLE_KEY  = 'catura_location_enabled';
const LOC_CACHE_KEY   = 'catura_location_meta';
const LOC_CACHE_TTL   = 60 * 60 * 1000; // 1 hour in ms

/**
 * Called when user flips the location toggle.
 * If turning ON: request location once → extract city/region/timezone → cache 1 hr.
 * If turning OFF: clear cache, never call geolocation API again.
 */
window.handleLocationToggle = async function (enabled) {
    localStorage.setItem(LOC_TOGGLE_KEY, enabled ? '1' : '0');

    if (!enabled) {
        // Wipe any cached location — user opted out
        localStorage.removeItem(LOC_CACHE_KEY);
        console.log('[Location] Toggle OFF — cache cleared.');
        return;
    }

    // Toggle is ON — request location once
    await requestLocationOnce();
};

/**
 * Request the user's approximate location ONCE.
 * Uses low accuracy (no GPS) → sends to backend for reverse geocoding →
 * stores only { country, region, city, timezone, locale } locally.
 * Raw coordinates are NEVER persisted.
 */
async function requestLocationOnce() {
    if (!('geolocation' in navigator)) {
        // Fallback: derive from IP via backend
        await fetchLocationFromIP();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            // Round to 2 decimal places — city-level precision only
            const coarse_lat = Math.round(pos.coords.latitude  * 100) / 100;
            const coarse_lng = Math.round(pos.coords.longitude * 100) / 100;

            // Send coarse coords to backend → get city/region/timezone back
            // Backend immediately discards raw coordinates
            try {
                const res = await fetch('/api/location-metadata', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ coarse_lat, coarse_lng })
                });
                if (res.ok) {
                    const meta = await res.json();
                    cacheLocationMeta(meta);
                    console.log('[Location] Metadata stored:', meta.city, meta.region);
                } else {
                    // Backend failed — fallback to browser timezone + IP
                    await fetchLocationFromIP();
                }
            } catch (_) {
                await fetchLocationFromIP();
            }
            // Raw coords are now out of scope — never stored
        },
        async () => {
            // User denied or geolocation unavailable — try IP fallback
            await fetchLocationFromIP();
        },
        {
            enableHighAccuracy: false, // no GPS — approximate network position only
            timeout: 5000,
            maximumAge: 3600000        // reuse a cached browser position up to 1 hr old
        }
    );
}

/**
 * Fallback 1: Ask backend to derive location from IP.
 * Fallback 2: Use browser's timezone string.
 * Fallback 3: Nothing stored — AI works without location context.
 */
async function fetchLocationFromIP() {
    try {
        const res = await fetch('/api/location-metadata/ip');
        if (res.ok) {
            const meta = await res.json();
            cacheLocationMeta(meta);
            console.log('[Location] IP-derived metadata stored:', meta.city);
            return;
        }
    } catch (_) {}

    // Final fallback: timezone from browser only
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz) {
        cacheLocationMeta({ timezone: tz, locale: navigator.language || 'en' });
        console.log('[Location] Timezone-only fallback stored:', tz);
    }
}

/** Persist metadata with a 1-hour expiry. */
function cacheLocationMeta(meta) {
    const record = { ...meta, cached_at: Date.now() };
    localStorage.setItem(LOC_CACHE_KEY, JSON.stringify(record));
}

/**
 * Returns the current location metadata if the toggle is ON and cache is fresh.
 * Returns null if toggle is OFF or cache has expired.
 * Called by the chat send handler to enrich the request context.
 */
window.getLocationMeta = function () {
    if (localStorage.getItem(LOC_TOGGLE_KEY) !== '1') return null;
    try {
        const raw = localStorage.getItem(LOC_CACHE_KEY);
        if (!raw) return null;
        const record = JSON.parse(raw);
        if (Date.now() - record.cached_at > LOC_CACHE_TTL) {
            // Cache expired — refresh silently in background
            localStorage.removeItem(LOC_CACHE_KEY);
            requestLocationOnce();
            return null;
        }
        // Return only the safe fields — never include raw coords
        const { country, region, city, timezone, locale } = record;
        return { country, region, city, timezone, locale };
    } catch (_) {
        return null;
    }
};

/** On settings open: restore toggle state from localStorage. */
function restoreLocationToggle() {
    const toggle = document.getElementById('locationMetadataToggle');
    if (toggle) {
        toggle.checked = localStorage.getItem(LOC_TOGGLE_KEY) === '1';
    }
}

// Patch showSettings to restore toggle state after the panel renders
const _origShowSettings = window.showSettings;
window.showSettings = function (...args) {
    if (_origShowSettings) _origShowSettings(...args);
    // Small delay to let the settings HTML inject into DOM
    setTimeout(restoreLocationToggle, 50);
};

// ── PLANS MODAL ───────────────────────────────────────────────────────────────
window.openPlansModal = function () {
    const existing = document.getElementById('plansModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'plansModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);';

    const freeFeatures = ['Unlimited chats with Dagr & Apep','Access to Sambhav model','Standard response speed','Basic file uploads'];
    const proFeatures = ['Everything in Free','Access to Gemma & Gemma4 models','Priority response speed','Larger file uploads','Extended context window','Early access to new features'];
    const maxFeatures = ['Everything in Pro','Access to Nivo & Laguna models','Fastest response speed','Unlimited file uploads','Maximum context window','Dedicated support'];

    const check = (color) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    const makeList = (items, color) => items.map(f => `<li style="display:flex;align-items:center;gap:8px;font-size:13px;color:#bbb;">${check(color)}${f}</li>`).join('');

    modal.innerHTML = `
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;width:min(860px,95vw);max-height:90vh;overflow-y:auto;padding:32px 28px;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.6);">
        <button onclick="document.getElementById('plansModal').remove()" style="position:absolute;top:16px;right:18px;background:none;border:none;color:#888;font-size:20px;cursor:pointer;line-height:1;padding:4px 8px;border-radius:6px;">&#x2715;</button>
        <h2 style="margin:0 0 6px;font-size:22px;color:#fff;font-weight:700;">Choose your plan</h2>
        <p style="margin:0 0 28px;color:#888;font-size:14px;">Simple, transparent pricing. Upgrade or downgrade anytime.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
            <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:24px 20px;display:flex;flex-direction:column;gap:12px;">
                <div style="font-size:12px;color:#888;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">Free</div>
                <div style="font-size:32px;font-weight:800;color:#fff;">₹0<span style="font-size:14px;font-weight:400;color:#666;">/mo</span></div>
                <p style="font-size:13px;color:#999;margin:0;">Get started with core AI features, no credit card required.</p>
                <hr style="border:none;border-top:1px solid #222;margin:4px 0;">
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">${makeList(freeFeatures,'#10a37f')}</ul>
                <button disabled style="margin-top:auto;padding:10px;border-radius:8px;border:1px solid #333;background:#222;color:#666;font-size:13px;font-weight:600;cursor:default;">Current plan</button>
            </div>
            <div style="background:#111;border:1px solid rgba(16,163,127,0.35);border-radius:12px;padding:24px 20px;display:flex;flex-direction:column;gap:12px;position:relative;">
                <div style="position:absolute;top:-1px;right:16px;background:#10a37f;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:0 0 8px 8px;letter-spacing:.04em;text-transform:uppercase;">Popular</div>
                <div style="font-size:12px;color:#10a37f;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">Pro</div>
                <div style="font-size:32px;font-weight:800;color:#fff;">₹199<span style="font-size:14px;font-weight:400;color:#666;">/mo</span></div>
                <p style="font-size:13px;color:#999;margin:0;">Everything in Free, plus priority access and advanced models.</p>
                <hr style="border:none;border-top:1px solid #222;margin:4px 0;">
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">${makeList(proFeatures,'#10a37f')}</ul>
                <button onclick="alert('Pro plan \u2014 coming soon! Stay tuned.')" style="margin-top:auto;padding:10px;border-radius:8px;border:none;background:#10a37f;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Upgrade to Pro</button>
            </div>
            <div style="background:linear-gradient(145deg,#1a1a1a,#121212);border:1px solid rgba(124,58,237,0.4);border-radius:12px;padding:24px 20px;display:flex;flex-direction:column;gap:12px;">
                <div style="font-size:12px;color:#a78bfa;font-weight:600;letter-spacing:.06em;text-transform:uppercase;">Max</div>
                <div style="font-size:32px;font-weight:800;color:#fff;">₹349<span style="font-size:14px;font-weight:400;color:#666;">/mo</span></div>
                <p style="font-size:13px;color:#999;margin:0;">Full access to every model and the highest usage limits.</p>
                <hr style="border:none;border-top:1px solid #222;margin:4px 0;">
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">${makeList(maxFeatures,'#a78bfa')}</ul>
                <button onclick="alert('Max plan \u2014 coming soon! Stay tuned.')" style="margin-top:auto;padding:10px;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Upgrade to Max</button>
            </div>
        </div>
    </div>`;

    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
};
