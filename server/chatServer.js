/**
 * chatServer.js
 * ─────────────────────────────────────────────────────────────
 * Embedded ChatStream socket server — runs on port 3001 alongside
 * the main JobLink API (port 5000).
 *
 * Socket events (same as the original ChatStream application):
 *   CLIENT → SERVER
 *     join_room(roomId)                    — join a chat room
 *     send_message({room,author,message,time}) — send a message
 *
 *   SERVER → CLIENT
 *     load_messages([...rows])             — history on join
 *     receive_message({...})               — new message broadcast
 */

const http = require('http');
const { Server } = require('socket.io');

const CHAT_PORT = process.env.CHAT_PORT || 3001;

/* ── create a standalone HTTP server just for Socket.IO ── */
const chatHttpServer = http.createServer();

const io = new Server(chatHttpServer, {
    cors: {
        origin: '*',            // allow all origins in dev
        methods: ['GET', 'POST'],
    },
});

/* ── helper: get the shared pg pool from the main db module ── */
const getPool = () => {
    try {
        const { pool } = require('./db');
        return pool;
    } catch {
        return null;
    }
};

/* ── ensure the messages table exists (idempotent) ── */
const ensureMessagesTable = async () => {
    const pool = getPool();
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id         SERIAL PRIMARY KEY,
                room       TEXT         NOT NULL,
                author     TEXT         NOT NULL,
                message    TEXT         NOT NULL,
                time       TEXT,
                seen       BOOLEAN      DEFAULT FALSE,
                deleted    BOOLEAN      DEFAULT FALSE,
                created_at TIMESTAMPTZ  DEFAULT NOW()
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS block_list (
                id         SERIAL PRIMARY KEY,
                blocker_id INT          NOT NULL,
                blocked_id INT          NOT NULL,
                room       TEXT         NOT NULL,
                created_at TIMESTAMPTZ  DEFAULT NOW(),
                UNIQUE(blocker_id, blocked_id)
            )
        `);

        /* Add columns to existing tables (safe – errors ignored) */
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen    BOOLEAN DEFAULT FALSE`).catch(() => { });
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE`).catch(() => { });
        console.log('[ChatServer] ✅  messages & block_list tables ready');
    } catch (err) {
        console.error('[ChatServer] ❌  Failed to create chat tables:', err.message);
    }
};

/* ── socket.io event handlers ── */
io.on('connection', (socket) => {
    console.log(`[ChatServer] User connected: ${socket.id}`);

    /* ── join_room ── */
    socket.on('join_room', async (roomId) => {
        socket.join(roomId);
        console.log(`[ChatServer] ${socket.id} joined room: ${roomId}`);

        const pool = getPool();
        if (!pool) { socket.emit('load_messages', []); return; }

        try {
            // Check if room is blocked
            const blockCheck = await pool.query(
                `SELECT blocker_id, blocked_id FROM block_list WHERE room = $1`,
                [roomId]
            );
            const blockData = blockCheck.rows[0] || null;

            const result = await pool.query(
                `SELECT id, room, author, message, time, seen
                 FROM messages
                 WHERE room = $1 AND deleted = FALSE
                 ORDER BY id ASC LIMIT 100`,
                [roomId]
            );

            socket.emit('load_messages', {
                messages: result.rows,
                blockStatus: blockData
            });
        } catch (err) {
            console.error('[ChatServer] load_messages error:', err.message);
            socket.emit('load_messages', { messages: [], blockStatus: null });
        }
    });

    /* ── send_message ── */
    socket.on('send_message', async (data) => {
        const { room, author, message, time } = data;
        console.log(`[ChatServer] Message in room "${room}" from "${author}"`);

        const pool = getPool();
        if (pool) {
            try {
                /* Check if room is BLOCKED before sending */
                const blockCheck = await pool.query(
                    `SELECT id FROM block_list WHERE room = $1 LIMIT 1`,
                    [room]
                );

                if (blockCheck.rows.length > 0) {
                    console.log(`[ChatServer] 🚫 Message blocked in room "${room}"`);
                    socket.emit('message_rejected', { error: "You are blocked from sending messages in this chat." });
                    return;
                }

                /* 1. Save message to chat history — return the new row id */
                const ins = await pool.query(
                    'INSERT INTO messages (room, author, message, time) VALUES ($1, $2, $3, $4) RETURNING id',
                    [room, author, message, time || new Date().toISOString()]
                );
                const msgId = ins.rows[0].id;
                console.log(`[ChatServer] ✅ Message saved (id=${msgId})`);

                /* Broadcast with the DB id so clients can reference it */
                const payload = { ...data, id: msgId, seen: false };
                socket.to(room).emit('receive_message', payload);
                /* Echo back to sender with the id */
                socket.emit('message_ack', payload);

                /* 2. Create DB Notification for the recipient
                 *    Room = "[smallerId]-[largerId]" (sorted string IDs joined by -)
                 *    Find sender by name → deduce recipient from the other room ID.
                 */
                try {
                    const Notification = require('./models/Notification');

                    // Look up sender's integer ID by their display name
                    const senderRes = await pool.query(
                        'SELECT id, role FROM "Users" WHERE name = $1 LIMIT 1',
                        [author]
                    );

                    if (senderRes.rows.length === 0) {
                        console.warn(`[ChatServer] ⚠️  Sender "${author}" not found in Users table`);
                    } else {
                        const senderId = Number(senderRes.rows[0].id);
                        console.log(`[ChatServer] Sender ID: ${senderId}`);

                        // Room format: "A-B" where A and B are sorted string user IDs
                        // Split carefully: take first and last segment only
                        const parts = room.split('-').map(Number).filter(n => !isNaN(n) && n > 0);
                        console.log(`[ChatServer] Room parts: ${parts}`);

                        const recipientId = parts.find(id => id !== senderId);
                        console.log(`[ChatServer] Recipient ID: ${recipientId}`);

                        if (!recipientId) {
                            console.warn(`[ChatServer] ⚠️  Could not determine recipient from room "${room}" and senderId ${senderId}`);
                        } else {
                            // Get recipient's role to build the correct deep link
                            const recipientRes = await pool.query(
                                'SELECT role FROM "Users" WHERE id = $1 LIMIT 1',
                                [recipientId]
                            );
                            const recipientRole = recipientRes.rows[0]?.role || 'Seeker';

                            // Build a deep link that auto-opens the specific conversation
                            // Messages.jsx reads ?recruiterId / ?seekerId from the URL
                            const senderParam = recipientRole === 'Recruiter' ? 'seekerId' : 'recruiterId';
                            const basePath = recipientRole === 'Recruiter' ? '/recruiter/messages' : '/seeker/messages';
                            const link = `${basePath}?${senderParam}=${senderId}&name=${encodeURIComponent(author)}`;

                            // Dedup: skip if a notification from this sender was created in last 2 minutes
                            const recentCheck = await pool.query(
                                `SELECT id FROM "Notifications"
                                 WHERE "userId" = $1
                                   AND type = 'message'
                                   AND title = $2
                                   AND "createdAt" > NOW() - INTERVAL '2 minutes'
                                 LIMIT 1`,
                                [recipientId, `New message from ${author}`]
                            );

                            if (recentCheck.rows.length > 0) {
                                console.log(`[ChatServer] ⏩ Skipping duplicate notification (recent one exists)`);
                            } else {
                                const snippet = message.length > 80
                                    ? message.slice(0, 80) + '…'
                                    : message;

                                await Notification.create({
                                    userId: recipientId,
                                    type: 'message',
                                    title: `New message from ${author}`,
                                    message: snippet,
                                    relatedLink: link,
                                });
                                console.log(`[ChatServer] 🔔 Notification created for user ${recipientId} → ${link}`);
                            }
                        }
                    }
                } catch (notifErr) {
                    console.error('[ChatServer] ❌ Notification error:', notifErr.message);
                }

            } catch (err) {
                console.error('[ChatServer] save message error:', err.message);
            }
        }
        /* NOTE: receive_message is now emitted INSIDE the try block above (with id) */
    });

    /* ── mark_read : recipient tells server they've read messages in a room ── */
    socket.on('mark_read', async ({ room, reader }) => {
        const pool = getPool();
        if (!pool) return;
        try {
            /* Mark all messages NOT by the reader as seen */
            await pool.query(
                `UPDATE messages SET seen = TRUE
                 WHERE room = $1 AND author != $2 AND seen = FALSE AND deleted = FALSE`,
                [room, reader]
            );
            /* Tell everyone in the room that messages are seen */
            io.to(room).emit('read_receipt', { room, reader });
        } catch (err) {
            console.error('[ChatServer] mark_read error:', err.message);
        }
    });

    /* ── delete_message : delete a single message by id ── */
    socket.on('delete_message', async ({ id, room, author }) => {
        const pool = getPool();
        if (!pool) return;
        try {
            /* Only the original author can delete */
            const result = await pool.query(
                `UPDATE messages SET deleted = TRUE
                 WHERE id = $1 AND author = $2
                 RETURNING id`,
                [id, author]
            );
            if (result.rows.length > 0) {
                /* Broadcast deletion to everyone in the room */
                io.to(room).emit('message_deleted', { id });
                console.log(`[ChatServer] 🗑️  Message ${id} deleted by ${author}`);
            }
        } catch (err) {
            console.error('[ChatServer] delete_message error:', err.message);
        }
    });

    /* ── toggle_block : recruiter blocks/unblocks a user ── */
    socket.on('toggle_block', async ({ room, blockerId, blockedId, isBlocking }) => {
        const pool = getPool();
        if (!pool) return;
        try {
            if (isBlocking) {
                await pool.query(
                    `INSERT INTO block_list (blocker_id, blocked_id, room) 
                     VALUES ($1, $2, $3) 
                     ON CONFLICT DO NOTHING`,
                    [blockerId, blockedId, room]
                );
                console.log(`[ChatServer] 🚫 User ${blockerId} BLOCKED ${blockedId} in ${room}`);
            } else {
                await pool.query(
                    `DELETE FROM block_list WHERE blocker_id = $1 AND blocked_id = $2`,
                    [blockerId, blockedId]
                );
                console.log(`[ChatServer] ✅ User ${blockerId} UNBLOCKED ${blockedId} in ${room}`);
            }

            // Broadcast the block status update to BOTH users in the room so the UI updates
            io.to(room).emit('block_status_changed', {
                room,
                blockData: isBlocking ? { blocker_id: blockerId, blocked_id: blockedId } : null
            });

        } catch (err) {
            console.error('[ChatServer] toggle_block error:', err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[ChatServer] User disconnected: ${socket.id}`);
    });
});

/* ── start ── */
const startChatServer = () => {
    ensureMessagesTable();

    chatHttpServer.listen(CHAT_PORT, () => {
        console.log(`[ChatServer] 💬  Socket.IO chat server running on port ${CHAT_PORT}`);
    });

    chatHttpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`[ChatServer] ⚠️  Port ${CHAT_PORT} already in use — chat server skipped.`);
        } else {
            console.error('[ChatServer] Error:', err);
        }
    });
};

module.exports = { startChatServer };
