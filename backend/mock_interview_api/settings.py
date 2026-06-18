"""
PrepSync — Django Settings
Handles both local development and Railway production via environment variables.
"""
import os
from pathlib import Path
from datetime import timedelta
import dotenv

# ─── BASE PATHS ───────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file (local dev only — in production, Railway injects env vars directly)
dotenv.load_dotenv(BASE_DIR / '.env')


# ─── ENVIRONMENT DETECTION ────────────────────────────────────────────────────

# Railway automatically sets RAILWAY_ENVIRONMENT='production'
# For local dev this is unset, so IS_PRODUCTION will be False
IS_PRODUCTION = os.getenv('RAILWAY_ENVIRONMENT') == 'production'


# ─── SECURITY ─────────────────────────────────────────────────────────────────

# In production, SECRET_KEY MUST be set in Railway environment variables.
# There is no fallback — this will raise a hard error if missing in prod.
_default_secret = 'django-insecure-local-dev-only-change-in-production' if not IS_PRODUCTION else None
SECRET_KEY = os.getenv('SECRET_KEY', _default_secret)
if not SECRET_KEY:
    raise ValueError(
        "FATAL: SECRET_KEY environment variable is not set. "
        "Add it to Railway environment variables."
    )

# DEBUG: Never True in production
DEBUG = not IS_PRODUCTION

# ALLOWED_HOSTS: set via env var in production, e.g.:
# ALLOWED_HOSTS=your-app.up.railway.app,your-custom-domain.com
_default_hosts = 'localhost,127.0.0.1'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', _default_hosts).split(',')

# Always allow Railway internal health checks
if IS_PRODUCTION:
    ALLOWED_HOSTS.append('.up.railway.app')
    ALLOWED_HOSTS.append('.railway.app')


# ─── APPLICATION DEFINITION ───────────────────────────────────────────────────

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',

    # Internal apps
    'users',
]

MIDDLEWARE = [
    # CORS must be first
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    # WhiteNoise: serves static files in production efficiently (right after SecurityMiddleware)
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mock_interview_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mock_interview_api.wsgi.application'


# ─── DATABASE ─────────────────────────────────────────────────────────────────
#
# Local dev:       db.sqlite3 sits next to manage.py
# Railway prod:    Volume is mounted at /data/ — database lives at /data/db.sqlite3
#                  This persists across redeployments.
#
# To use PostgreSQL later, set DATABASE_URL env var and install psycopg2-binary.

if IS_PRODUCTION:
    # Railway volume is mounted at /data
    _db_path = Path('/data/db.sqlite3')
else:
    _db_path = BASE_DIR / 'db.sqlite3'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': _db_path,
        # SQLite production tuning: WAL mode and connection timeout
        'OPTIONS': {
            'timeout': 20,
        },
    }
}


# ─── AUTH ─────────────────────────────────────────────────────────────────────

AUTH_USER_MODEL = 'users.CustomUser'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ─── INTERNATIONALIZATION ─────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ─── STATIC & MEDIA FILES ─────────────────────────────────────────────────────

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise: compress and cache static files with far-future headers
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files (user uploads: resumes, profile photos, verification documents)
# In production: served from the Railway persistent volume at /data/media/
if IS_PRODUCTION:
    MEDIA_ROOT = Path('/data/media')
else:
    MEDIA_ROOT = BASE_DIR / 'media'

MEDIA_URL = '/media/'

# File upload security limits
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB per file
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB total


# ─── CORS ─────────────────────────────────────────────────────────────────────
#
# In production, set this env var in Railway:
#   CORS_ALLOWED_ORIGINS=https://your-frontend.up.railway.app,https://your-domain.com
# In dev, local Vite dev server is automatically allowed.

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

if IS_PRODUCTION:
    _cors_origins_raw = os.getenv('CORS_ALLOWED_ORIGINS', '')
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins_raw.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
    ]

CORS_ALLOWED_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]


# ─── REST FRAMEWORK ───────────────────────────────────────────────────────────

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/hour',    # Stricter in production
        'user': '500/hour',
    },
    # Production: return minimal error details
    'EXCEPTION_HANDLER': 'users.exception_handler.custom_exception_handler',
}


# ─── JWT ──────────────────────────────────────────────────────────────────────

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
}


# ─── API SCHEMA ───────────────────────────────────────────────────────────────

SPECTACULAR_SETTINGS = {
    'TITLE': 'PrepSync API',
    'DESCRIPTION': 'AI-Powered Mock Interview Platform — Full API Reference',
    'VERSION': '3.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # Disable Swagger UI in production for security (optional — keep if you want public docs)
    'SERVE_PUBLIC': not IS_PRODUCTION,
}


# ─── SECURITY HEADERS ─────────────────────────────────────────────────────────

# Always on
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Production-only HTTPS security headers
if IS_PRODUCTION:
    # Railway terminates SSL at the load balancer, so we trust the forwarded headers
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000         # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'


# ─── LOGGING ──────────────────────────────────────────────────────────────────

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} {name} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose' if IS_PRODUCTION else 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING' if IS_PRODUCTION else 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING' if IS_PRODUCTION else 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'users': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}


# ─── EMAIL BACKEND ────────────────────────────────────────────────────────────
# OTP Email integration placeholder.
# When ready to integrate:
#   1. Set EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
#   2. Configure EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
#   3. Set DEFAULT_FROM_EMAIL

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Dev/placeholder
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'   # Uncomment for prod email
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@prepsync.com')


# ─── SMS BACKEND ─────────────────────────────────────────────────────────────
# SMS OTP integration placeholder.
# When ready to integrate (e.g. Twilio):
#   1. pip install twilio
#   2. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
#
# SMS_BACKEND = 'twilio'  # Custom setting
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')     # Placeholder
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')        # Placeholder
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')    # Placeholder
SMS_OTP_ENABLED = os.getenv('SMS_OTP_ENABLED', 'false').lower() == 'true'
EMAIL_OTP_ENABLED = os.getenv('EMAIL_OTP_ENABLED', 'false').lower() == 'true'


# ─── PAYMENT (RAZORPAY) ───────────────────────────────────────────────────────

RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', 'rzp_test_mockkey')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')


# ─── AI (GOOGLE GEMINI) ───────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
