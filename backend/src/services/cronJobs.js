const cron = require('node-cron');
const db = require('../config/db');
const emailService = require('./emailService');

async function buildDailySummary(date) {
  const day = date || new Date().toISOString().slice(0,10);
  const total = Number((await db.query('SELECT COUNT(*) FROM attendance WHERE attendance_date = $1', [day])).rows[0].count || 0);
  const present = Number((await db.query("SELECT COUNT(*) FROM attendance WHERE attendance_date = $1 AND status IN ('Present','On Time','Late')", [day])).rows[0].count || 0);
  const late = Number((await db.query("SELECT COUNT(*) FROM attendance WHERE attendance_date = $1 AND status = 'Late'", [day])).rows[0].count || 0);
  const rows = (await db.query('SELECT * FROM attendance WHERE attendance_date = $1 ORDER BY check_in_time', [day])).rows;
  const absent = Math.max(0, total - present);
  return { date: day, total, present, late, absent, rows };
}

async function getSupervisorsEmails(){
  const res = await db.query("SELECT u.email FROM users u WHERE u.role = 'supervisor' AND u.is_active = true");
  return res.rows.map(r=>r.email).filter(Boolean);
}

async function sendDailySummary(date) {
  const summary = await buildDailySummary(date);
  const emails = await getSupervisorsEmails();
  for (const to of emails) {
    try {
      await emailService.sendSummaryEmail({ to, date: summary.date, total: summary.total, present: summary.present, absent: summary.absent, late: summary.late, rows: summary.rows });
    } catch (e) {
      console.error('Failed to send summary to', to, e);
    }
  }
  return { sentTo: emails.length, date: summary.date };
}

function scheduleDailySummary(){
  const cronTime = process.env.SUMMARY_CRON || '0 20 * * *'; // default 20:00
  cron.schedule(cronTime, async ()=>{
    try{
      console.log('Running scheduled daily summary');
      await sendDailySummary();
    }catch(e){ console.error('Scheduled summary failed', e); }
  }, { scheduled: true, timezone: process.env.TIMEZONE || 'UTC' });
}

module.exports = { scheduleDailySummary, sendDailySummary };
