const attendanceModel = require('../models/attendanceModel');
const userModel = require('../models/userModel');
const memberModel = require('../models/memberModel');
const emailService = require('../services/emailService');

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isLate(checkInTimeISO) {
  const workStart = process.env.WORK_START_TIME || '09:00';
  const [h, m] = workStart.split(':').map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  const check = new Date(checkInTimeISO);
  return check > start;
}

function getGeofenceInfo() {
  const fenceLat = parseFloat(process.env.GEOFENCE_LAT || '0');
  const fenceLon = parseFloat(process.env.GEOFENCE_LON || '0');
  const fenceRadius = parseFloat(process.env.GEOFENCE_RADIUS_METERS || '0');
  return { fenceLat, fenceLon, fenceRadius };
}

function verifyGeofence(latitude, longitude) {
  const { fenceLat, fenceLon, fenceRadius } = getGeofenceInfo();
  if (isNaN(latitude) || isNaN(longitude)) return { valid: false, reason: 'Location coordinates are required' };
  if (fenceRadius <= 0) return { valid: true, distance: 0, reason: 'Geofence not configured' };

  const distance = getDistanceMeters(latitude, longitude, fenceLat, fenceLon);
  return {
    valid: distance <= fenceRadius,
    distance,
    radius: fenceRadius,
    center: { latitude: fenceLat, longitude: fenceLon },
    reason: distance <= fenceRadius ? 'Inside premises' : 'Outside allowed radius'
  };
}

const checkin = async (req, res) => {
  try {
    const nowISO = new Date().toISOString();
    const attendance_date = nowISO.slice(0,10);

    let userId = req.user && req.user.user_id;
    if (!userId) userId = req.body.user_id;

    const user = userId ? await userModel.getUserById(userId) : null;
    const member = user && user.member_id ? await memberModel.getMemberById(user.member_id) : null;

    const full_name = req.body.full_name || (member && member.full_name) || 'Unknown';
    const role = req.body.role || (user && user.role) || (member && member.role) || 'attachee';
    const department = req.body.department || (member && member.department) || null;
    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);

    const fenceResult = verifyGeofence(latitude, longitude);
    if (!fenceResult.valid && fenceResult.radius > 0) {
      return res.status(403).json({
        message: 'Attendance can only be marked within Swahilipot Hub Foundation premises.',
        location_verified: false,
        distance: fenceResult.distance,
        allowed_radius: fenceResult.radius
      });
    }

    const status = isLate(nowISO) ? 'Late' : 'On Time';

    const record = {
      user_id: userId,
      full_name,
      role,
      department,
      attendance_date,
      check_in_time: nowISO,
      status,
      latitude,
      longitude,
      location_verified: fenceResult.valid,
      attendance_type: 'checkin'
    };

    const created = await attendanceModel.createAttendance(record);

    try {
      const to = (member && member.email) || (user && user.email);
      if (to) {
        await emailService.sendAttendanceEmail({ to, name: full_name, date: attendance_date, time: nowISO, status, locationConfirmed: fenceResult.valid });
      }
    } catch (e) { console.error('Email send failed', e); }

    res.json({ success: true, attendance: created, location_verified: fenceResult.valid, distance: fenceResult.distance || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const publicCheckin = async (req, res) => {
  try {
    const { full_name, email } = req.body;
    const member = await memberModel.getMemberByEmail(email);
    if (!member || member.membership_status !== 'active') return res.status(403).json({ message: 'Access Denied. You are not registered as an authorized Swahilipot Hub Foundation member. Please contact the administrator.' });

    req.body.full_name = full_name || member.full_name;
    req.body.role = member.role;
    req.body.department = member.department;

    return await checkin(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const geofenceInfo = async (req, res) => {
  const { fenceLat, fenceLon, fenceRadius } = getGeofenceInfo();
  res.json({ latitude: fenceLat, longitude: fenceLon, radius: fenceRadius });
};

const history = async (req, res) => {
  const userId = req.params.userId || (req.user && req.user.user_id);
  try {
    const rows = await attendanceModel.getAttendanceByUser(userId);
    res.json({ history: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { checkin, publicCheckin, geofenceInfo, history };
