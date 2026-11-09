const { pool } = require('./db');

async function insertMockJobs() {
    try {
        // First, get a recruiter ID
        const recruiterResult = await pool.query('SELECT id FROM "Users" WHERE role = $1 LIMIT 1', ['Recruiter']);

        if (recruiterResult.rows.length === 0) {
            console.error('No recruiter found in database. Please create a recruiter account first.');
            process.exit(1);
        }

        const recruiterId = recruiterResult.rows[0].id;
        console.log(`Using recruiter ID: ${recruiterId}`);

        const mockJobs = [
            {
                title: 'Full Stack Developer',
                description: 'We are looking for a talented Full Stack Developer to join our team. You will be responsible for developing and maintaining web applications using modern frameworks like React.js and Node.js. The ideal candidate should have experience with PostgreSQL, RESTful APIs, and deployment on cloud platforms like Vercel or AWS.',
                company: 'TechCorp Solutions',
                location: 'Bangalore, Karnataka',
                requirements: 'React.js, Node.js, PostgreSQL, JavaScript, REST APIs, Git',
                salary: '800000',
                type: 'Full-time'
            },
            {
                title: 'Senior Full Stack Engineer',
                description: 'Join our team as a Senior Full Stack Engineer! You will lead the development of scalable web applications using Next.js, TypeScript, Python (Django/FastAPI), and PostgreSQL. We need someone with strong problem-solving skills and experience in e-commerce or educational platforms.',
                company: 'EduTech Innovations',
                location: 'Kochi, Kerala',
                requirements: 'Next.js, TypeScript, Python, Django, FastAPI, PostgreSQL, Cloud Deployment',
                salary: '1200000',
                type: 'Full-time'
            },
            {
                title: 'Backend Developer - Python',
                description: 'We are seeking a Backend Developer with expertise in Python frameworks (Django, FastAPI). You will build robust APIs, integrate with databases, and deploy applications on cloud platforms. Experience with ML integration is a plus.',
                company: 'DataDrive Inc',
                location: 'Hyderabad, Telangana',
                requirements: 'Python, Django, FastAPI, SQL, PostgreSQL, REST APIs, Docker',
                salary: '700000',
                type: 'Full-time'
            },
            {
                title: 'Node.js Backend Engineer',
                description: 'Looking for a skilled Node.js Backend Engineer to develop server-side applications. You will work with Express.js, build APIs, manage databases, and ensure high performance and responsiveness.',
                company: 'CloudNine Technologies',
                location: 'Pune, Maharashtra',
                requirements: 'Node.js, Express.js, PostgreSQL, MongoDB, REST APIs, Microservices',
                salary: '900000',
                type: 'Full-time'
            },
            {
                title: 'React Developer',
                description: 'We need a React Developer to create beautiful, responsive user interfaces. Experience with React.js, Next.js, HTML, CSS, and modern UI libraries is required. Tailwind CSS knowledge is a plus.',
                company: 'DesignHub Studio',
                location: 'Mumbai, Maharashtra',
                requirements: 'React.js, Next.js, HTML, CSS, JavaScript, Tailwind CSS, UI/UX',
                salary: '650000',
                type: 'Full-time'
            },
            {
                title: 'Machine Learning Engineer',
                description: 'Join us as an ML Engineer! You will develop and deploy machine learning models, work with large datasets, and integrate AI solutions into production systems. Experience with Python, ML frameworks, and cloud deployment required.',
                company: 'AI Innovations Lab',
                location: 'Bangalore, Karnataka',
                requirements: 'Python, Machine Learning, TensorFlow, PyTorch, Data Science, ML Algorithms',
                salary: '1500000',
                type: 'Full-time'
            },
            {
                title: 'Data Analyst',
                description: 'We are looking for a Data Analyst to analyze data, create visualizations, and provide insights. Proficiency in SQL, Python, and data visualization tools is essential.',
                company: 'Analytics Pro',
                location: 'Chennai, Tamil Nadu',
                requirements: 'SQL, Python, Data Analysis, Excel, Tableau, Power BI',
                salary: '600000',
                type: 'Full-time'
            },
            {
                title: 'Software Engineer - Web Applications',
                description: 'Looking for a Software Engineer to develop web applications. You should be comfortable with both frontend and backend technologies and have experience with version control (Git) and agile development.',
                company: 'WebWorks Solutions',
                location: 'Thiruvananthapuram, Kerala',
                requirements: 'JavaScript, React, Node.js, Git, Agile, Problem Solving',
                salary: '750000',
                type: 'Full-time'
            },
            {
                title: 'DevOps Engineer',
                description: 'We need a DevOps Engineer to manage cloud infrastructure, automate deployments, and ensure system reliability. Experience with AWS, Docker, Kubernetes, and CI/CD pipelines required.',
                company: 'CloudScale Systems',
                location: 'Gurgaon, Haryana',
                requirements: 'AWS, Docker, Kubernetes, CI/CD, Linux, Python, Terraform',
                salary: '1100000',
                type: 'Full-time'
            },
            {
                title: 'Junior Web Developer - Internship',
                description: 'Great opportunity for fresh graduates! Learn web development with React.js, Node.js, and PostgreSQL. We provide mentorship and hands-on project experience.',
                company: 'StartupHub Technologies',
                location: 'Bangalore, Karnataka',
                requirements: 'HTML, CSS, JavaScript, React, Basic Programming, Eagerness to Learn',
                salary: '300000',
                type: 'Internship'
            }
        ];

        console.log(`Inserting ${mockJobs.length} mock jobs...`);

        for (const job of mockJobs) {
            const query = `
                INSERT INTO "Jobs" ("recruiterId", title, description, company, location, requirements, salary, type, status, "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Open', NOW(), NOW())
            `;

            try {
                // Convert comma-separated requirements to array for PostgreSQL TEXT[]
                const requirementsArray = job.requirements.split(', ').map(req => req.trim());

                await pool.query(query, [
                    recruiterId,
                    job.title,
                    job.description,
                    job.company,
                    job.location,
                    requirementsArray, // Pass as array
                    job.salary,
                    job.type
                ]);

                console.log(`✓ Added: ${job.title} at ${job.company}`);
            } catch (err) {
                console.error(`✗ Failed to add ${job.title}:`, err.message);
            }
        }

        console.log('\n✅ Successfully inserted all mock jobs!');

        // Verify
        const result = await pool.query('SELECT COUNT(*) FROM "Jobs" WHERE status = \'Open\'');
        console.log(`Total open jobs in database: ${result.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('Error inserting mock jobs:', error);
        process.exit(1);
    }
}

insertMockJobs();
