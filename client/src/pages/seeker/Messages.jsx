import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import {
    MessageCircle, Send, Search, Briefcase,
    Wifi, WifiOff, AlertCircle, ChevronRight, Trash2, Check, CheckCheck,
    ShieldOff, ShieldCheck
} from 'lucide-react';
import { useChatNotifications } from '../../components/ChatNotificationContext';
import UserAvatar from '../../components/UserAvatar';

/* ─── Config ───────────────────────────────────────────────── */
const CHAT_SERVER = 'http://localhost:3001';

/* ─── Helpers ──────────────────────────────────────────────── */
const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const nowTime = () =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

/** Deterministic room ID — same from BOTH sides */
const makeRoom = (idA, idB) => [String(idA), String(idB)].sort().join('-');

/* ─── Avatar (for contacts / message bubbles) ──────────────── */
const API = 'http://localhost:5000';

const Avatar = ({ name, image, size = 10, gradient = 'from-blue-500 to-indigo-600' }) => {
    const gradients = [
        'from-blue-500 to-indigo-600',
        'from-purple-500 to-pink-600',
        'from-green-500 to-teal-600',
        'from-orange-500 to-red-500',
        'from-cyan-500 to-blue-600',
    ];
    const g = gradient !== 'from-blue-500 to-indigo-600'
        ? gradient
        : gradients[(name?.charCodeAt(0) || 0) % gradients.length];

    return (
        <div className={`w-${size} h-${size} rounded-full overflow-hidden flex-shrink-0 select-none`}>
            {image ? (
                <img
                    src={`${API}/${image}`}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                />
            ) : (
                <div className={`w-full h-full bg-gradient-to-br ${g} flex items-center justify-center text-white font-bold text-xs`}>
                    {initials(name)}
                </div>
            )}
        </div>
    );
};

/* ════════════════════════════════════════════════════════════ */
const Messages = () => {
    const location = useLocation();
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    const myId = String(me.id || me._id || '');
    const myName = me.name || 'You';

    /* ── state ── */
    const [connected, setConnected] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [active, setActive] = useState(null);   // { id, name, company, jobTitle, room }
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [unread, setUnread] = useState({});     // roomId → count
    const [blockStatus, setBlockStatus] = useState(null); // { blocker_id, blocked_id } | null
    const [blockError, setBlockError] = useState('');

    const socketRef = useRef(null);
    const activeRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    /* Pull in the global notification context */
    const { registerRooms, clearRoom } = useChatNotifications();

    /* mirror active into ref so socket callbacks always see latest value */
    useEffect(() => { activeRef.current = active; }, [active]);

    /* ── 1. Socket connection ── */
    useEffect(() => {
        const s = io(CHAT_SERVER, { transports: ['websocket', 'polling'] });
        socketRef.current = s;

        s.on('connect', () => setConnected(true));
        s.on('disconnect', () => setConnected(false));
        s.on('connect_error', () => setConnected(false));

        /* History when joining a room */
        s.on('load_messages', (payload) => {
            // payload can be old array format or new {messages, blockStatus}
            const rows = Array.isArray(payload) ? payload : (payload.messages || []);
            const bStatus = Array.isArray(payload) ? null : (payload.blockStatus || null);
            setBlockStatus(bStatus);
            setMessages(rows.map(r => ({
                id: r.id, room: r.room, author: r.author,
                message: r.message, time: r.time, seen: r.seen,
                authorAvatar: r.authorAvatar || null,
            })));
        });

        /* Server pushes real-time block status changes */
        s.on('block_status_changed', ({ blockData }) => {
            setBlockStatus(blockData || null);
        });

        /* Server rejects message because room is blocked */
        s.on('message_rejected', ({ error }) => {
            setBlockError(error);
            setTimeout(() => setBlockError(''), 5000);
        });

        /* Server echoes back sender's own message WITH the DB id */
        s.on('message_ack', (data) => {
            setMessages(prev => prev.map(m =>
                m._pending && m.author === data.author && m.message === data.message
                    ? { ...data, _pending: false }
                    : m
            ));
        });

        /* Incoming message from the other person */
        s.on('receive_message', data => {
            if (activeRef.current?.room === data.room) {
                setMessages(prev => [...prev, { ...data, seen: false }]);
                /* Immediately mark as read since we're in this room */
                s.emit('mark_read', { room: data.room, reader: myName });
            } else {
                setUnread(prev => ({ ...prev, [data.room]: (prev[data.room] || 0) + 1 }));
                if (document.visibilityState !== 'visible') {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const notif = new Notification('💬 JobLink — New Message', {
                            body: `${data.author}: ${data.message.slice(0, 80)}`,
                            icon: '/favicon.ico',
                            tag: data.room,
                            renotify: true,
                        });
                        notif.onclick = () => { window.focus(); notif.close(); };
                        setTimeout(() => notif.close(), 6000);
                    }
                }
            }
        });

        /* Read receipt — mark all messages by others as seen */
        s.on('read_receipt', ({ room, reader }) => {
            setMessages(prev => prev.map(m =>
                m.room === room && m.author !== reader ? { ...m, seen: true } : m
            ));
        });

        /* Someone deleted a message — remove from UI */
        s.on('message_deleted', ({ id }) => {
            setMessages(prev => prev.filter(m => m.id !== id));
        });

        return () => s.disconnect();
    }, []);

    /* ── 2. Load contacts based on role ── */
    useEffect(() => {
        if (!me.token) { setLoading(false); return; }

        const load = async () => {
            const cfg = { headers: { Authorization: `Bearer ${me.token}` } };
            try {
                let list = [];

                if (me.role === 'Seeker') {
                    /* Seeker → see every recruiter they applied to */
                    const { data: apps } = await axios.get(
                        'http://localhost:5000/api/applications/my-applications', cfg
                    );
                    const seen = new Set();
                    for (const app of apps) {
                        const rid = String(app.recruiterId);
                        if (!rid || seen.has(rid)) continue;
                        seen.add(rid);
                        list.push({
                            id: rid,
                            name: app.recruiterName || app.companyName || 'Recruiter',
                            company: app.companyName || '',
                            jobTitle: app.jobTitle || '',
                            avatar: app.recruiterAvatar || null,  // 📸 recruiter's photo
                            room: makeRoom(myId, rid),
                        });
                    }
                } else if (me.role === 'Recruiter') {
                    /* Recruiter → see every seeker who applied to their jobs */
                    const { data: applicants } = await axios.get(
                        'http://localhost:5000/api/applications/my-applicants', cfg
                    );
                    const seen = new Set();
                    for (const a of applicants) {
                        const sid = String(a.seekerId);
                        if (!sid || seen.has(sid)) continue;
                        seen.add(sid);
                        list.push({
                            id: sid,
                            name: a.seekerName || 'Applicant',
                            company: a.company || '',
                            jobTitle: a.jobTitle || '',
                            avatar: a.seekerAvatar || null,      // 📸 seeker's photo
                            room: makeRoom(myId, sid),
                        });
                    }
                }

                setContacts(list);

                /* Let background notification context subscribe to all these rooms */
                registerRooms(list.map(c => c.room));

                /* Auto-open a contact from URL: ?seekerId=X or ?recruiterId=X */
                const params = new URLSearchParams(location.search);
                const autoId = params.get('seekerId') || params.get('recruiterId');
                const autoName = params.get('name') || '';
                const autoJob = params.get('jobTitle') || '';
                if (autoId) {
                    const existing = list.find(c => c.id === String(autoId));
                    if (existing) {
                        setActive(existing);
                    } else {
                        /* Contact not in list yet (e.g. deep-linked) — create inline */
                        const inline = {
                            id: String(autoId),
                            name: decodeURIComponent(autoName) || 'User',
                            company: '',
                            jobTitle: decodeURIComponent(autoJob),
                            room: makeRoom(myId, String(autoId)),
                        };
                        setContacts(prev => [inline, ...prev]);
                        setActive(inline);
                    }
                }
            } catch (err) {
                console.error('[Messages] contacts error:', err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []); // eslint-disable-line

    /* ── 3. Join room when active contact changes ── */
    useEffect(() => {
        if (!active || !socketRef.current) return;
        setMessages([]);
        setBlockStatus(null);
        setBlockError('');
        socketRef.current.emit('join_room', active.room);
        setUnread(prev => ({ ...prev, [active.room]: 0 }));
        clearRoom(active.room);
        /* Mark messages as read when opening this room */
        socketRef.current.emit('mark_read', { room: active.room, reader: myName });
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [active?.room]); // eslint-disable-line

    /* ── 4. Auto-scroll ── */
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    /* ── 5. Send message ── */
    const send = () => {
        if (!draft.trim() || !socketRef.current || !active) return;
        const t = nowTime();
        const payload = {
            room: active.room,
            author: myName,
            authorAvatar: me.avatar || null,  // 📸 include sender's avatar for the recipient
            message: draft.trim(),
            time: t,
            seen: false, _pending: true,
        };
        socketRef.current.emit('send_message', payload);
        setMessages(prev => [...prev, payload]);
        setDraft('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    /* Delete a message */
    const deleteMsg = (msg) => {
        if (!socketRef.current) return;
        socketRef.current.emit('delete_message', {
            id: msg.id,
            room: active.room,
            author: myName,
        });
        /* Optimistically remove from UI */
        setMessages(prev => prev.filter(m => m !== msg));
    };

    const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

    /* Toggle block — only Recruiters can call this */
    const toggleBlock = () => {
        if (!socketRef.current || !active) return;
        const isCurrentlyBlocked = !!blockStatus;
        socketRef.current.emit('toggle_block', {
            room: active.room,
            blockerId: Number(myId),
            blockedId: Number(active.id),
            isBlocking: !isCurrentlyBlocked,
        });
    };

    /* Is the current user the one who got blocked? */
    const iAmBlocked = blockStatus && String(blockStatus.blocked_id) === myId;

    const filtered = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase())
    );

    /* ══════════════════════════ RENDER ═══════════════════════ */

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh] gap-3 text-gray-500 text-sm">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading messages…
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-7rem)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* ══ LEFT — Contacts Sidebar ══ */}
            <aside className="w-72 shrink-0 flex flex-col border-r border-gray-100">

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-base font-bold text-gray-900">Messages</h1>
                        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${connected
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-500 border-red-200'
                            }`}>
                            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {connected ? 'Live' : 'Offline'}
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={me.role === 'Recruiter' ? 'Search applicants…' : 'Search recruiters…'}
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-blue-400 focus:bg-white transition"
                        />
                    </div>
                </div>

                {/* Contact list */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-5 gap-2">
                            <MessageCircle className="w-8 h-8 text-gray-200" />
                            <p className="text-xs text-gray-400 leading-relaxed">
                                {contacts.length === 0
                                    ? me.role === 'Recruiter'
                                        ? 'No applicants yet. Post a job to receive applications.'
                                        : 'Apply to jobs to start chatting with recruiters.'
                                    : 'No matches.'}
                            </p>
                        </div>
                    ) : filtered.map(c => {
                        const isActive = active?.id === c.id;
                        const badge = unread[c.room] || 0;
                        return (
                            <button
                                key={c.id}
                                onClick={() => setActive(c)}
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition-all hover:bg-blue-50/40 ${isActive ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''
                                    }`}
                            >
                                <Avatar name={c.name} image={c.avatar} size={9} />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                                        {c.name}
                                    </p>
                                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                                        <Briefcase className="w-3 h-3 shrink-0" />
                                        {c.jobTitle || c.company || 'Conversation'}
                                    </p>
                                </div>
                                {badge > 0 && (
                                    <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                                        {badge > 9 ? '9+' : badge}
                                    </span>
                                )}
                                {isActive && <ChevronRight className="w-4 h-4 text-blue-300 shrink-0" />}
                            </button>
                        );
                    })}
                </div>

                {/* Me strip */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center gap-2.5">
                    <UserAvatar size={8} />
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{myName}</p>
                        <p className="text-[11px] text-gray-400">{me.role}</p>
                    </div>
                </div>
            </aside>

            {/* ══ RIGHT — Chat area ══ */}
            <div className="flex-1 flex flex-col min-w-0">
                {active ? (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-100 bg-white">
                            <Avatar name={active.name} image={active.avatar} size={10} />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm">{active.name}</p>
                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                    {active.company && <span>{active.company} · </span>}
                                    <Briefcase className="w-3 h-3 shrink-0" />
                                    {active.jobTitle || 'Chat'}
                                </p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${connected
                                ? 'bg-green-50 text-green-600 border-green-200'
                                : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}>
                                {connected ? '● Online' : '○ Offline'}
                            </span>

                            {/* Block/Unblock — only visible to Recruiters */}
                            {me.role === 'Recruiter' && (
                                <button
                                    onClick={toggleBlock}
                                    title={blockStatus ? 'Unblock this user' : 'Block this user'}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${blockStatus
                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                        }`}
                                >
                                    {blockStatus
                                        ? <><ShieldCheck className="w-3.5 h-3.5" /> Unblock</>
                                        : <><ShieldOff className="w-3.5 h-3.5" /> Block</>}
                                </button>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 bg-[#F8F9FA]">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                                        <MessageCircle className="w-7 h-7 text-blue-200" />
                                    </div>
                                    <p className="text-sm text-gray-400">No messages yet — say hello! 👋</p>
                                </div>
                            ) : messages.map((msg, i) => {
                                const isMine = msg.author === myName;
                                return (
                                    <div key={msg.id ?? i} className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {!isMine && (
                                            <Avatar
                                                name={msg.author}
                                                image={msg.authorAvatar || active?.avatar}
                                                size={7}
                                            />
                                        )}
                                        <div className="max-w-[66%]">
                                            {!isMine && (
                                                <p className="text-[10px] text-gray-400 mb-1 ml-1">{msg.author}</p>
                                            )}

                                            {/* Bubble row: delete btn + bubble */}
                                            <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Delete button — only for own messages, on hover */}
                                                {isMine && (
                                                    <button
                                                        onClick={() => deleteMsg(msg)}
                                                        title="Delete message"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-100 text-gray-300 hover:text-red-500 shrink-0 mb-0.5"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}

                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isMine
                                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                                    }`}>
                                                    {msg.message}
                                                </div>
                                            </div>

                                            {/* Timestamp + seen status */}
                                            <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                                                <span className="text-[10px] text-gray-400">{msg.time}</span>
                                                {isMine && (
                                                    msg.seen
                                                        ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" title="Seen" />
                                                        : <Check className="w-3.5 h-3.5 text-gray-400" title="Sent" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="px-5 py-4 border-t border-gray-100 bg-white">
                            {!connected && (
                                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    Chat server offline — run <code className="font-mono bg-amber-100 px-1 rounded">npm run dev</code> from the project root.
                                </div>
                            )}

                            {/* Blocked banner — shown when THIS user is blocked */}
                            {iAmBlocked && (
                                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                                    <ShieldOff className="w-3.5 h-3.5 shrink-0" />
                                    You have been blocked by this recruiter. You can no longer send messages.
                                </div>
                            )}

                            {/* Blocked banner — shown to the Recruiter who blocked */}
                            {blockStatus && !iAmBlocked && me.role === 'Recruiter' && (
                                <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3">
                                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                    You have blocked this user. They can no longer send messages.
                                </div>
                            )}

                            {/* Error banner if a message was rejected by the server */}
                            {blockError && (
                                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    {blockError}
                                </div>
                            )}

                            <div className="flex items-end gap-3">
                                <textarea
                                    ref={inputRef}
                                    rows={1}
                                    value={draft}
                                    onChange={e => setDraft(e.target.value)}
                                    onKeyDown={onKey}
                                    disabled={!connected || !!iAmBlocked}
                                    placeholder={iAmBlocked ? 'You are blocked from this chat.' : `Message ${active.name}… (Enter to send)`}
                                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition max-h-32 disabled:opacity-50"
                                    style={{ lineHeight: 1.5 }}
                                />
                                <button
                                    onClick={send}
                                    disabled={!draft.trim() || !connected || !!iAmBlocked}
                                    className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition active:scale-95 shadow-sm shadow-blue-200 shrink-0"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                                <kbd className="bg-gray-100 px-1 py-0.5 rounded">Enter</kbd> send ·{' '}
                                <kbd className="bg-gray-100 px-1 py-0.5 rounded">Shift+Enter</kbd> new line
                            </p>
                        </div>
                    </>
                ) : (
                    /* No conversation selected */
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 bg-gray-50/50 px-8">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-100">
                            <MessageCircle className="w-12 h-12 text-blue-100" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">
                                {me.role === 'Recruiter' ? 'Chat with Applicants' : 'Chat with Recruiters'}
                            </h2>
                            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                                {me.role === 'Recruiter'
                                    ? 'Select an applicant from the left to start a conversation, or click "Message" on any applicant in your job applications.'
                                    : 'Select a recruiter from the left, or click "Message Recruiter" on any of your applications.'}
                            </p>
                        </div>
                        {!connected && (
                            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                                <WifiOff className="w-3.5 h-3.5" />
                                ChatStream server not running on port 3001
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
