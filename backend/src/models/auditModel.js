const db = require('../config/db');

const createAudit = async (entry) => {
  const { user_name, email, ip_address, location, access_status, reason } = entry;
  const res = await db.query(
    `INSERT INTO audit_logs (user_name, email, ip_address, location, access_status, reason)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [user_name, email, ip_address, location, access_status, reason]
  );
  return res.rows[0];
};

const getAuditLogs = async (limit = 200) => {
  const res = await db.query('SELECT * FROM audit_logs ORDER BY access_time DESC LIMIT $1', [limit]);
  return res.rows;
};

module.exports = { createAudit, getAuditLogs };
