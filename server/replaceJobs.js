const { pool } = require('./db');

async function replaceJobs() {
    try {
        // Get a recruiter ID
        const recruiterResult = await pool.query('SELECT id FROM "Users" WHERE role = $1 LIMIT 1', ['Recruiter']);

        if (recruiterResult.rows.length === 0) {
            console.error('No recruiter found. Please create a recruiter account first.');
            process.exit(1);
        }

        const recruiterId = recruiterResult.rows[0].id;
        console.log(`Using recruiter ID: ${recruiterId}`);

        // Step 1: Delete all existing jobs (nullify applications first to avoid FK issues)
        console.log('\nDeleting existing jobs...');
        await pool.query('DELETE FROM "Applications"');
        await pool.query('DELETE FROM "Jobs"');
        console.log('✓ All old jobs deleted.');

        // Step 2: Define the 8 specific jobs to insert
        const jobs = [
            {
                title: 'Test job',
                description: 'Test job listing at IBM. Remote full-time position.',
                company: 'IBM',
                location: 'Remote',
                requirements: ['General Skills'],
                salary: '$1000k',
                type: 'Full-time',
                createdAt: new Date('2026-02-24')
            },
            {
                title: 'Data Analyst',
                description: 'Data Analyst role at IBM based in Kochi, Kerala. Full-time position involving data analysis and insights.',
                company: 'IBM',
                location: 'Kochi, Kerala',
                requirements: ['SQL', 'Python', 'Data Analysis', 'Excel', 'Tableau', 'Power BI'],
                salary: '$1000k',
                type: 'Full-time',
                createdAt: new Date('2026-02-23')
            },
            {
                title: 'Microsoft Learn Student Ambassadors',
                description: 'Join the Microsoft Learn Student Ambassadors program — a global community of passionate students who love learning and sharing their knowledge of Microsoft technologies.',
                company: 'Microsoft',
                location: 'Global',
                requirements: ['Communication', 'Leadership', 'Microsoft Technologies'],
                salary: null,
                type: 'Mentorship',
                createdAt: new Date('2026-02-18')
            },
            {
                title: 'Women Techmakers Mentorship',
                description: 'Google Women Techmakers Mentorship program — a 3-month online mentorship program supporting women in technology.',
                company: 'Google',
                location: 'Online',
                requirements: ['Technology Skills', 'Passion for Learning'],
                salary: '3 Months',
                type: 'Mentorship',
                createdAt: new Date('2026-02-18')
            },
            {
                title: 'Frontend Developer (Part-Time)',
                description: 'Zoho Corporation is looking for a part-time Frontend Developer to work remotely. Build user-facing features with modern web technologies.',
                company: 'Zoho Corporation',
                location: 'Remote',
                requirements: ['HTML', 'CSS', 'JavaScript', 'React', 'UI/UX'],
                salary: '₹15,000 – ₹25,000 per month',
                type: 'Part-time',
                createdAt: new Date('2026-02-18')
            },
            {
                title: 'Backend Developer',
                description: 'Wipro is hiring a Backend Developer in Hyderabad. Work on scalable server-side systems and APIs.',
                company: 'Wipro',
                location: 'Hyderabad, India',
                requirements: ['Node.js', 'Python', 'SQL', 'REST APIs', 'Microservices'],
                salary: '₹5 LPA – ₹9 LPA',
                type: 'Full-time',
                createdAt: new Date('2026-02-18')
            },
            {
                title: 'Software Engineer',
                description: 'TCS is hiring a Software Engineer in Kochi. Join a global team and work on enterprise-grade software solutions.',
                company: 'Tata Consultancy Services',
                location: 'Kochi, India',
                requirements: ['Java', 'Python', 'SQL', 'Problem Solving', 'Agile'],
                salary: '₹4 LPA – ₹8 LPA',
                type: 'Full-time',
                createdAt: new Date('2026-02-18')
            },
            {
                title: 'Full Stack Web Developer',
                description: 'Infosys is hiring a Full Stack Web Developer in Bangalore. Work on end-to-end web applications using modern frameworks.',
                company: 'Infosys',
                location: 'Bangalore, India',
                requirements: ['React.js', 'Node.js', 'PostgreSQL', 'JavaScript', 'REST APIs'],
                salary: '₹6 LPA – ₹10 LPA',
                type: 'Full-time',
                createdAt: new Date('2026-02-18')
            }
        ];

        // Step 3: Insert the 8 jobs
        console.log(`\nInserting ${jobs.length} jobs...\n`);

        for (const job of jobs) {
            const query = `
                INSERT INTO "Jobs" ("recruiterId", title, description, company, location, requirements, salary, type, status, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Open', $9, $9)
            `;

            await pool.query(query, [
                recruiterId,
                job.title,
                job.description,
                job.company,
                job.location,
                job.requirements,
                job.salary,
                job.type,
                job.createdAt
            ]);

            console.log(`✓ Inserted: ${job.title} @ ${job.company}`);
        }

        console.log('\n✅ Done! All 8 jobs inserted successfully.');

        const result = await pool.query('SELECT COUNT(*) FROM "Jobs"');
        console.log(`Total jobs in DB: ${result.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

replaceJobs();
