# EduInsight Engine

Engineering College Performance Analytics Platform

## Overview

EduInsight Engine is a comprehensive web platform designed to transform raw academic data into actionable insights for engineering college stakeholders. It provides dynamic, real-time analytics to reduce time-to-insight for student performance analysis by 70%, enable data-driven curriculum decisions, and offer immediate access to academic standing and progression trends.

## Features

### For Educators
- **Targeted Dashboards**: Reduce time-to-insight for student performance analysis
- **Section Management**: Quick access to assigned sections and student alerts
- **Performance Correlation**: Attendance and academic performance analytics

### For Administrators
- **College-wide KPIs**: Pass percentages, average CGPA, total students metrics
- **Branch Comparisons**: Interactive bar charts comparing CSE, ECE, ME, CE performance
- **Trend Analysis**: Semester-over-semester performance tracking

### For Students
- **Personal Analytics**: CGPA progression line charts and section ranking
- **Academic Standing**: Immediate access to performance indicators
- **Progression Trends**: Semester-wise performance breakdown

## Technical Architecture

### Frontend Stack
- **Framework**: React.js with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Charts**: Chart.js with react-chartjs-2
- **Hosting**: Vercel

### Backend Stack
- **Framework**: Node.js with Express.js & TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with role-based access
- **File Processing**: Multer for Excel data imports
- **Hosting**: Heroku or Railway

## Database Schema

### Users Table
```sql
id | email | password_hash | role ('admin', 'faculty', 'student') | created_at | updated_at
```

### Students Table
```sql
id | roll_number | name | branch | section | email | semester_1_sgpa | semester_2_sgpa | cgpa | created_at | updated_at
```

### Faculty Assignments Table
```sql
id | faculty_id | branch | section | academic_year
```

### Academic Sessions Table
```sql
id | student_id | semester | sgpa | credits_completed | academic_year | created_at
```

## Security & Access Control

### Authentication Flow
- JWT token with 24-hour expiration
- Role-based route protection
- Password hashing with bcrypt

### Access Matrix
- **Admin**: Full access to all features
- **Faculty**: Dashboard, analytics for assigned sections, student profiles (their students only)
- **Student**: Personal dashboard, profile, performance data only

## Installation & Setup

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14+ (or Docker, using the included `docker-compose.yml`)

### 1. Database
```bash
docker compose up -d db      # starts PostgreSQL on localhost:5432
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env         # then set JWT_SECRET
npx prisma migrate deploy    # creates the tables
npm run seed                 # optional: 96 demo students + demo logins
npm run dev                  # http://localhost:5000
```

Demo logins created by the seed script (password `Password@123`):

| Role | Email |
|---|---|
| Admin | admin@college.edu |
| Faculty (CSE A & B) | faculty@college.edu |
| Student | student@college.edu |

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env         # REACT_APP_API_URL=http://localhost:5000/api
npm start                    # http://localhost:3000
```

## Data Import

Admins upload `.xlsx`, `.xls` or `.csv` files on the **Import** page (or `POST /api/import/students`).
Columns: `roll_number`, `name`, `branch`, `section`, `email` (required), `semester_1_sgpa`, `semester_2_sgpa`, `cgpa` (optional; CGPA is computed from SGPAs when missing).
Headers are matched case-insensitively ("Roll Number" works). Each row is validated, and the response lists every bad row with its reason.
Use *Validate only* to check a file without writing anything. A ready-made template is available from `GET /api/import/template`.

## Analytics Calculations

- **Pass percentage**: students with CGPA ≥ 5.0 ÷ students with a CGPA × 100
- **At risk**: CGPA below 6.0
- **Distribution buckets**: < 5, 5–6, 6–7, 7–8, 8–9, 9–10
- **Standing**: Distinction ≥ 8.0, First class ≥ 6.5, Pass ≥ 5.0, otherwise At risk
- **Trends**: average SGPA per semester (overall and per branch) from academic session records
- **Ranking**: position by CGPA within section and within branch

## Access Control

| Role | Can see |
|---|---|
| Admin | Every student; can manage users, students, faculty assignments and imports |
| Faculty | Only students in sections assigned to them |
| Student | Only their own record (linked by email) |

## API Endpoints

All endpoints except login require `Authorization: Bearer <token>`.

### Auth
- `POST /api/auth/login` · `POST /api/auth/register` (admin) · `GET /api/auth/me`

### Users (admin)
- `GET /api/users?role=` · `GET/PUT/DELETE /api/users/:id`

### Students
- `GET /api/students?search=&branch=&section=&minCgpa=&maxCgpa=&sort=&order=&page=&limit=`
- `GET /api/students/me` (student) · `GET /api/students/:id`
- `POST /api/students` · `PUT /api/students/:id` · `DELETE /api/students/:id` (admin)
- `POST /api/students/:id/sessions` – add/update a semester record (admin, faculty)

### Faculty
- `GET /api/faculty/my-sections` (faculty)
- `GET/POST /api/faculty/assignments` · `DELETE /api/faculty/assignments/:id` (admin)

### Analytics
- `GET /api/analytics/overview` – KPIs, distribution, top performers, at-risk students
- `GET /api/analytics/branches` · `GET /api/analytics/sections?branch=`
- `GET /api/analytics/compare?branches=CSE,ECE`
- `GET /api/analytics/trends`
- `GET /api/analytics/rankings?branch=&section=&limit=`
- `GET /api/analytics/me` (student) · `GET /api/analytics/student/:id`
- `GET /api/analytics/export` – CSV download

### Import (admin)
- `POST /api/import/students?dryRun=true|false` · `GET /api/import/template`

## Development Phases

### Phase 1: Foundation (Current)
- ✅ PostgreSQL database setup with schema
- ✅ Express.js backend with basic CRUD operations
- ✅ React frontend with routing structure
- ✅ Basic authentication system

### Phase 2: Data Pipeline
- Excel parser for student data
- Database seeding script
- Data validation middleware
- Bulk import interface

### Phase 3: Core Features
- Role-based dashboards
- Student profile pages
- Basic analytics calculations
- Chart integrations

### Phase 4: Advanced Analytics
- Comparative analysis tools
- Performance trend visualizations
- Export functionality (PDF, CSV)

### Phase 5: Polish & Deployment
- Responsive design testing
- Security audit
- Performance optimization
- Production deployment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@eduinsight.com or join our Slack channel.

## Roadmap

- [ ] Mobile application development
- [ ] Integration with learning management systems
- [ ] Advanced predictive analytics using machine learning
- [ ] Real-time notifications and alerts
- [ ] Multi-language support
