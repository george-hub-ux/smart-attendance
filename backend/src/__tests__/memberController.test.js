const request = require('supertest');

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const app = require('../app');

jest.mock('../models/memberModel', () => ({
  getMemberByEmail: jest.fn(),
}));

jest.mock('../models/auditModel', () => ({
  createAudit: jest.fn(),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

const jwt = require('jsonwebtoken');
const memberModel = require('../models/memberModel');
const auditModel = require('../models/auditModel');

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Member controller routes', () => {
  describe('POST /api/members/verify', () => {
    it('returns 403 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/members/verify')
        .send({ email: 'test@example.com', full_name: 'Test User', phone_number: '123456789', token: 'invalid-token' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Invalid or expired token' });
      expect(memberModel.getMemberByEmail).not.toHaveBeenCalled();
    });

    it('returns access granted for an active member without token', async () => {
      memberModel.getMemberByEmail.mockResolvedValue({
        email: 'test@example.com',
        full_name: 'Test User',
        phone_number: '123456789',
        membership_status: 'active',
      });

      const response = await request(app)
        .post('/api/members/verify')
        .send({ email: 'test@example.com', full_name: 'Test User', phone_number: '123456789' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access', 'granted');
      expect(response.body.member).toMatchObject({ email: 'test@example.com' });
      expect(memberModel.getMemberByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('returns 403 when email is not registered', async () => {
      memberModel.getMemberByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/members/verify')
        .send({ email: 'missing@example.com', full_name: 'Missing User', phone_number: '000' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Access Denied. You are not registered as an authorized Swahilipot Hub Foundation member. Please contact the administrator.' });
      expect(memberModel.getMemberByEmail).toHaveBeenCalledWith('missing@example.com');
    });
  });

  describe('GET /api/members/qrcode/token', () => {
    it('returns a token QR code and writes an audit record', async () => {
      const response = await request(app).get('/api/members/qrcode/token?expires=120');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('qrcode', 'data:image/png;base64,fake');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('expires', 120);
      expect(auditModel.createAudit).toHaveBeenCalledTimes(1);
      expect(auditModel.createAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          user_name: 'system',
          access_status: 'qrcode_generated',
        }),
      );
      expect(response.body.url).toMatch(/verify-member\?token=/);
    });
  });
});
