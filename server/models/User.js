const { pool } = require('../db');
const bcrypt = require('bcryptjs');

class User {
    constructor(row) {
        if (row) {
            this.id = row.id;
            this.name = row.name;
            this.email = row.email;
            this.password = row.password;
            this.role = row.role;
            this.headline = row.headline;
            this.location = row.location;
            this.createdAt = row.createdAt;
            this.updatedAt = row.updatedAt;
            this.resume = row.resume;
            this.about = row.about;
            this.skills = row.skills;
            this.education = row.education;
            this.googleId = row.googleId;
            this.companyName = row.companyName;
            this.avatar = row.avatar || null;
        }
    }

    static async findOne({ where }) {
        if (where.email) {
            const res = await pool.query('SELECT * FROM "Users" WHERE email = $1', [where.email]);
            if (res.rows.length > 0) return new User(res.rows[0]);
        }
        if (where.name) {
            const res = await pool.query('SELECT * FROM "Users" WHERE name = $1', [where.name]);
            if (res.rows.length > 0) return new User(res.rows[0]);
        }
        if (where.googleId) {
            const res = await pool.query('SELECT * FROM "Users" WHERE "googleId" = $1', [where.googleId]);
            if (res.rows.length > 0) return new User(res.rows[0]);
        }
        return null;
    }

    static async findByPk(id) {
        const res = await pool.query('SELECT * FROM "Users" WHERE id = $1', [id]);
        if (res.rows.length > 0) return new User(res.rows[0]);
        return null;
    }

    static async create(data) {
        console.log('User.create called with:', data.email);
        // Hash password before create
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        const now = new Date();

        try {
            const res = await pool.query(
                'INSERT INTO "Users" (name, email, password, role, headline, location, "companyName", "createdAt", "updatedAt", "googleId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
                [data.name, data.email, hashedPassword, data.role || 'Seeker', data.headline, data.location, data.companyName, now, now, data.googleId || null]
            );
            console.log('User created in DB:', res.rows[0]);
            return new User(res.rows[0]);
        } catch (err) {
            console.error('Error in User.create:', err);
            throw err;
        }
    }

    async update(data) {
        const fields = [];
        const values = [];
        let i = 1;

        if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
        if (data.headline !== undefined) { fields.push(`headline = $${i++}`); values.push(data.headline); }
        if (data.location !== undefined) { fields.push(`location = $${i++}`); values.push(data.location); }
        if (data.resume !== undefined) { fields.push(`resume = $${i++}`); values.push(data.resume); }
        if (data.about !== undefined) { fields.push(`about = $${i++}`); values.push(data.about); }
        if (data.skills !== undefined) { fields.push(`skills = $${i++}`); values.push(data.skills); }
        if (data.education !== undefined) { fields.push(`education = $${i++}`); values.push(data.education); }
        if (data.role !== undefined) { fields.push(`role = $${i++}`); values.push(data.role); }
        if (data.companyName !== undefined) { fields.push(`"companyName" = $${i++}`); values.push(data.companyName); }
        if (data.avatar !== undefined) { fields.push(`avatar = $${i++}`); values.push(data.avatar); }

        fields.push(`"updatedAt" = $${i++}`);
        values.push(new Date());

        if (fields.length === 1) return this; // only updatedAt

        values.push(this.id);
        const query = `UPDATE "Users" SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;

        try {
            const res = await pool.query(query, values);
            if (res.rows.length > 0) {
                // Update local instance
                const updated = res.rows[0];
                this.name = updated.name;
                this.headline = updated.headline;
                this.location = updated.location;
                this.resume = updated.resume;
                this.about = updated.about;
                this.skills = updated.skills;
                this.education = updated.education;
                this.role = updated.role;
                this.companyName = updated.companyName;
                this.avatar = updated.avatar || null;
                this.updatedAt = updated.updatedAt;
                return this;
            }
        } catch (err) {
            console.error('Error in User.update:', err);
            throw err;
        }
        return null;
    }

    async matchPassword(enteredPassword) {
        console.log('Matching password...');
        const isMatch = await bcrypt.compare(enteredPassword, this.password);
        console.log(`Password match result: ${isMatch}`);
        return isMatch;
    }
}

module.exports = User;
