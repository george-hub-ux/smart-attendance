const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendAttendanceEmail = async ({ to, name, date, time, status, locationConfirmed }) => {
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: 'Attendance Successfully Recorded',
    text: `Name: ${name}\nDate: ${date}\nTime: ${time}\nStatus: ${status}\nLocation Confirmed: ${locationConfirmed}`
  });
  return info;
};

const sendSummaryEmail = async ({ to, date, total, present, absent, late, rows }) => {
  const bodyLines = [];
  bodyLines.push(`Swahilipot Hub Foundation - Attendance Summary for ${date}`);
  bodyLines.push('');
  bodyLines.push(`Total records: ${total}`);
  bodyLines.push(`Present: ${present}`);
  bodyLines.push(`Late: ${late}`);
  bodyLines.push(`Absent: ${absent}`);
  bodyLines.push('');
  bodyLines.push('Details:');
  rows.slice(0,50).forEach(r => {
    bodyLines.push(`${r.attendance_date} ${new Date(r.check_in_time).toLocaleTimeString()} - ${r.full_name} - ${r.status} - ${r.location_verified ? 'Location OK' : 'Location NOT OK'}`);
  });
  if (rows.length > 50) bodyLines.push(`...and ${rows.length - 50} more records`);

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `Attendance Summary - ${date}`,
    text: bodyLines.join('\n')
  });
  return info;
};

module.exports = { sendAttendanceEmail, sendSummaryEmail };
