const db = require('../config/db');

const createUser = async ({ member_id, email, password_hash, role }) => {
  const res = await db.query(
    `INSERT INTO users (member_id, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *`,
    [member_id, email, password_hash, role]
  );
  return res.rows[0];
};

const getUserByEmail = async (email) => {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

const getUserById = async (userId) => {
  const res = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  return res.rows[0];
};

const updateLastLogin = async (userId) => {
  await db.query('UPDATE users SET last_login = now() WHERE user_id = $1', [userId]);
};

const listUsers = async (limit = 100) => {
  const res = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT $1', [limit]);
  return res.rows;
};

module.exports = { createUser, getUserByEmail, getUserById, updateLastLogin, listUsers };
