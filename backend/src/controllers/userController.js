const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const memberModel = require('../models/memberModel');
const auditModel = require('../models/auditModel');

const createUser = async (req, res) => {
  const { member_id, email, password, role } = req.body;
  try {
    const member = await memberModel.getMemberById(member_id);
    if (!member) return res.status(400).json({ message: 'Member not found' });
    if (member.email !== email) return res.status(400).json({ message: 'Email must match member record' });
    if (member.membership_status !== 'active') return res.status(400).json({ message: 'Member is not active' });

    const existing = await userModel.getUserByEmail(email);
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await userModel.createUser({ member_id, email, password_hash, role });
    await auditModel.createAudit({ user_name: req.user.email, email: req.user.email, ip_address: req.ip, location: null, access_status: 'user_created', reason: `User ${email} created` });

    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listUsers = async (req, res) => {
  try {
    const rows = await userModel.listUsers();
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createUser, listUsers };
