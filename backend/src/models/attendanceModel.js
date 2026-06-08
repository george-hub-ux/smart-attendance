const db = require('../config/db');

const createAttendance = async (record) => {
  const { user_id, full_name, role, department, attendance_date, check_in_time, status, latitude, longitude, location_verified, attendance_type } = record;
  const res = await db.query(
    `INSERT INTO attendance (user_id, full_name, role, department, attendance_date, check_in_time, status, latitude, longitude, location_verified, attendance_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [user_id, full_name, role, department, attendance_date, check_in_time, status, latitude, longitude, location_verified, attendance_type]
  );
  return res.rows[0];
};

const getAttendanceByUser = async (userId, limit = 50) => {
  const res = await db.query('SELECT * FROM attendance WHERE user_id = $1 ORDER BY attendance_date DESC LIMIT $2', [userId, limit]);
  return res.rows;
};

module.exports = { createAttendance, getAttendanceByUser };
