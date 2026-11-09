const { pool } = require('../db');

class Job {
    constructor(row) {
        if (row) {
            this.id = row.id;
            this.recruiterId = row.recruiterId;
            this.title = row.title;
            this.description = row.description;
            this.company = row.company;
            this.location = row.location;
            this.requirements = row.requirements;
            this.responsibilities = row.responsibilities;
            this.salary = row.salary;
            this.workMode = row.workMode;
            this.experienceLevel = row.experienceLevel;
            this.industry = row.industry;
            this.applicationDeadline = row.applicationDeadline;
            this.benefits = row.benefits;
            this.type = row.type;
            this.status = row.status;
            this.createdAt = row.createdAt;
            this.updatedAt = row.updatedAt;
        }
    }

    static async create(data) {
        const now = new Date();
        const res = await pool.query(
            'INSERT INTO "Jobs" ("recruiterId", title, description, company, location, requirements, responsibilities, salary, "workMode", "experienceLevel", industry, "applicationDeadline", benefits, type, status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *',
            [data.recruiterId, data.title, data.description, data.company, data.location, data.requirements, data.responsibilities || [], data.salary, data.workMode || 'On-site', data.experienceLevel || null, data.industry || null, data.applicationDeadline || null, data.benefits || [], data.type || 'Full-time', 'Active', now, now]
        );
        return new Job(res.rows[0]);
    }

    static async findAll({ where, order }) {
        let query = 'SELECT * FROM "Jobs"';
        const values = [];
        const conditions = [];

        if (where) {
            if (where.recruiterId) {
                values.push(where.recruiterId);
                conditions.push(`"recruiterId" = $${values.length}`);
            }
            // Add other fields if needed
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        if (order) {
            // Primitive order handling: [['createdAt', 'DESC']]
            const [field, dir] = order[0];
            query += ` ORDER BY "${field}" ${dir}`;
        }

        const res = await pool.query(query, values);
        return res.rows.map(row => new Job(row));
    }

    static async findByPk(id) {
        const res = await pool.query('SELECT * FROM "Jobs" WHERE id = $1', [id]);
        if (res.rows.length > 0) return new Job(res.rows[0]);
        return null;
    }

    async update(data) {
        const fields = [];
        const values = [];
        let i = 1;

        if (data.title !== undefined) { fields.push(`title = $${i++}`); values.push(data.title); }
        if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
        if (data.company !== undefined) { fields.push(`company = $${i++}`); values.push(data.company); }
        if (data.location !== undefined) { fields.push(`location = $${i++}`); values.push(data.location); }
        if (data.requirements !== undefined) { fields.push(`requirements = $${i++}`); values.push(data.requirements); }
        if (data.responsibilities !== undefined) { fields.push(`responsibilities = $${i++}`); values.push(data.responsibilities); }
        if (data.salary !== undefined) { fields.push(`salary = $${i++}`); values.push(data.salary); }
        if (data.workMode !== undefined) { fields.push(`"workMode" = $${i++}`); values.push(data.workMode); }
        if (data.experienceLevel !== undefined) { fields.push(`"experienceLevel" = $${i++}`); values.push(data.experienceLevel); }
        if (data.industry !== undefined) { fields.push(`industry = $${i++}`); values.push(data.industry); }
        if (data.applicationDeadline !== undefined) { fields.push(`"applicationDeadline" = $${i++}`); values.push(data.applicationDeadline); }
        if (data.benefits !== undefined) { fields.push(`benefits = $${i++}`); values.push(data.benefits); }
        if (data.type !== undefined) { fields.push(`type = $${i++}`); values.push(data.type); }
        if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }

        fields.push(`"updatedAt" = $${i++}`);
        values.push(new Date());

        if (fields.length === 1) return this;

        values.push(this.id);
        const query = `UPDATE "Jobs" SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;

        const res = await pool.query(query, values);
        if (res.rows.length > 0) {
            Object.assign(this, res.rows[0]); // Update local instance
            return this;
        }
        return null;
    }

    static async delete(id) {
        await pool.query('DELETE FROM "Jobs" WHERE id = $1', [id]);
        return true;
    }
}

module.exports = Job;
