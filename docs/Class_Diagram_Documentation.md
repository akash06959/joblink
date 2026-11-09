# JobLink - Enhanced Class Diagram Documentation

## Overview
This document explains the enhanced class diagram for the JobLink Intelligent Recruitment Platform.

---

## Key Enhancements from Original Diagram

### 1. **Detailed Attributes**
- All database fields included with data types
- Primary Keys (PK) and Foreign Keys (FK) marked
- Constraints noted (Unique, Hashed, etc.)
- Timestamps for audit trails

### 2. **Complete Methods**
- CRUD operations for all entities
- Business logic methods
- Authentication and authorization methods
- AI-powered analysis methods

### 3. **AI Service Layer** ⭐ NEW
```
AIService
├── extractTextFromPDF()
├── analyzeResume()
├── extractSkills()
└── generateMatchScore()
```

**Features:**
- Powered by Google Gemini AI
- Automatic resume analysis on application submission
- Match score generation (0-100)
- Skill extraction from resume text
- Feedback generation

### 4. **Controller Layer** ⭐ NEW
Separation of concerns with dedicated controllers:

**AuthController:**
- User registration
- User login
- JWT token generation
- Profile retrieval

**JobController:**
- Job CRUD operations
- Smart job filtering with AI
- Recruiter statistics
- Public job listings

**ApplicationController:**
- Application submission with resume upload
- Application tracking
- Status updates
- Duplicate prevention

### 5. **Middleware Layer** ⭐ NEW

**AuthMiddleware:**
- JWT token verification
- Route protection
- Role-based authorization (Seeker/Recruiter)

**FileUploadMiddleware:**
- Resume file upload handling
- PDF validation
- File size limits (5MB)
- Secure file storage

### 6. **ATS (Applicant Tracking System)** ⭐ NEW

**ATSKanban:**
- Visual pipeline management
- Drag-and-drop status updates
- Real-time synchronization

**Kanban Columns:**
1. Applied
2. Screening
3. Interview
4. Hired
5. Rejected

### 7. **Database Service** ⭐ NEW
- PostgreSQL connection pooling
- SSL-enabled connections
- Automatic table initialization
- Query execution with parameterization

---

## Class Hierarchy

```
User (Abstract)
├── JobSeeker
│   ├── Manages Applications
│   ├── Uploads Resumes
│   └── Tracks Status
│
└── Recruiter
    ├── Posts Jobs
    ├── Reviews Applications
    └── Manages ATS Kanban
```

---

## Relationships Summary

### 1. **Inheritance**
- `JobSeeker` extends `User`
- `Recruiter` extends `User`

### 2. **One-to-Many Associations**
- `Recruiter (1) → Jobs (Many)`
- `Job (1) → Applications (Many)`
- `JobSeeker (1) → Applications (Many)`

### 3. **Dependencies (Uses)**
- Controllers use Models
- Controllers use Middleware
- Application uses AIService
- Models use DatabaseService

### 4. **Composition**
- `ATSKanban` contains `KanbanColumn`

---

## Key Design Patterns

### 1. **MVC Pattern**
```
Controller → Model → Database
    ↓
Response
```

### 2. **Service Layer Pattern**
```
Controller → Service → External API (Gemini AI)
```

### 3. **Middleware Pattern**
```
Request → Auth Middleware → Controller → Response
```

### 4. **Repository Pattern**
```
Model → DatabaseService → PostgreSQL
```

---

## Data Flow Examples

### Example 1: Job Application Submission

```
1. JobSeeker uploads resume (PDF)
   ↓
2. FileUploadMiddleware validates file
   ↓
3. ApplicationController receives request
   ↓
4. AIService.extractTextFromPDF()
   ↓
5. Job.findByPk() to get job description
   ↓
6. AIService.analyzeResume(resumeText, jobDescription)
   ↓
7. Application.create() with AI score & feedback
   ↓
8. Response sent to JobSeeker
```

### Example 2: Recruiter Views Applications

```
1. Recruiter navigates to ATS Kanban
   ↓
2. AuthMiddleware verifies JWT token
   ↓
3. JobController.getJobApplications()
   ↓
4. ATSKanban.getApplicationsByStatus()
   ↓
5. Applications grouped by status
   ↓
6. Sorted by AI score (highest first)
   ↓
7. Rendered in Kanban columns
```

### Example 3: Smart Job Filtering

```
1. JobSeeker uploads resume
   ↓
2. AIService.extractTextFromPDF()
   ↓
3. AIService.extractSkills() → ["React", "Node.js", "TypeScript"]
   ↓
4. JobController.smartFilterJobs()
   ↓
5. Database query with skill matching
   ↓
6. Jobs ranked by relevance
   ↓
7. Response with matched jobs
```

---

## Database Schema Mapping

### User Table → User Class
```sql
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,           → id: Integer {PK}
    name VARCHAR(255),                → name: String
    email VARCHAR(255) UNIQUE,        → email: String {Unique}
    password VARCHAR(255),            → password: String {Hashed}
    role VARCHAR(50),                 → role: String
    headline VARCHAR(255),            → headline: String
    location VARCHAR(255),            → location: String
    createdAt TIMESTAMP,              → createdAt: Timestamp
    updatedAt TIMESTAMP               → updatedAt: Timestamp
);
```

### Job Table → Job Class
```sql
CREATE TABLE "Jobs" (
    id SERIAL PRIMARY KEY,           → id: Integer {PK}
    recruiterId INTEGER,             → recruiterId: Integer {FK}
    title VARCHAR(255),              → title: String
    description TEXT,                → description: Text
    company VARCHAR(255),            → company: String
    location VARCHAR(255),           → location: String
    requirements TEXT[],             → requirements: String[]
    salary VARCHAR(100),             → salary: String
    type VARCHAR(50),                → type: String
    status VARCHAR(50),              → status: String
    createdAt TIMESTAMP,             → createdAt: Timestamp
    updatedAt TIMESTAMP              → updatedAt: Timestamp
);
```

### Application Table → Application Class
```sql
CREATE TABLE "Applications" (
    id SERIAL PRIMARY KEY,           → id: Integer {PK}
    jobId INTEGER,                   → jobId: Integer {FK}
    applicantId INTEGER,             → applicantId: Integer {FK}
    resumePath VARCHAR,              → resumePath: String
    resumeText TEXT,                 → resumeText: Text
    status VARCHAR(50),              → status: String
    aiScore INTEGER,                 → aiScore: Integer {0-100}
    aiFeedback TEXT,                 → aiFeedback: Text
    createdAt TIMESTAMP,             → createdAt: Timestamp
    updatedAt TIMESTAMP,             → updatedAt: Timestamp
    UNIQUE(jobId, applicantId)       → Composite Unique Constraint
);
```

---

## AI Integration Details

### AIService Methods

#### 1. extractTextFromPDF(filePath: String): String
- Uses `pdf-parse` library
- Reads PDF file from disk
- Extracts raw text content
- Returns plain text string

#### 2. analyzeResume(resumeText: String, jobDescription: String): AIAnalysis
- Calls Google Gemini AI API
- Sends prompt with resume and job description
- Receives JSON response:
  ```json
  {
    "matchScore": 85,
    "feedback": "Strong match. Candidate has required skills..."
  }
  ```

#### 3. extractSkills(resumeText: String): String[]
- Calls Gemini AI to identify skills
- Returns array of technical skills
- Used for smart job filtering
- Example: `["React", "TypeScript", "Node.js", "PostgreSQL"]`

---

## Security Features

### 1. **Password Security**
- Bcrypt hashing with salt rounds (10)
- Passwords never stored in plain text
- `matchPassword()` method for verification

### 2. **JWT Authentication**
- Token-based authentication
- 30-day expiration
- Includes user ID and role
- Verified by AuthMiddleware

### 3. **Role-Based Access Control**
- `authorize(role)` middleware
- Recruiters can only access recruiter routes
- Seekers can only access seeker routes
- Prevents unauthorized actions

### 4. **File Upload Security**
- Only PDF files allowed
- 5MB file size limit
- Files stored in secure directory
- Path validation to prevent directory traversal

### 5. **SQL Injection Prevention**
- Parameterized queries
- PostgreSQL prepared statements
- Input validation

---

## Constraints & Business Rules

### 1. **User Constraints**
- Email must be unique
- Password minimum length enforced
- Role must be 'Seeker' or 'Recruiter'

### 2. **Job Constraints**
- Must have recruiterId (foreign key)
- Title, description, company, location required
- Status: Active, Closed, or Draft

### 3. **Application Constraints**
- Unique constraint on (jobId, applicantId)
- Prevents duplicate applications
- Resume file required (PDF only)
- AI analysis runs automatically

### 4. **ATS Workflow Rules**
- Status progression: Applied → Screening → Interview → Hired/Rejected
- Only recruiter who owns job can update status
- Status changes update `updatedAt` timestamp
- Real-time sync to seeker dashboard

---

## Performance Optimizations

### 1. **Database Indexes**
```sql
CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_jobs_recruiter ON "Jobs"(recruiterId);
CREATE INDEX idx_applications_job ON "Applications"(jobId);
CREATE INDEX idx_applications_applicant ON "Applications"(applicantId);
```

### 2. **Connection Pooling**
- PostgreSQL connection pool
- Reuses database connections
- Reduces connection overhead

### 3. **Lazy Loading**
- Applications loaded only when needed
- Jobs fetched with pagination (future enhancement)

### 4. **Caching Strategy** (Future)
- Cache frequently accessed jobs
- Cache user sessions
- Redis integration

---

## Future Enhancements

### 1. **Real-Time Chat**
```
Message
├── senderId: Integer {FK}
├── receiverId: Integer {FK}
├── applicationId: Integer {FK}
├── message: Text
└── isRead: Boolean
```

### 2. **Resume Repository**
```
Resume
├── userId: Integer {FK}
├── title: String
├── filePath: String
├── isPrimary: Boolean
└── createdAt: Timestamp
```

### 3. **Skill Matching**
```
Skill
├── id: Integer {PK}
└── name: String {Unique}

UserSkill
├── userId: Integer {FK}
├── skillId: Integer {FK}
└── proficiency: String
```

### 4. **Notifications**
```
Notification
├── userId: Integer {FK}
├── type: String
├── message: Text
├── isRead: Boolean
└── createdAt: Timestamp
```

### 5. **Analytics Dashboard**
- Application success rate
- Average time to hire
- Popular skills trending
- Recruiter performance metrics

---

## How to Use This Diagram

### 1. **Rendering the Diagram**

**Online:**
- Visit [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/)
- Paste the content from `Enhanced_Class_Diagram.puml`
- View the rendered diagram

**VS Code:**
- Install "PlantUML" extension
- Open `Enhanced_Class_Diagram.puml`
- Press `Alt+D` to preview

**Command Line:**
```bash
# Install PlantUML
npm install -g node-plantuml

# Generate PNG
puml generate Enhanced_Class_Diagram.puml -o diagram.png
```

### 2. **Understanding the Notation**

**Visibility:**
- `+` Public
- `-` Private
- `#` Protected
- `~` Package

**Relationships:**
- `<|--` Inheritance (extends)
- `-->` Association
- `..>` Dependency (uses)
- `*--` Composition (contains)

**Multiplicity:**
- `1` One
- `*` Many (zero or more)
- `0..*` Zero or more
- `1..*` One or more

**Stereotypes:**
- `<<Abstract>>` Abstract class
- `<<Service>>` Service layer
- `<<Controller>>` Controller layer

---

## Conclusion

This enhanced class diagram provides:

✅ **Complete Architecture** - All layers from database to controllers  
✅ **AI Integration** - Gemini AI service for resume analysis  
✅ **Security** - Authentication, authorization, and file validation  
✅ **ATS System** - Kanban board for application tracking  
✅ **Scalability** - Service layer pattern for future enhancements  
✅ **Best Practices** - MVC pattern, separation of concerns  

The diagram accurately reflects your JobLink codebase and can be used for:
- Project documentation
- Academic presentations
- Code reviews
- Onboarding new developers
- System design discussions

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Project:** JobLink - Intelligent Recruitment Platform
