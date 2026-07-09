// ============================================================
// 🔄 CATURA AI — LIVE SYNC  (live-sync.js)
// Drop this file into your /static/ folder, then add ONE line
// to index.html  BEFORE  logic.js loads:
//
//   <script src="static/live-sync.js?v=1.0"></script>
//
// That's the only change needed in index.html.
// No changes to logic.js, style.css, or main.py required.
// ============================================================
//
// What this fixes:
//   • Theme / font-size changes don't show until page reload
//   • Nickname / profile-pic changes don't show until reload
//   • New chat started on another tab doesn't appear in history
//   • Chat title saved after first message not reflected live
//
// How it works (same technique as ChatGPT / Claude / Perplexity):
//   1. BroadcastChannel  — instant message bus between every open
//      tab/window of the same origin. Zero polling.
//   2. storage event     — fallback that fires when localStorage
//      is written from another tab (browsers fire this natively).
//   3. Supabase Realtime — optional live subscription for chat
//      history so a new session appears in the sidebar without
//      any user action.
//
// ============================================================

(function () {
    'use strict';

    // ── Channel name — must match across all tabs ──────────────────────────
    const CHANNEL = 'catura_live_sync_v1';

    // ── Keys we watch in localStorage ─────────────────────────────────────
    const WATCHED_KEYS = {
        'catura-theme'       : applyThemeLive,
        'catura-font'        : applyFontLive,
        'catura_call_name'   : applyNicknameLive,
        'catura_profile_pic' : applyProfilePicLive,
        'catura-shortcuts'   : () => {},   // just re-read on next keydown
    };

    // ── BroadcastChannel (same-origin, instant) ────────────────────────────
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel(CHANNEL);
        bc.onmessage = function (ev) {
            const { type, key, value } = ev.data || {};
            if (type === 'setting_changed' && key && WATCHED_KEYS[key]) {
                WATCHED_KEYS[key](value);
            }
            if (type === 'history_changed') {
                refreshHistorySilently();
            }
            if (type === 'new_chat') {
                // Another tab started a new chat — nothing to do in this tab.
            }
        };
    }

    // ── Cross-tab localStorage watcher (fires in OTHER tabs natively) ──────
    window.addEventListener('storage', function (ev) {
        if (ev.key && WATCHED_KEYS[ev.key]) {
            WATCHED_KEYS[ev.key](ev.newValue);
        }
        if (ev.key === '_catura_history_ping') {
            refreshHistorySilently();
        }
    });

    // ── Broadcast helpers (called by patched setTheme / setFontSize etc.) ──
    window._lsync_broadcast = function (type, key, value) {
        if (bc) bc.postMessage({ type, key, value });
        // Also poke localStorage so the storage event fires in other tabs
        // (BroadcastChannel doesn't fire in the sender tab; storage event
        //  from the same tab doesn't fire either — we handle same-tab via
        //  the patched functions below.)
        if (key) {
            // Write a tiny side-channel key that other tabs' storage event
            // will catch — safe to overwrite every time
            try { localStorage.setItem('_catura_sync_ping_' + key, Date.now().toString()); } catch(e) {}
        }
        if (type === 'history_changed') {
            try { localStorage.setItem('_catura_history_ping', Date.now().toString()); } catch(e) {}
        }
    };

    // ──────────────────────────────────────────────────────────────────────
    // LIVE APPLIERS — each one applies ONE setting instantly in this tab.
    // They are called both when this tab triggers a change (same-tab path)
    // AND when another tab sends a BroadcastChannel / storage event.
    // ──────────────────────────────────────────────────────────────────────

    function applyThemeLive(theme) {
        if (!theme) return;
        const root = document.documentElement;
        root.removeAttribute('data-theme');
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
        } else if (theme === 'auto') {
            const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (!dark) root.setAttribute('data-theme', 'light');
        }
        // Keep the settings panel UI in sync (active button highlight)
        document.querySelectorAll('.theme-option').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.theme-option[onclick="setTheme('${theme}')"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }

    function applyFontLive(size) {
        if (!size) return;
        const root = document.documentElement;
        root.removeAttribute('data-fontsize');
        if (size !== 'default') root.setAttribute('data-fontsize', size);
        document.querySelectorAll('.font-option').forEach(btn => btn.classList.remove('active'));
        const btn = document.querySelector(`.font-option[onclick="setFontSize('${size}')"]`);
        if (btn) btn.classList.add('active');
    }

    function applyNicknameLive(name) {
        if (name == null) return;
        // Re-render greeting if it's currently visible
        if (typeof displayGreeting === 'function') {
            const chatbox = document.getElementById('chatbox');
            // Only re-render greeting if we're on the home screen (no real messages yet)
            if (chatbox && chatbox.querySelector('.message.user') === null) {
                displayGreeting();
            }
        }
        // Update any visible "call name" inputs inside the settings panel
        const inp = document.getElementById('callNameInput');
        if (inp && document.activeElement !== inp) inp.value = name;
    }

    function applyProfilePicLive(dataUrl) {
        if (!dataUrl) return;
        window._profilePicDataUrl = dataUrl;
        if (typeof _applyProfilePicToAllAvatars === 'function') {
            _applyProfilePicToAllAvatars(dataUrl);
        }
    }

    // ── Silent history refresh ─────────────────────────────────────────────
    // Re-fetches history list from Supabase and re-renders the sidebar panel
    // WITHOUT navigating away or resetting the current chat.
    let _historyRefreshTimer = null;
    function refreshHistorySilently() {
        // Debounce — don't hammer Supabase on rapid successive events
        clearTimeout(_historyRefreshTimer);
        _historyRefreshTimer = setTimeout(function () {
            // refreshHistoryList() only rebuilds the visible DOM if the
            // accordion is currently open in THIS tab — otherwise it's a
            // no-op (the list re-fetches fresh the next time it's opened
            // anyway), so this is always safe to call.
            if (typeof window.refreshHistoryList === 'function') {
                window.refreshHistoryList();
            } else if (typeof showHistory === 'function') {
                // Fallback for older logic.js builds without refreshHistoryList
                const historyPanel = document.getElementById('historyAccordionList');
                if (historyPanel) showHistory();
            }
        }, 300);
    }

    // ──────────────────────────────────────────────────────────────────────
    // MONKEY-PATCH  — wrap the existing setTheme / setFontSize / etc. that
    // are defined in logic.js so that after they do their thing they also
    // broadcast to other tabs.
    //
    // We wait for DOMContentLoaded (so logic.js has already run) and then
    // wrap the already-defined window functions.
    // ──────────────────────────────────────────────────────────────────────
    function patchFunctions() {

        // ── setTheme ──────────────────────────────────────────────────────
        if (typeof window.setTheme === 'function') {
            const _orig_setTheme = window.setTheme;
            window.setTheme = function (theme) {
                _orig_setTheme(theme);
                window._lsync_broadcast('setting_changed', 'catura-theme', theme);
            };
        }

        // ── setFontSize ───────────────────────────────────────────────────
        if (typeof window.setFontSize === 'function') {
            const _orig_setFontSize = window.setFontSize;
            window.setFontSize = function (size) {
                _orig_setFontSize(size);
                window._lsync_broadcast('setting_changed', 'catura-font', size);
            };
        }

        // ── saveCallName / call_name ──────────────────────────────────────
        // logic.js saves the nickname with:
        //   localStorage.setItem('catura_call_name', value)
        // We patch the save button's handler via a MutationObserver trick
        // but it is simpler to patch localStorage.setItem for our specific key.
        const _origSetItem = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function (key, value) {
            _origSetItem(key, value);
            if (key === 'catura_call_name') {
                applyNicknameLive(value);
                window._lsync_broadcast('setting_changed', 'catura_call_name', value);
            }
            if (key === 'catura_profile_pic') {
                applyProfilePicLive(value);
                window._lsync_broadcast('setting_changed', 'catura_profile_pic', value);
            }
        };

        // ── newChat ───────────────────────────────────────────────────────
        // Notify other tabs so they can refresh their sidebar history list
        if (typeof window.newChat === 'function') {
            const _orig_newChat = window.newChat;
            window.newChat = function () {
                _orig_newChat.apply(this, arguments);
                window._lsync_broadcast('history_changed');
            };
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // SUPABASE REALTIME  — subscribe to new rows in chat_sessions so the
    // history sidebar auto-updates when the current tab saves a new session
    // (e.g. after the AI gives its first reply and the title is written).
    // ──────────────────────────────────────────────────────────────────────
    function startSupabaseHistorySync() {
        // supabaseClient and currentUser are defined in logic.js.
        // We wait until both are ready.
        if (typeof supabaseClient === 'undefined' || !window.currentUser) return;

        const userId = window.currentUser.id;
        if (!userId) return;

        // Avoid double-subscribing
        if (window._lsync_realtime_sub) return;

        try {
            window._lsync_realtime_sub = supabaseClient
                .channel('catura_history_rt_' + userId.slice(0, 8))
                .on(
                    'postgres_changes',
                    {
                        event: '*',           // INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'chat_sessions',
                        filter: 'user_id=eq.' + userId
                    },
                    function () {
                        // A session was added, renamed, deleted or archived —
                        // refresh the sidebar list without touching the chatbox.
                        refreshHistorySilently();
                    }
                )
                .subscribe(function (status) {
                    if (status === 'SUBSCRIBED') {
                        console.log('[LiveSync] ✅ Supabase Realtime — history watching active');
                    }
                });
        } catch (e) {
            console.warn('[LiveSync] Realtime subscription failed (non-fatal):', e);
        }
    }

    // ── Wait for logic.js to finish, then patch ────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            patchFunctions();
            // Give logic.js getUser() time to set currentUser
            setTimeout(startSupabaseHistorySync, 2000);
        });
    } else {
        patchFunctions();
        setTimeout(startSupabaseHistorySync, 2000);
    }

    // Also try again after 5s in case auth was slow
    setTimeout(function () {
        if (!window._lsync_realtime_sub) startSupabaseHistorySync();
    }, 5000);

    console.log('[LiveSync] 🔄 Catura live-sync loaded — no more manual refreshes!');

})();
