const { pool } = require('./db');

// Poll the Applications table every 2 seconds for 30 seconds
// So we can see in real-time when a new application comes in
let count = 0;
const interval = setInterval(async () => {
    count++;
    try {
        const result = await pool.query('SELECT id, "applicantId", "jobId", status, "createdAt" FROM "Applications" ORDER BY "createdAt" DESC LIMIT 5');
        const ts = new Date().toISOString().substring(11, 19);
        if (result.rows.length > 0) {
            console.log(`[${ts}] Found ${result.rows.length} application(s):`);
            result.rows.forEach(r => console.log(`  ID=${r.id} applicant=${r.applicantId} job=${r.jobId} status=${r.status}`));
        } else {
            console.log(`[${ts}] No applications yet (check #${count})`);
        }
    } catch (e) {
        console.error('DB error:', e.message);
    }
    if (count >= 15) {
        console.log('\nDone polling.');
        process.exit(0);
    }
}, 2000);
