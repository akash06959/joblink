const { pool } = require('../db');

class Notification {
    static async create({ userId, type, title, message, relatedLink }) {
        const result = await pool.query(
            `INSERT INTO "Notifications" ("userId", type, title, message, "relatedLink", read, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
            [userId, type, title, message, relatedLink || null, false]
        );
        return result.rows[0];
    }

    static async findByUser(userId) {
        const result = await pool.query(
            `SELECT * FROM "Notifications" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
            [userId]
        );
        return result.rows;
    }

    static async markAsRead(id, userId) {
        const result = await pool.query(
            `UPDATE "Notifications" SET read = true WHERE id = $1 AND "userId" = $2 RETURNING *`,
            [id, userId]
        );
        return result.rows[0];
    }

    static async markAllAsRead(userId) {
        const result = await pool.query(
            `UPDATE "Notifications" SET read = true WHERE "userId" = $1 RETURNING *`,
            [userId]
        );
        return result.rows;
    }
}

module.exports = Notification;
