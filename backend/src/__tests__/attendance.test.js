jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../middleware/authMiddleware', () => (req, res, next) => { req.user = { user_id: 'user-1', email: 'test@ex.com', role: 'attachee' }; return next(); });

jest.mock('../models/attendanceModel', () => ({
  createAttendance: jest.fn(),
  getAttendanceByUser: jest.fn(),
}));

jest.mock('../models/userModel', () => ({
  getUserById: jest.fn(),
}));

jest.mock('../models/memberModel', () => ({
  getMemberByEmail: jest.fn(),
  getMemberById: jest.fn(),
}));

jest.mock('../services/emailService', () => ({
  sendAttendanceEmail: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const attendanceModel = require('../models/attendanceModel');
const memberModel = require('../models/memberModel');

beforeAll(() => {
  process.env.GEOFENCE_LAT = '0';
  process.env.GEOFENCE_LON = '0';
  process.env.GEOFENCE_RADIUS_METERS = '1000';
  process.env.WORK_START_TIME = '09:00';
});

afterEach(() => jest.clearAllMocks());

describe('Attendance endpoints', () => {
  test('GET /api/attendance/geofence returns configured info', async () => {
    const res = await request(app).get('/api/attendance/geofence');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('latitude');
    expect(res.body).toHaveProperty('longitude');
    expect(res.body).toHaveProperty('radius');
  });

  test('POST /api/attendance/checkin (authenticated) creates attendance and sends email', async () => {
    attendanceModel.createAttendance.mockResolvedValue({ id: 'att-1' });
    const payload = { latitude: 0, longitude: 0 };
    const res = await request(app)
      .post('/api/attendance/checkin')
      .set('Authorization', 'Bearer testtoken')
      .send(payload);

    expect(res.status).toBe(200);
    expect(attendanceModel.createAttendance).toHaveBeenCalled();
    expect(res.body).toHaveProperty('success', true);
  });

  test('POST /api/attendance/checkin/public denies unregistered member', async () => {
    memberModel.getMemberByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/attendance/checkin/public')
      .send({ email: 'missing@example.com', full_name: 'Missing' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
  });

  test('GET /api/attendance/history/:userId returns attendance history', async () => {
    attendanceModel.getAttendanceByUser.mockResolvedValue([{ id: 'att-1' }]);
    const res = await request(app)
      .get('/api/attendance/history/user-1')
      .set('Authorization', 'Bearer testtoken');

    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(1);
  });
});
