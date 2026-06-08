const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await userModel.getUserByEmail(email);
    if (!user || !user.is_active) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { user_id: user.user_id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    await userModel.updateLastLogin(user.user_id);

    res.json({ token, user: { user_id: user.user_id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const profile = async (req, res) => {
  const user = req.user; // set by auth middleware
  res.json({ user });
};

const logout = async (req, res) => {
  // For JWT stateless logout, client should discard token.
  // Optionally record audit log here; middleware can be added later.
  res.json({ message: 'Logged out' });
};

const signup = async (req, res) => {
  // Implementation for user signup
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  res.send(`User ${email} signed up successfully`);

};



module.exports = { login, profile, logout, signup };
