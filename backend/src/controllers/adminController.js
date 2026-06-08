const db = require('../config/db');
const auditModel = require('../models/auditModel');

const dashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    const totalToday = (await db.query('SELECT COUNT(*) FROM attendance WHERE attendance_date = $1', [today])).rows[0].count;
    const present = (await db.query("SELECT COUNT(*) FROM attendance WHERE attendance_date = $1 AND status = 'Present'", [today])).rows[0].count;
    const late = (await db.query("SELECT COUNT(*) FROM attendance WHERE attendance_date = $1 AND status = 'Late'", [today])).rows[0].count;
    const newRegs = (await db.query("SELECT COUNT(*) FROM members WHERE registration_date::date = $1", [today])).rows[0].count;

    res.json({ totalToday: Number(totalToday), present: Number(present), late: Number(late), newRegistrations: Number(newRegs) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const auditLogs = async (req, res) => {
  try {
    const rows = await auditModel.getAuditLogs();
    res.json({ logs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const { sendDailySummary } = require('../services/cronJobs');

const triggerSummary = async (req, res) => {
  try {
    const result = await sendDailySummary(req.query.date);
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { dashboard, auditLogs, triggerSummary };
