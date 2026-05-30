FROM python:3.12-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY backend/requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/prod.txt

FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin/gunicorn /usr/local/bin/gunicorn
COPY --from=builder /usr/local/bin/celery /usr/local/bin/celery
COPY backend/ .
ENV DJANGO_SETTINGS_MODULE=config.settings.prod
ENV PYTHONDONTWRITEBYTECODE=1
EXPOSE 10000
CMD ["sh", "-c", "python manage.py migrate --noinput; python manage.py collectstatic --noinput --clear; exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers 2 --timeout 120 --access-logfile - --error-logfile -"]
