# Deployment (Backend)

This file explains quick steps to run the backend with Docker and locally.

## Environment
Create a `.env` file in `backend/` with at least:

DATABASE_URL=postgres://postgres:postgres@localhost:5432/smart_attendance
JWT_SECRET=replace-with-secret
FRONTEND_URL=http://localhost:3000
WORK_START_TIME=09:00
GEOFENCE_LAT=0
GEOFENCE_LON=0
GEOFENCE_RADIUS_METERS=1000

## Run with Docker Compose

```bash
# from project root
docker-compose up --build
```

This will start Postgres and the backend on port `5000`.

## CI
The repository includes a GitHub Actions workflow at `.github/workflows/backend-ci.yml` that runs the backend test suite on push and PRs affecting `backend/`.
