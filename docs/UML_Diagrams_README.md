# JobLink - UML Class Diagrams

This directory contains PlantUML class diagrams for the JobLink Intelligent Recruitment Platform.

---

## 📁 Files Overview

### 1. **Enhanced_Class_Diagram.puml** ⭐ RECOMMENDED
**Purpose:** Complete, detailed class diagram with all features  
**Use For:** 
- Project documentation
- Academic submissions
- Code reviews
- System architecture presentations

**Includes:**
- ✅ All attributes with data types
- ✅ All methods (CRUD + business logic)
- ✅ AI Service layer (Gemini integration)
- ✅ Controller layer (MVC pattern)
- ✅ Middleware (Auth, File Upload)
- ✅ Database service
- ✅ ATS Kanban system
- ✅ Complete relationships and dependencies
- ✅ Design pattern annotations
- ✅ Detailed notes and constraints

---

### 2. **Simplified_Class_Diagram.puml**
**Purpose:** Clean, minimal diagram for quick reference  
**Use For:**
- Quick presentations
- High-level overview
- Stakeholder meetings
- README documentation

**Includes:**
- Core entities only
- Essential attributes
- Key methods
- Primary relationships

---

### 3. **Class_Diagram_Documentation.md**
**Purpose:** Comprehensive explanation of the class diagram  
**Contains:**
- Architecture overview
- Data flow examples
- Design patterns used
- Security features
- Database schema mapping
- AI integration details
- Future enhancements

---

## 🎨 How to Render the Diagrams

### Option 1: Online (Easiest)
1. Visit [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/)
2. Copy content from `.puml` file
3. Paste into the editor
4. View rendered diagram
5. Download as PNG/SVG

### Option 2: VS Code (Recommended for Development)
1. Install extension: **PlantUML** by jebbs
2. Open any `.puml` file
3. Press `Alt+D` to preview
4. Right-click → Export to PNG/SVG

**Extension Settings:**
```json
{
  "plantuml.render": "PlantUMLServer",
  "plantuml.server": "https://www.plantuml.com/plantuml"
}
```

### Option 3: Command Line
```bash
# Install PlantUML
npm install -g node-plantuml

# Generate PNG
puml generate Enhanced_Class_Diagram.puml -o Enhanced_Diagram.png

# Generate SVG (better quality)
puml generate Enhanced_Class_Diagram.puml -o Enhanced_Diagram.svg
```

### Option 4: Java (Official Method)
```bash
# Download plantuml.jar from https://plantuml.com/download

# Generate diagram
java -jar plantuml.jar Enhanced_Class_Diagram.puml

# This creates Enhanced_Class_Diagram.png
```

---

## 📊 Diagram Components Explained

### Classes in the Enhanced Diagram

#### **Core Entities** (Yellow/Default)
- `User` (Abstract)
- `JobSeeker`
- `Recruiter`
- `Job`
- `Application`

#### **Service Layer** (Light Blue)
- `AIService`
- `DatabaseService`

#### **Controller Layer** (Light Green)
- `AuthController`
- `JobController`
- `ApplicationController`

#### **Middleware**
- `AuthMiddleware`
- `FileUploadMiddleware`

#### **ATS System**
- `ATSKanban`
- `KanbanColumn`

#### **Data Transfer Objects**
- `AIAnalysis`

---

## 🔗 Relationship Types

### Inheritance (Solid line with hollow triangle)
```
User <|-- JobSeeker
User <|-- Recruiter
```
- JobSeeker **is a** User
- Recruiter **is a** User

### Association (Solid line with arrow)
```
Recruiter "1" --> "*" Job
```
- One Recruiter posts many Jobs
- Bidirectional navigation

### Dependency (Dashed line with arrow)
```
Application ..> AIService
```
- Application **uses** AIService
- Temporary relationship

### Composition (Solid line with filled diamond)
```
ATSKanban *-- KanbanColumn
```
- ATSKanban **contains** KanbanColumn
- Strong ownership (lifecycle dependency)

---

## 🎯 Key Features Highlighted

### 1. AI-Powered Resume Analysis
```
JobSeeker uploads resume
    ↓
AIService.extractTextFromPDF()
    ↓
AIService.analyzeResume(resumeText, jobDescription)
    ↓
Returns: { matchScore: 85, feedback: "..." }
    ↓
Stored in Application.aiScore & Application.aiFeedback
```

### 2. ATS Kanban Board
```
ATSKanban
├── Applied Column
├── Screening Column
├── Interview Column
├── Hired Column
└── Rejected Column
```

### 3. Role-Based Access Control
```
AuthMiddleware.protect()
    ↓
Verify JWT Token
    ↓
AuthMiddleware.authorize('Recruiter')
    ↓
Check user.role === 'Recruiter'
    ↓
Allow/Deny access
```

### 4. Smart Job Filtering
```
Upload Resume → Extract Skills → Match Jobs → Rank by Relevance
```

---

## 📝 PlantUML Syntax Quick Reference

### Class Definition
```plantuml
class ClassName {
    - privateAttribute: Type
    + publicAttribute: Type
    __
    + publicMethod(): ReturnType
    - privateMethod(): ReturnType
}
```

### Visibility Modifiers
- `+` Public
- `-` Private
- `#` Protected
- `~` Package/Default

### Stereotypes
```plantuml
class ServiceClass <<Service>> {
}
```

### Notes
```plantuml
note right of ClassName
  This is a note explaining
  the class purpose
end note
```

### Relationships
```plantuml
ClassA <|-- ClassB    ' Inheritance
ClassA *-- ClassB     ' Composition
ClassA o-- ClassB     ' Aggregation
ClassA --> ClassB     ' Association
ClassA ..> ClassB     ' Dependency
```

---

## 🎓 For Academic Submissions

### What to Include in Your Report

1. **Simplified Diagram** - For introduction/overview section
2. **Enhanced Diagram** - For detailed design section
3. **Documentation** - Explain design decisions

### Suggested Report Structure

```
1. Introduction
   └── Include: Simplified_Class_Diagram.puml

2. System Architecture
   └── Include: Enhanced_Class_Diagram.puml

3. Design Patterns
   └── Reference: Class_Diagram_Documentation.md
   
4. AI Integration
   └── Explain AIService and AIAnalysis classes

5. Database Design
   └── Show mapping between classes and tables

6. Security Features
   └── Explain AuthMiddleware and password hashing
```

---

## 🔄 Updating the Diagrams

### When to Update

Update diagrams when you:
- Add new entities (tables)
- Add new methods to controllers
- Introduce new services
- Change relationships
- Add new features

### How to Update

1. Open `.puml` file in text editor
2. Add/modify class definitions
3. Update relationships
4. Re-render to verify
5. Update documentation if needed

### Example: Adding a Message Class

```plantuml
class Message {
    - id: Integer {PK}
    - senderId: Integer {FK}
    - receiverId: Integer {FK}
    - content: Text
    - isRead: Boolean
    - createdAt: Timestamp
    __
    + send(): Boolean
    + markAsRead(): Boolean
}

' Add relationships
JobSeeker "1" --> "*" Message : sends
Recruiter "1" --> "*" Message : receives
```

---

## 🎨 Customization Options

### Color Schemes

```plantuml
skinparam class {
    BackgroundColor LightBlue
    BorderColor Blue
    ArrowColor Black
    FontSize 12
}
```

### Layout Direction

```plantuml
left to right direction
' or
top to bottom direction
```

### Hide/Show Elements

```plantuml
hide empty members
hide circle
show methods
```

---

## 📤 Export Formats

### Supported Formats
- PNG (Raster image)
- SVG (Vector image - best for scaling)
- PDF (For reports)
- EPS (For LaTeX documents)
- ASCII Art (For text-only environments)

### Quality Recommendations

**For Presentations:**
- Use SVG or high-DPI PNG
- Minimum 300 DPI

**For Documentation:**
- Use SVG (scales perfectly)
- Embed in Markdown/HTML

**For Print:**
- Use PDF or high-resolution PNG
- 600 DPI recommended

---

## 🐛 Troubleshooting

### Diagram Not Rendering?

**Check for:**
1. Syntax errors (missing `@enduml`)
2. Unclosed quotes
3. Invalid relationship syntax
4. Typos in class names

### PlantUML Server Timeout?

**Solutions:**
1. Use local rendering (Java method)
2. Split large diagrams
3. Simplify complex relationships

### Arrows Not Connecting?

**Ensure:**
1. Class names match exactly (case-sensitive)
2. Relationship syntax is correct
3. No typos in class references

---

## 📚 Additional Resources

### Official Documentation
- [PlantUML Class Diagram Guide](https://plantuml.com/class-diagram)
- [PlantUML Language Reference](https://plantuml.com/guide)

### Tools
- [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/)
- [PlantUML VS Code Extension](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml)
- [PlantUML IntelliJ Plugin](https://plugins.jetbrains.com/plugin/7017-plantuml-integration)

### Examples
- [Real-World PlantUML Examples](https://real-world-plantuml.com/)
- [PlantUML Cheat Sheet](https://ogom.github.io/draw_uml/plantuml/)

---

## ✅ Checklist for Review Submission

Before submitting your class diagrams:

- [ ] All classes have proper attributes with data types
- [ ] All methods are documented
- [ ] Relationships are correctly defined
- [ ] Foreign keys are marked
- [ ] Constraints are noted (Unique, PK, FK)
- [ ] Stereotypes are used for clarity (<<Service>>, <<Controller>>)
- [ ] Notes explain complex concepts
- [ ] Diagram renders without errors
- [ ] High-quality export (PNG/SVG)
- [ ] Documentation is complete

---

## 📞 Support

If you need help with the diagrams:

1. Check the documentation in `Class_Diagram_Documentation.md`
2. Review PlantUML syntax guide
3. Verify your `.puml` file syntax
4. Test rendering online first

---

## 📄 License

These diagrams are part of the JobLink project and follow the same license.

---

**Last Updated:** January 12, 2026  
**Project:** JobLink - Intelligent Recruitment Platform  
**Version:** 1.0
