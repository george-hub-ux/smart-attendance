const db = require('../config/db');

const getMemberByEmail = async (email) => {
  const res = await db.query('SELECT * FROM members WHERE email = $1', [email]);
  return res.rows[0];
};

const getMemberById = async (memberId) => {
  const res = await db.query('SELECT * FROM members WHERE member_id = $1', [memberId]);
  return res.rows[0];
};

const createMember = async (member) => {
  const { full_name, email, phone_number, institution, department, role, membership_status } = member;
  const res = await db.query(
    `INSERT INTO members (full_name, email, phone_number, institution, department, role, membership_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [full_name, email, phone_number, institution, department, role || 'attachee', membership_status || 'pending']
  );
  return res.rows[0];
};

const listMembers = async (limit = 100) => {
  const res = await db.query('SELECT * FROM members ORDER BY registration_date DESC LIMIT $1', [limit]);
  return res.rows;
};

const updateMember = async (memberId, fields) => {
  const keys = Object.keys(fields);
  const set = keys.map((k, i) => `${k} = $${i+2}`).join(', ');
  const values = [memberId, ...keys.map(k => fields[k])];
  const res = await db.query(`UPDATE members SET ${set} WHERE member_id = $1 RETURNING *`, values);
  return res.rows[0];
};

const deleteMember = async (memberId) => {
  await db.query('DELETE FROM members WHERE member_id = $1', [memberId]);
  return true;
};

module.exports = { getMemberByEmail, getMemberById, createMember, listMembers, updateMember, deleteMember };

