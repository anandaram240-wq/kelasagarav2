# KelasaGaara — Karnataka Daily Worker Marketplace

A browser-based web app connecting daily wage workers and hirers across all 31 districts of Karnataka.

## Live Demo

🔗 **[Deployed on Vercel →](https://kelasagara.vercel.app)**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6 Modules) |
| Auth | Firebase Authentication (Google OAuth 2.0) |
| Database | Firebase Cloud Firestore |
| Fonts | Google Fonts (Baloo Tamma 2, DM Sans) |
| Hosting | Vercel |

## Project Structure

```
kelasagara/
├── index.html              ← Landing page
├── login.html              ← Role selection + Google Sign-In
├── worker-dashboard.html   ← Worker profile, skills, applied jobs
├── hirer-dashboard.html    ← Hirer profile, posted jobs, applicants
├── find-jobs.html          ← Browse & filter jobs, one-click apply
├── post-job.html           ← Post a new job (form)
├── css/style.css           ← Global design system
├── js/firebase-config.js   ← Firebase initialization
├── js/auth.js              ← Google Sign-In, checkAuth, logout
├── js/app.js               ← Shared helpers
└── vercel.json             ← Vercel deployment config
```

## Features

- ✅ Google OAuth login (no passwords)
- ✅ Role-based dashboards (Worker / Hirer)
- ✅ All 31 Karnataka districts
- ✅ 10 job categories (Mason, Plumber, Electrician, etc.)
- ✅ One-click job apply using Firestore `arrayUnion`
- ✅ Client-side filters by district and category
- ✅ Skill tags for worker profiles
- ✅ Applicant list modal for hirers

## Setup

1. Clone the repo
2. Go to [Firebase Console](https://console.firebase.google.com)
3. Enable Google Authentication in your Firebase project
4. Add your Vercel domain to Firebase authorized domains
5. Deploy to Vercel

## Academic Project

This is a Phase 3 mini project for B.E. Computer Science and Engineering, Academic Year 2024–2025.
