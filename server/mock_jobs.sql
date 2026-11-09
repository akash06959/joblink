-- Mock Jobs for Testing Smart Job Matcher
-- Run this in your PostgreSQL database to add sample jobs
-- Make sure to replace recruiterId with an actual recruiter ID from your Users table
-- First, let's get a recruiter ID (you'll need to replace this with an actual ID)
-- SELECT id FROM "Users" WHERE role = 'Recruiter' LIMIT 1;
-- For testing, we'll use recruiterId = 1 (replace with actual ID)
INSERT INTO "Jobs" (
        "recruiterId",
        title,
        description,
        company,
        location,
        requirements,
        salary,
        type,
        status,
        "createdAt",
        "updatedAt"
    )
VALUES -- Full Stack Developer Jobs
    (
        11,
        'Full Stack Developer',
        'We are looking for a talented Full Stack Developer to join our team. You will be responsible for developing and maintaining web applications using modern frameworks like React.js and Node.js. The ideal candidate should have experience with PostgreSQL, RESTful APIs, and deployment on cloud platforms like Vercel or AWS.',
        'TechCorp Solutions',
        'Bangalore, Karnataka',
        'React.js, Node.js, PostgreSQL, JavaScript, REST APIs, Git',
        '800000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    (
        11,
        'Senior Full Stack Engineer',
        'Join our team as a Senior Full Stack Engineer! You will lead the development of scalable web applications using Next.js, TypeScript, Python (Django/FastAPI), and PostgreSQL. We need someone with strong problem-solving skills and experience in e-commerce or educational platforms.',
        'EduTech Innovations',
        'Kochi, Kerala',
        'Next.js, TypeScript, Python, Django, FastAPI, PostgreSQL, Cloud Deployment',
        '1200000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    -- Backend Developer Jobs
    (
        11,
        'Backend Developer - Python',
        'We are seeking a Backend Developer with expertise in Python frameworks (Django, FastAPI). You will build robust APIs, integrate with databases, and deploy applications on cloud platforms. Experience with ML integration is a plus.',
        'DataDrive Inc',
        'Hyderabad, Telangana',
        'Python, Django, FastAPI, SQL, PostgreSQL, REST APIs, Docker',
        '700000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    (
        11,
        'Node.js Backend Engineer',
        'Looking for a skilled Node.js Backend Engineer to develop server-side applications. You will work with Express.js, build APIs, manage databases, and ensure high performance and responsiveness.',
        'CloudNine Technologies',
        'Pune, Maharashtra',
        'Node.js, Express.js, PostgreSQL, MongoDB, REST APIs, Microservices',
        '900000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    -- Frontend Developer Jobs
    (
        11,
        'React Developer',
        'We need a React Developer to create beautiful, responsive user interfaces. Experience with React.js, Next.js, HTML, CSS, and modern UI libraries is required. Tailwind CSS knowledge is a plus.',
        'DesignHub Studio',
        'Mumbai, Maharashtra',
        'React.js, Next.js, HTML, CSS, JavaScript, Tailwind CSS, UI/UX',
        '650000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    -- ML/AI Jobs
    (
        11,
        'Machine Learning Engineer',
        'Join us as an ML Engineer! You will develop and deploy machine learning models, work with large datasets, and integrate AI solutions into production systems. Experience with Python, ML frameworks, and cloud deployment required.',
        'AI Innovations Lab',
        'Bangalore, Karnataka',
        'Python, Machine Learning, TensorFlow, PyTorch, Data Science, ML Algorithms',
        '1500000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    -- Data Analyst Jobs  
    (
        11,
        'Data Analyst',
        'We are looking for a Data Analyst to analyze data, create visualizations, and provide insights. Proficiency in SQL, Python, and data visualization tools is essential.',
        'Analytics Pro',
        'Chennai, Tamil Nadu',
        'SQL, Python, Data Analysis, Excel, Tableau, Power BI',
        '600000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    -- Software Engineer Jobs
    (
        11,
        'Software Engineer - Web Applications',
        'Looking for a Software Engineer to develop web applications. You should be comfortable with both frontend and backend technologies and have experience with version control (Git) and agile development.',
        'WebWorks Solutions',
        'Thiruvananthapuram, Kerala',
        'JavaScript, React, Node.js, Git, Agile, Problem Solving',
        '750000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    -- DevOps Jobs
    (
        11,
        'DevOps Engineer',
        'We need a DevOps Engineer to manage cloud infrastructure, automate deployments, and ensure system reliability. Experience with AWS, Docker, Kubernetes, and CI/CD pipelines required.',
        'CloudScale Systems',
        'Gurgaon, Haryana',
        'AWS, Docker, Kubernetes, CI/CD, Linux, Python, Terraform',
        '1100000',
        'Full-time',
        'Open',
        NOW(),
        NOW()
    ),
    -- Internship/Entry Level
    (
        11,
        'Junior Web Developer - Internship',
        'Great opportunity for fresh graduates! Learn web development with React.js, Node.js, and PostgreSQL. We provide mentorship and hands-on project experience.',
        'StartupHub Technologies',
        'Bangalore, Karnataka',
        'HTML, CSS, JavaScript, React, Basic Programming, Eagerness to Learn',
        '300000',
        'Internship',
        'Open',
        NOW(),
        NOW()
    );
-- Verify insertion
SELECT id,
    title,
    company,
    location,
    salary,
    type
FROM "Jobs"
WHERE "createdAt" > NOW() - INTERVAL '1 minute'
ORDER BY id;