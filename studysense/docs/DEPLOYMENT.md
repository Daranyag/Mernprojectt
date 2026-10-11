# StudySense — Production Deployment & Live Setup Guide

StudySense is built as a complete **MERN** (MongoDB, Express, React, Node.js) architecture. This document outlines the hosting architecture, environment configuration, build/start commands, and zero-downtime deployment steps.

---

## 1. Production Architecture Overview

- **Frontend**: React 18 + Vite SPA deployed on **Vercel** or **Netlify**.
  - Serves static assets over global CDN with HTTPS.
  - SPA client routing handled via `vercel.json` or `_redirects` (`/* -> /index.html`).
  - Talks to backend API via `VITE_API_BASE_URL`.
- **Backend**: Express API deployed on **Render** (or **Railway**).
  - Listens on `PORT` provided by hosting environment.
  - Secures sessions using `HttpOnly`, `SameSite=None`, `Secure` JWT cookies.
  - Health check available at `GET /api/health`.
- **Database**: **MongoDB Atlas** (Cloud M0/Serverless cluster).
  - Secure TLS connection string (`mongodb+srv://...`).
- **AI Engines**:
  - Google Gemini API (`GEMINI_API_KEY`) for intelligent quiz, notes, exam paper, and syllabus topic generation.
  - Graceful academic fallback engine kicks in automatically if API key is not present.

---

## 2. Environment Variables Specification

> **Important**: Never commit real secret keys into Git repositories or frontend client bundles.

### Backend (`studysense/server/.env` in hosting provider)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Listening port (auto-set by Render/Railway) | `10000` or `5000` |
| `MONGO_URI` | MongoDB Atlas Connection String | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/studysense?retryWrites=true&w=majority` |
| `JWT_SECRET` | 32+ character random secret for JWT signing | `6b9c9f8721c4e78a6321f478e...` |
| `JWT_EXPIRE` | JWT Token expiration time | `1d` |
| `CLIENT_URL` | Deployed Frontend URL (or comma-separated URLs) | `https://studysense.vercel.app` |
| `COOKIE_SAME_SITE` | Cookie cross-origin policy | `none` (required for cross-domain HTTPS) |
| `COOKIE_SECRET` | Secret for signed cookie parsing | `random_secret_cookie_key_9921` |
| `GEMINI_API_KEY` | *(Optional)* Google Gemini AI Key | `AIzaSy...` |

### Frontend (`studysense/client/.env` in hosting provider)

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Deployed backend API base address | `https://studysense-backend.onrender.com/api` |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Deploy Backend on Render (Free & Fast)

1. Go to [render.com](https://render.com) and sign in with GitHub (`Daranyag`).
2. Click **New +** > **Web Service**.
3. Select your repository: `Daranyag/Mernprojectt`.
4. Configure service settings:
   - **Name**: `studysense-api`
   - **Root Directory**: `studysense/server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. In **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = *Your MongoDB Atlas connection URI*
   - `JWT_SECRET` = *Generate a random secure string*
   - `JWT_EXPIRE` = `1d`
   - `COOKIE_SAME_SITE` = `none`
   - `COOKIE_SECRET` = *Random secret string*
   - `CLIENT_URL` = *(Temporarily set to `*` or your planned Vercel URL, update once frontend is deployed)*
   - `GEMINI_API_KEY` = *(Your Gemini API key if available)*
6. Click **Deploy Web Service**.
7. Once deployed, verify:
   ```
   https://studysense-api.onrender.com/api/health
   ```
   Should return: `{"status":"ok","database":"connected","timestamp":"..."}`.

---

### Step 2: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub (`Daranyag`).
2. Click **Add New...** > **Project**.
3. Import `Daranyag/Mernprojectt`.
4. Configure project settings:
   - **Root Directory**: click Edit and select `studysense/client`.
   - **Framework Preset**: `Vite` (detected automatically).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL` = `https://studysense-api.onrender.com/api` *(Your Render backend URL with /api)*
6. Click **Deploy**.
7. Once finished, copy your live frontend URL (e.g. `https://studysense.vercel.app`).

---

### Step 3: Link Backend CORS to Frontend URL

1. In your **Render Dashboard** for `studysense-api`, go to **Environment**.
2. Update `CLIENT_URL` to your real Vercel URL:
   ```
   CLIENT_URL=https://studysense.vercel.app
   ```
3. Render will automatically redeploy with the updated CORS policy.

---

## 4. MongoDB Atlas Network Configuration

For your cloud backend (Render) to reach MongoDB Atlas:
1. Open [cloud.mongodb.com](https://cloud.mongodb.com).
2. Go to **Network Access** under Security.
3. Add IP Address: `0.0.0.0/0` (Allow Access from Anywhere) — Render uses dynamic egress IP addresses.
4. Go to **Database Access** and verify your database user has `readWriteAnyDatabase` or read/write access to `studysense`.

---

## 5. Automated CI/CD & Future Updates

Since your repository `https://github.com/Daranyag/Mernprojectt` is connected:
- Every `git push origin main` will **automatically trigger a redeploy** on both Render and Vercel.
- Zero manual server restarts required.
