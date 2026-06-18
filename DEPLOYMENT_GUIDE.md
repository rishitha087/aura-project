# PrepSync — Vercel, Render & Supabase PostgreSQL Deployment Guide

This guide walks you through deploying the **PrepSync** backend to **Render**, migrating the database to a managed **Supabase PostgreSQL** instance, and deploying the React frontend to **Vercel**.

---

## Architecture Summary

```
                  ┌─────────────────────────────┐
                  │      Vercel Frontend        │
                  │        (React SPA)          │
                  └──────────────┬──────────────┘
                                 │ VITE_API_URL
                                 ▼
                  ┌─────────────────────────────┐
                  │       Render Backend        │
                  │   (Django API + Gunicorn)   │
                  └──────────────┬──────────────┘
                                 │ DATABASE_URL
                                 ▼
                  ┌─────────────────────────────┐
                  │    Supabase PostgreSQL      │
                  │        (Managed DB)         │
                  └─────────────────────────────┘
```

---

## Step 1: Set Up Supabase PostgreSQL

Your Supabase database is ready at:
* **Host:** `db.wmtilxlgwstdnfhatqwe.supabase.co`
* **Port:** `5432`
* **Database Name:** `postgres`
* **Username:** `postgres`
* **SSL Mode:** `require`

### Database Connection String Format
Your `DATABASE_URL` will be:
```
postgresql://postgres:[YOUR-PASSWORD]@db.wmtilxlgwstdnfhatqwe.supabase.co:5432/postgres
```
*(Make sure to replace `[YOUR-PASSWORD]` with the actual database password you chose when creating the Supabase project).*

---

## Step 2: Deploy Backend to Render

### 2A. Create Render Web Service
1. Log in to [Render](https://render.com).
2. Click **New +** -> **Blueprints** (recommened as we created a `render.yaml` file) OR **Web Service**.
3. **If using Blueprint (Fastest):**
   * Connect your GitHub repo (`rishitha087/aura-project`).
   * Render will detect `render.yaml` and configure the service automatically.
4. **If configuring manually as a Web Service:**
   * Select your GitHub repository.
   * **Language/Runtime:** `Python 3`
   * **Root Directory:** `backend`
   * **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   * **Start Command:** `python manage.py migrate --noinput && gunicorn mock_interview_api.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --log-level info`
   * **Instance Type:** Paid starter tier is required *only if* you want to attach a persistent disk for user uploaded media files (photos/resumes). If you are using external object storage (like AWS S3) later, you can select the Free Tier.

### 2B. Set Environment Variables on Render
Add the following variables in the **Environment** tab of your Render Web Service:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `IS_PRODUCTION` | `True` | Activates production configurations |
| `SECRET_KEY` | `pip@mk=t@woo)hfdq9r_bcpibmi)a#vr_$h_bz%6*^py1z4=4%` | High-entropy production key |
| `DATABASE_URL` | `postgresql://postgres:[YOUR-PASSWORD]@db.wmtilxlgwstdnfhatqwe.supabase.co:5432/postgres` | Your Supabase connection string |
| `GEMINI_API_KEY` | `YOUR_API_KEY` | Your Google Gemini API Key |
| `RAZORPAY_KEY_ID` | `YOUR_KEY_ID` | E.g. `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | `YOUR_KEY_SECRET` | Your Razorpay payment secret key |
| `EMAIL_OTP_ENABLED` | `false` | Keeps Email OTP mock-based |
| `SMS_OTP_ENABLED` | `false` | Keeps SMS OTP mock-based |
| `ALLOWED_HOSTS` | `*` (or your backend `.onrender.com` domain) | Django Host validation list |

---

## Step 3: Run Database Migrations & Create Superuser

Once your backend service starts building on Render, it will automatically run migrations due to our startup script: `python manage.py migrate --noinput`.

### Creating an Admin Superuser on Render
To log into the Django admin panel (`/admin_django/`), you need to create a superuser:
1. In the Render dashboard, select your **Web Service**.
2. Click **Shell** in the left menu.
3. Run the interactive command:
   ```bash
   python manage.py createsuperuser
   ```
4. Enter your email, full name, and select a strong password.

---

## Step 4: Deploy Frontend to Vercel

### 4A. Import Project
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Select your GitHub repository (`rishitha087/aura-project`).
4. **Configure Project:**
   * **Framework Preset:** `Vite` (automatically detected)
   * **Root Directory:** Edit and select **`frontend`** (critical!)
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`

### 4B. Add Environment Variables on Vercel
Expand the **Environment Variables** section and add:

* **Key:** `VITE_API_URL`
* **Value:** `https://<your-render-backend-url>.onrender.com/api`  
  *(Make sure to use the active Render Web Service URL with `/api` appended at the end, and no trailing slash).*

### 4C. Deploy
Click **Deploy**. Once built, Vercel will provide your frontend production domain (e.g. `https://prepsync.vercel.app`).

---

## Step 5: Update CORS Settings in Backend

1. Copy your Vercel frontend domain (e.g., `https://prepsync.vercel.app`).
2. Go back to your **Render Web Service** dashboard -> **Environment** tab.
3. Add or update the **`CORS_ALLOWED_ORIGINS`** variable:
   ```
   CORS_ALLOWED_ORIGINS=https://prepsync.vercel.app,http://localhost:5173
   ```
   *(Separate multiple URLs by commas, with no spaces, and no trailing slashes).*
4. Render will automatically deploy a new release applying the new CORS header policy.

---

## Troubleshooting Supabase & Django Errors

### 1. `psycopg2.OperationalError: connection to server at ... failed: FATAL: password authentication failed`
* **Cause:** The database password in your `DATABASE_URL` is incorrect, or contains special characters (like `@`, `:`, `/`, `#`) that aren't URL-encoded.
* **Fix:** Verify your password in Supabase. If your password has special characters, URL-encode them (e.g., `@` becomes `%40`, `#` becomes `%23`). Alternatively, change your Supabase database password to contain only alphanumeric characters.

### 2. `psycopg2.OperationalError: SSL error: certificate verify failed`
* **Cause:** Supabase forces SSL connections, but the PostgreSQL driver is failing to find a trusted Certificate Authority root certificate locally, or SSL is not configured.
* **Fix:** We have pre-configured `sslmode=require` in Django's options:
  ```python
  DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}
  ```
  Ensure this line is present in your `settings.py` database configurations.

### 3. `ProgrammingError: relation "..." does not exist`
* **Cause:** The Django models have changes that haven't been applied to the Supabase database yet, or migrations were not run.
* **Fix:** Go to the Render Web Service Shell and run:
  ```bash
  python manage.py migrate
  ```
  If local changes were not turned into migrations, first run:
  ```bash
  python manage.py makemigrations
  ```

### 4. `CORS Blocked: Access-Control-Allow-Origin missing`
* **Cause:** The frontend URL is not listed under `CORS_ALLOWED_ORIGINS` in your Render environment variables.
* **Fix:** Double-check that your Render variables include `CORS_ALLOWED_ORIGINS` exactly matching your Vercel domain, including the `https://` prefix but *without* the trailing slash.
