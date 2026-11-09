/**
 * ChatNotificationContext.jsx
 *
 * Global context that:
 *  1. Opens a single background Socket.IO connection on mount
 *  2. Proactively loads all the user's chat rooms from the API
 *     → works even if the user never visits the Messages page
 *  3. Fires live unread badge updates + OS browser notifications
 *  4. Exposes totalUnread, clearUnread(), clearRoom(), registerRooms()
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const CHAT_SERVER = 'http://localhost:3001';
const API_BASE = 'http://localhost:5000/api';

/** Deterministic room ID — same algorithm used in Messages.jsx */
const makeRoom = (idA, idB) => [String(idA), String(idB)].sort().join('-');

/* ─── Context shape ─────────────────────────────────────── */
const ChatNotificationContext = createContext({
    totalUnread: 0,
    unreadByRoom: {},
    clearUnread: () => { },
    clearRoom: () => { },
    registerRooms: () => { },
});

export const useChatNotifications = () => useContext(ChatNotificationContext);

/* ─── Provider ──────────────────────────────────────────── */
export const ChatNotificationProvider = ({ children }) => {
    const [unreadByRoom, setUnreadByRoom] = useState({});

    const socketRef = useRef(null);
    const roomsRef = useRef(new Set());   // rooms the socket has joined
    const readyRef = useRef(false);       // true once socket is connected

    const me = JSON.parse(localStorage.getItem('user') || '{}');
    const myName = me.name || '';
    const myId = String(me.id || me._id || '');

    /* ── Ask for browser notification permission once ── */
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    /* ── Internal: join a list of room IDs on the socket ── */
    const joinRooms = useCallback((roomIds) => {
        const s = socketRef.current;
        if (!s) return;
        roomIds.forEach(rid => {
            if (!roomsRef.current.has(rid)) {
                roomsRef.current.add(rid);
                s.emit('join_room', rid);
            }
        });
    }, []);

    /* ── Proactively fetch user's rooms from API ── */
    const loadAndJoinRooms = useCallback(async () => {
        if (!me.token || !myId) return;
        const cfg = { headers: { Authorization: `Bearer ${me.token}` } };
        try {
            let roomIds = [];

            if (me.role === 'Seeker') {
                // Seeker → one room per recruiter they applied to
                const { data: apps } = await axios.get(
                    `${API_BASE}/applications/my-applications`, cfg
                );
                const seen = new Set();
                for (const app of apps) {
                    const rid = String(app.recruiterId);
                    if (!rid || rid === 'undefined' || seen.has(rid)) continue;
                    seen.add(rid);
                    roomIds.push(makeRoom(myId, rid));
                }
            } else if (me.role === 'Recruiter') {
                // Recruiter → one room per seeker who applied to their jobs
                const { data: applicants } = await axios.get(
                    `${API_BASE}/applications/my-applicants`, cfg
                );
                const seen = new Set();
                for (const a of applicants) {
                    const sid = String(a.seekerId);
                    if (!sid || sid === 'undefined' || seen.has(sid)) continue;
                    seen.add(sid);
                    roomIds.push(makeRoom(myId, sid));
                }
            }

            joinRooms(roomIds);
        } catch (err) {
            console.warn('[ChatNotifications] Could not pre-load rooms:', err.message);
        }
    }, [me.token, myId, me.role, joinRooms]);

    /* ── Create socket, set up all listeners ── */
    useEffect(() => {
        if (!me.token) return;

        const s = io(CHAT_SERVER, { transports: ['websocket', 'polling'] });
        socketRef.current = s;

        /* Once connected → load rooms from API */
        s.on('connect', () => {
            readyRef.current = true;
            loadAndJoinRooms();
        });

        /* Incoming message handler */
        s.on('receive_message', (data) => {
            // Ignore rooms we don't participate in & our own messages
            if (!roomsRef.current.has(data.room)) return;
            if (data.author === myName) return;

            // Increment unread badge
            setUnreadByRoom(prev => ({
                ...prev,
                [data.room]: (prev[data.room] || 0) + 1,
            }));

            // OS notification when tab is not focused
            if (document.visibilityState !== 'visible') {
                if ('Notification' in window && Notification.permission === 'granted') {
                    const messagesPath = me.role === 'Recruiter'
                        ? '/recruiter/messages'
                        : '/seeker/messages';

                    const notif = new Notification('💬 JobLink — New Message', {
                        body: `${data.author}: ${data.message.slice(0, 80)}`,
                        icon: '/favicon.ico',
                        tag: data.room,    // collapses duplicate notifications
                        renotify: true,
                    });

                    /* Clicking the popup → focus tab + navigate to Messages */
                    notif.onclick = () => {
                        window.focus();
                        window.location.href = messagesPath;
                        notif.close();
                    };

                    setTimeout(() => notif.close(), 6000);
                }
            }
        });

        return () => {
            readyRef.current = false;
            s.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [me.token]);

    /**
     * registerRooms — called by Messages.jsx after loading its contact list.
     * Adds any rooms not already tracked (e.g. deep-linked conversations).
     */
    const registerRooms = useCallback((roomIds) => {
        joinRooms(roomIds);
    }, [joinRooms]);

    /** Clear ALL unread counts (when user navigates to Messages page) */
    const clearUnread = useCallback(() => setUnreadByRoom({}), []);

    /** Clear unread for a specific room (when user opens a conversation) */
    const clearRoom = useCallback((roomId) => {
        setUnreadByRoom(prev => {
            const next = { ...prev };
            delete next[roomId];
            return next;
        });
    }, []);

    const totalUnread = Object.values(unreadByRoom).reduce((s, v) => s + v, 0);

    return (
        <ChatNotificationContext.Provider
            value={{ totalUnread, unreadByRoom, clearUnread, clearRoom, registerRooms }}
        >
            {children}
        </ChatNotificationContext.Provider>
    );
};
