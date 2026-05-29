# Deploying to Production

## Architecture Overview

```
User
 │
 ▼
Cloudflare (DNS + CDN)
 │                │
 ▼                ▼
Vercel          Render
(frontend)      (backend: Django + Celery workers)
                 │        │        │
                 ▼        ▼        ▼
               Neon    Upstash  Cloudflare R2
            (PostgreSQL) (Redis)  (media)
```

All traffic enters through Cloudflare. The frontend is a static Vite/React build on Vercel.
API calls from the frontend go to `/api/*`, which Vercel proxies to the Render backend —
this eliminates CORS issues entirely.

---

## Prerequisites

- GitHub repo created and code pushed
- Accounts needed:
  - [render.com](https://render.com)
  - [neon.tech](https://neon.tech)
  - [upstash.com](https://upstash.com)
  - [vercel.com](https://vercel.com)
  - [cloudflare.com](https://cloudflare.com)

---

## Step 1: PostgreSQL on Neon

1. Sign up at [neon.tech](https://neon.tech)
2. Create project: **crm-production**
3. Select region closest to your Render region (e.g., `us-east-1` for Render US East)
4. Go to **Connection Details** and copy the **pooled connection string** (pgbouncer endpoint — it contains `?pgbouncer=true`)
5. Save as `DATABASE_URL`

> The pooled endpoint handles connection limits on the free/launch tier. Use it for the Django app. Use the direct (non-pooled) connection string for migrations if Django complains about prepared statements.

---

## Step 2: Redis on Upstash

1. Sign up at [upstash.com](https://upstash.com)
2. Create database, select region matching Neon/Render
3. Set **Eviction policy**: `noeviction` (required for Celery task queues)
4. Copy the **Redis URL** (starts with `rediss://...` — note the double `s` for TLS)
5. Save as `REDIS_URL`

---

## Step 3: Cloudflare R2 (media storage)

1. Cloudflare dashboard → **R2** → **Create bucket**: `crm-media`
2. R2 → **Manage R2 API Tokens** → **Create Token**
   - Permissions: **Object Read & Write**
   - Scope: bucket `crm-media`
3. Note the following credentials:
   - **Account ID**: visible in the Cloudflare dashboard URL (`/accounts/<ACCOUNT_ID>/`)
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint URL**: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
4. (Optional) In the bucket settings, add a **Custom Domain** (e.g., `media.yourdomain.com`) for public file URLs

---

## Step 4: Deploy Backend on Render

1. Go to [render.com](https://render.com) and connect your GitHub repo
2. **New → Blueprint** — Render will detect `render.yaml` and create all services
3. Set the following **environment variables** on the web service (and worker services):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `REDIS_URL` | Upstash Redis URL (`rediss://...`) |
| `SECRET_KEY` | Generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `ALLOWED_HOSTS` | `your-backend.onrender.com,yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,https://yourdomain.com` |
| `R2_ACCESS_KEY_ID` | From Step 3 |
| `R2_SECRET_ACCESS_KEY` | From Step 3 |
| `R2_BUCKET_NAME` | `crm-media` |
| `R2_ENDPOINT_URL` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `DEBUG` | `False` |

4. Deploy — the first deploy runs `python manage.py migrate` automatically (per `render.yaml`)
5. Note your backend URL: `https://crm-backend.onrender.com`

---

## Step 5: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and **Import** your GitHub repo
2. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variable**:
   - `VITE_API_URL` = `/api/v1`
4. Before deploying, update `frontend/vercel.json` — replace `your-backend.onrender.com` with your actual Render service URL from Step 4
5. Commit and push, then deploy on Vercel

> The `/api/*` rewrite in `vercel.json` proxies all API calls from the frontend to your Render backend. The frontend never makes cross-origin requests.

---

## Step 6: Custom Domain on Cloudflare

1. Add your domain to Cloudflare (update nameservers at your registrar)
2. In Cloudflare DNS, add:
   - `CNAME` `@` → `cname.vercel-dns.com` (frontend on root domain) — **Proxy: ON**
   - `CNAME` `api` → `your-backend.onrender.com` (backend subdomain) — **Proxy: ON**
3. In **Render**: service settings → **Custom Domains** → add `api.yourdomain.com`
4. In **Vercel**: project settings → **Domains** → add `yourdomain.com`
5. Update backend environment variables:
   - `ALLOWED_HOSTS`: add `api.yourdomain.com`
   - `CORS_ALLOWED_ORIGINS`: add `https://yourdomain.com`
6. Update `frontend/vercel.json` destination to `https://api.yourdomain.com/api/:path*` if routing through the custom domain
7. Redeploy both services

---

## Step 7: GitHub Actions Secrets

In your GitHub repo: **Settings → Secrets and variables → Actions**, add:

| Secret | Where to get it |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Account Settings → General (your team/personal ID) |
| `VERCEL_PROJECT_ID` | Vercel → Project Settings → General |

These are used by `.github/workflows/` to trigger deploys on push to `main`.

---

## Step 8: Create Admin User

Via the Render shell (dashboard → service → **Shell** tab):

```bash
python manage.py createsuperuser
```

---

## Step 9: Verify

| Check | URL |
|---|---|
| Frontend | `https://yourdomain.com` |
| API health | `https://api.yourdomain.com/api/v1/health/` |
| Django admin | `https://api.yourdomain.com/admin/` |

---

## Estimated Monthly Cost

| Service | Plan | Cost |
|---|---|---|
| Render (web service) | Starter ($7) | $7/mo |
| Render (2 Celery workers) | Starter ($7 each) | $14/mo |
| Neon | Launch | $19/mo |
| Upstash Redis | Pay-as-you-go | ~$5–10/mo |
| Vercel | Pro | $20/mo |
| Cloudflare R2 | Pay-as-you-go | ~$1–5/mo |
| **Total (starter)** | | **~$65–75/mo** |

**Scaling up**: Upgrade Render web service to Standard ($25/mo) when sustained load demands it. Budget becomes ~$100–120/mo.

Vercel Hobby (free) works for low-traffic or staging but lacks team features and SLA. Use Pro for production.
