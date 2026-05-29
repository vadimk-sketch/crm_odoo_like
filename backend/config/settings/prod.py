import os

from .base import *  # noqa: F401, F403

DEBUG = False
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

# --- Security ---

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# --- Cloudflare R2 media storage (S3-compatible) ---

DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
AWS_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "crm-media")
AWS_S3_ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL")  # https://<account>.r2.cloudflarestorage.com
AWS_S3_CUSTOM_DOMAIN = os.environ.get("R2_PUBLIC_DOMAIN")  # optional custom domain
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = False

# --- Static files: WhiteNoise ---

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MIDDLEWARE = ["whitenoise.middleware.WhiteNoiseMiddleware"] + MIDDLEWARE

# --- Celery: use REDIS_URL from Render/Upstash env var ---

CELERY_BROKER_URL = os.environ.get("REDIS_URL", os.environ.get("CELERY_BROKER_URL", ""))
CELERY_RESULT_BACKEND = CELERY_BROKER_URL

# --- CORS: specific origins only ---

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")

# --- Logging ---

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {module} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}
