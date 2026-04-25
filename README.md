# CleanStreet  
### AI-assisted Civic Complaint & Volunteer Management Platform

[![Frontend](https://img.shields.io/badge/Main%20Frontend-Live-brightgreen)](https://cleanstreet-frontend.vercel.app)
[![Admin Portal](https://img.shields.io/badge/Admin%20Portal-Live-blue)](https://clean-streetproject.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-Render-purple)](https://cleanstreetproject.onrender.com/api/health)
[![License](https://img.shields.io/badge/License-MIT-black)](#license)

CleanStreet is a full-stack web platform where citizens can report street issues and local teams can manage them through an admin + volunteer workflow.  
It includes role-based authentication, complaint lifecycle management, assignment to volunteers, dashboards, and production deployment.

---

## Live Demo

- Main App (Citizens): **https://cleanstreet-frontend.vercel.app**
- Admin + Volunteer Portal: **https://clean-streetproject.vercel.app**
- Backend Health Endpoint: **https://cleanstreetproject.onrender.com/api/health**

---

## Problem It Solves

City issue reporting is often fragmented and slow. CleanStreet centralizes:

- Complaint submission by citizens
- Admin triage and assignment
- Volunteer execution and status updates
- End-to-end visibility across roles

---

## Key Features

### Citizen App
- User registration/login
- Submit complaints with details
- Track complaint progress
- View and interact with listed complaints

### Admin Portal
- Secure admin authentication
- Complaint moderation and status updates
- Volunteer management (approve/block/create)
- Dashboard and operational visibility

### Volunteer Portal
- Volunteer login and profile
- Assigned complaints view
- Update complaint progress/status

### Backend
- JWT-based authentication
- Role-aware route protection
- MongoDB Atlas integration
- CORS and environment-based configuration
- Production-ready deployment on Render

---

## Tech Stack

- **Frontend:** React, React Router, Axios
- **Admin Frontend:** React, Axios, jsPDF, html2canvas
- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB Atlas
- **Deployment:** Vercel (frontends), Render (backend)

---

## Monorepo Structure

```bash
CleanStreetproject/
├── frontend/                 # Citizen-facing app (React)
├── admin-frontend/           # Admin + Volunteer app (React)
└── CleanStreet_Team2/backend # API server (Node/Express/MongoDB)


Citizen Frontend (Vercel) ----\
                                --> Backend API (Render) --> MongoDB Atlas
Admin/Volunteer Frontend ------/

## Local Setup
1) Clone

git clone https://github.com/rookhmani/CleanStreetproject.git
cd CleanStreetproject

2) Backend

cd CleanStreet_Team2/backend
npm install
npm run dev

3) Citizen Frontend

cd ../../frontend
npm install
npm start

4) Admin Frontend

cd ../admin-frontend
npm install
npm start

Backend (CleanStreet_Team2/backend/.env)
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
ADMIN_CLIENT_URL=http://localhost:3001
ADMIN_EMAIL=admin@cleanstreet.com
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=Super Admin

## Frontend (frontend/.env)
REACT_APP_API_URL=http://localhost:5000/api

Admin Frontend (admin-frontend/.env)
REACT_APP_API_URL=http://localhost:5000/api

## Deployment Notes
Backend: Render Web Service (CleanStreet_Team2/backend)
Frontends: Separate Vercel projects:
Root frontend
Root admin-frontend
Render CORS env must match deployed frontend URLs:
CLIENT_URL=https://cleanstreet-frontend.vercel.app
ADMIN_CLIENT_URL=https://clean-streetproject.vercel.app
What Recruiters Should Notice
End-to-end full-stack ownership (frontend, backend, database, deployment)
Multi-role product design (citizen/admin/volunteer workflows)
Production troubleshooting and dependency conflict resolution
Real cloud deployment with environment-aware configuration
Practical engineering focus: reliability, auth, routing, and operational UX
Future Improvements
File/image persistence via S3/R2
Notification system (email/SMS/WhatsApp)
Geo-tagging and map clustering
Audit logs + analytics dashboard
CI/CD pipeline with automated tests
Author
Rookhmani
GitHub: @rookhmani


