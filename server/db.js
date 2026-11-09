require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      const client = await pool.connect();
      console.log('PostgreSQL Connected via pg');
      client.release(); // release the client immediately after check

      await initTables();
      console.log('Database Tables Initialized');
      return;
    } catch (error) {
      console.error(`Database connection error: ${error.message}`);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      if (retries === 0) {
        console.error('Could not connect to database after multiple attempts. Exiting.');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
};

const initTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS "Users" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Seeker',
        headline VARCHAR(255),
        location VARCHAR(255),
        "companyName" VARCHAR(255),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Jobs" (
        id SERIAL PRIMARY KEY,
        "recruiterId" INTEGER REFERENCES "Users"(id),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        requirements TEXT[],
        responsibilities TEXT[] DEFAULT '{}',
        salary VARCHAR(100),
        "workMode" VARCHAR(50) DEFAULT 'On-site',
        "experienceLevel" VARCHAR(50),
        industry VARCHAR(100),
        "applicationDeadline" DATE,
        benefits TEXT[] DEFAULT '{}',
        type VARCHAR(50) DEFAULT 'Full-time',
        status VARCHAR(50) DEFAULT 'Active',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Applications" (
        id SERIAL PRIMARY KEY,
        "jobId" INTEGER REFERENCES "Jobs"(id),
        "applicantId" INTEGER REFERENCES "Users"(id),
        "resumePath" VARCHAR NOT NULL,
        "resumeText" TEXT,
        status VARCHAR(50) DEFAULT 'Applied',
        "aiScore" INTEGER DEFAULT 0,
        "aiFeedback" TEXT DEFAULT '',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("jobId", "applicantId")
    );

    CREATE TABLE IF NOT EXISTS "Notifications" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES "Users"(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        "relatedLink" VARCHAR(255),
        read BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    /* Safe migration for existing tables */
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Notifications' AND column_name = 'relatedLink') THEN 
            ALTER TABLE "Notifications" ADD COLUMN "relatedLink" VARCHAR(255); 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Jobs' AND column_name = 'responsibilities') THEN 
            ALTER TABLE "Jobs" ADD COLUMN responsibilities TEXT[] DEFAULT '{}'; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Jobs' AND column_name = 'workMode') THEN 
            ALTER TABLE "Jobs" ADD COLUMN "workMode" VARCHAR(50) DEFAULT 'On-site'; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Jobs' AND column_name = 'experienceLevel') THEN 
            ALTER TABLE "Jobs" ADD COLUMN "experienceLevel" VARCHAR(50); 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Jobs' AND column_name = 'industry') THEN 
            ALTER TABLE "Jobs" ADD COLUMN industry VARCHAR(100); 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Jobs' AND column_name = 'applicationDeadline') THEN 
            ALTER TABLE "Jobs" ADD COLUMN "applicationDeadline" DATE; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Jobs' AND column_name = 'benefits') THEN 
            ALTER TABLE "Jobs" ADD COLUMN benefits TEXT[] DEFAULT '{}'; 
        END IF;
    END $$;
    `;
  await pool.query(query);
};

module.exports = { pool, connectDB };
