# Traceon — Deployment Guide

Traceon runs as two services:

| Service | Platform | URL |
|---|---|---|
| Frontend (React) | Vercel | https://frontend-gamma-vert-20.vercel.app |
| Backend (FastAPI) | Railway | https://traceon-backend-production.up.railway.app |

---

## Auto-deploy (already configured)

Every `git push origin main` triggers automatic redeployment:

| Changed files | What triggers |
|---|---|
| `frontend/**` | GitHub Actions → Vercel rebuild (~1 min) |
| `src/**`, `requirements.txt`, `Dockerfile`, `run_server.py` | Railway detects push → Docker rebuild (~5 min) |

No manual steps needed after a push.

---

## Re-deploy manually (if needed)

**Frontend:**
```bash
cd frontend
vercel --prod --yes
```

**Backend:**
Railway automatically picks up the latest `main` commit. To force a redeploy, go to the Railway dashboard → traceon-backend → Deployments → Redeploy.

---

## Deploy from scratch (new environment)

Use this if you are setting up a fresh deployment.

---

### Part 1 — Backend on Railway

#### 1.1 Create a Railway account

Go to [railway.com](https://railway.com) and sign up.

#### 1.2 Install Railway CLI and deploy

```bash
npm install -g @railway/cli
railway login
railway init --name traceon-backend
railway up --service traceon-backend --detach
railway domain
```

Note the URL printed by `railway domain` — you will need it for the frontend.

#### 1.3 Set environment variables

```bash
railway variables set \
  HOST=0.0.0.0 \
  PORT=8080 \
  RELOAD=false \
  "GEMINI_API_KEY=your_key" \
  "JWT_SECRET=your_secret" \
  "GOOGLE_CLIENT_ID=your_client_id" \
  "GOOGLE_CLIENT_SECRET=your_client_secret" \
  "ALLOWED_ORIGINS=https://your-vercel-url.vercel.app" \
  "FRONTEND_ORIGIN=https://your-vercel-url.vercel.app" \
  "OAUTH_REDIRECT_URI=https://your-railway-url.railway.app/auth/google/callback" \
  "MONGO_CONNECTION_STRING=mongodb+srv://..." \
  MONGO_DB_NAME=traceon \
  MONGO_COLLECTION_NAME=execution_sessions
```

#### 1.4 Connect GitHub for auto-deploy

In Railway dashboard → traceon-backend service → **Settings → Source → Connect Repo** → select your repo → branch `main`.

---

### Part 2 — Frontend on Vercel

#### 2.1 Install Vercel CLI and deploy

```bash
npm install -g vercel
vercel login
cd frontend
vercel link --yes
vercel env add REACT_APP_API_URL production   # enter your Railway URL
vercel --prod --yes
```

#### 2.2 Set up GitHub Actions for auto-deploy

The workflow file `.github/workflows/deploy-frontend.yml` is already in the repo. Add these secrets to your GitHub repo:

```bash
gh secret set VERCEL_TOKEN      --body "your_vercel_token"
gh secret set VERCEL_ORG_ID     --body "your_team_id"
gh secret set VERCEL_PROJECT_ID --body "your_project_id"
```

Get these values from:
- `VERCEL_TOKEN` — [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` — `frontend/.vercel/project.json` after linking

---

### Part 3 — Wire the two services

#### 3.1 Update CORS on Railway

After Vercel gives you the frontend URL, update `ALLOWED_ORIGINS` and `FRONTEND_ORIGIN` on Railway:

```bash
railway variables set \
  "ALLOWED_ORIGINS=https://your-app.vercel.app" \
  "FRONTEND_ORIGIN=https://your-app.vercel.app"
```

#### 3.2 Update Google OAuth redirect URIs

In [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials → your OAuth client**:

- **Authorized redirect URIs:** `https://your-railway-url.railway.app/auth/google/callback`
- **Authorized JavaScript origins:** `https://your-app.vercel.app`

---

## Environment variable reference

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `HOST` | Yes | Set to `0.0.0.0` in production |
| `PORT` | Yes | Set to `8080` on Railway |
| `RELOAD` | No | Set to `false` in production |
| `GEMINI_API_KEY` | Yes | From aistudio.google.com |
| `JWT_SECRET` | Yes | Long random string |
| `GOOGLE_CLIENT_ID` | No | For Sign In with Google |
| `GOOGLE_CLIENT_SECRET` | No | For Sign In with Google |
| `ALLOWED_ORIGINS` | Yes | Comma-separated frontend URLs |
| `FRONTEND_ORIGIN` | Yes | Primary frontend URL |
| `OAUTH_REDIRECT_URI` | No | Backend callback URL for OAuth |
| `MONGO_CONNECTION_STRING` | No | MongoDB Atlas URI |
| `MONGO_DB_NAME` | No | Default: `traceon` |
| `MONGO_COLLECTION_NAME` | No | Default: `execution_sessions` |

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | Yes | Full Railway backend URL |

---

## Troubleshooting

**Railway build fails immediately (< 2 min)**
Railway's GitHub app is not installed on the repo. Go to the service Settings → Source → Connect Repo and authorize GitHub.

**`StrEnum` import error in Railway logs**
The base image is using Python < 3.11. Ensure the `Dockerfile` starts with `FROM python:3.12-slim`.

**Frontend shows "Cannot connect to server"**
`REACT_APP_API_URL` is missing or incorrect on Vercel. Check Vercel dashboard → Project → Settings → Environment Variables.

**CORS error in browser console**
`ALLOWED_ORIGINS` on Railway does not include the exact Vercel URL (no trailing slash). Update and redeploy.

**Google Sign In fails**
Verify the redirect URI in Google Cloud Console matches `https://your-railway-url.railway.app/auth/google/callback` exactly.

---

## Cost

| Service | Plan | Cost |
|---|---|---|
| Vercel (frontend) | Hobby | Free |
| Railway (backend) | Trial → Starter | Free $5 credit, then ~$5/mo |
| MongoDB Atlas | M0 | Free (512 MB) |
