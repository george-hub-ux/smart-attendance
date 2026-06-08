Backend: Phase 1 - Database setup

Run the SQL in `backend/sql/schema.sql` to create the database schema. Example using psql:

```bash
createdb swahilipot_attendance
psql -d swahilipot_attendance -f backend/sql/schema.sql
```

Update `.env.example` and copy to `.env` with real credentials before starting the backend.

API endpoints added for Phase 4 (Member Verification):

- `GET /api/members/qrcode` : returns JSON `{ qrcode: dataUrl, url }` with a QR code data URL pointing to the frontend verify-member page.
- `POST /api/members/verify` : verifies a member by `email`, `full_name`, `phone_number`.

If running frontend on a different origin, enable CORS or set `FRONTEND_URL` in backend `.env`.

Phase 6 GPS Geofencing:
- `GET /api/attendance/geofence` returns configured latitude, longitude, and radius.
- Attendance check-in will be rejected with a clear message when outside the configured premises radius.
- Configure `GEOFENCE_LAT`, `GEOFENCE_LON`, and `GEOFENCE_RADIUS_METERS` in `.env`.

Phase 9 Reports:
- `GET /api/reports/daily?date=YYYY-MM-DD&format=json|csv|excel|pdf` (supervisor only)
- `GET /api/reports/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD` (supervisor only)
- `GET /api/reports/monthly?month=YYYY-MM` (supervisor only)

CSV/Excel/PDF generation uses optional dependencies; run `npm install` in `backend` to install them.
