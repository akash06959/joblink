const { pool } = require('./db');

pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Users' ORDER BY ordinal_position`)
    .then(r => {
        r.rows.forEach(c => console.log(c.column_name));
        process.exit(0);
    })
    .catch(e => {
        console.error(e.message);
        process.exit(1);
    });
