const db = require('../config/db');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

async function dailyReport(req, res) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0,10);
    const total = (await db.query('SELECT COUNT(*) FROM attendance WHERE attendance_date = $1', [date])).rows[0].count;
    const present = (await db.query("SELECT COUNT(*) FROM attendance WHERE attendance_date = $1 AND status IN ('Present','On Time','Late')", [date])).rows[0].count;
    const late = (await db.query("SELECT COUNT(*) FROM attendance WHERE attendance_date = $1 AND status = 'Late'", [date])).rows[0].count;
    const absent = Math.max(0, total - present);

    const rows = (await db.query('SELECT * FROM attendance WHERE attendance_date = $1 ORDER BY check_in_time', [date])).rows;

    const payload = { date, total: Number(total), present: Number(present), late: Number(late), absent: Number(absent), rows };

    const format = req.query.format || 'json';
    if (format === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment(`daily-report-${date}.csv`);
      return res.send(csv);
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Daily Report');
      sheet.addRow(['Date', date]);
      sheet.addRow([]);
      sheet.addRow(['Total', 'Present', 'Late', 'Absent']);
      sheet.addRow([payload.total, payload.present, payload.late, payload.absent]);
      sheet.addRow([]);
      sheet.addRow(['ID','User','Date','Time','Status','Latitude','Longitude','LocationVerified']);
      rows.forEach(r=> sheet.addRow([r.id, r.full_name, r.attendance_date, r.check_in_time, r.status, r.latitude, r.longitude, r.location_verified]));

      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.attachment(`daily-report-${date}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.header('Content-Type', 'application/pdf');
      res.attachment(`daily-report-${date}.pdf`);
      doc.text(`Daily Report - ${date}`, { align: 'center' });
      doc.moveDown();
      doc.text(`Total: ${payload.total}  Present: ${payload.present}  Late: ${payload.late}  Absent: ${payload.absent}`);
      doc.moveDown();
      rows.forEach(r=> {
        doc.text(`${r.attendance_date} ${new Date(r.check_in_time).toLocaleTimeString()} - ${r.full_name} - ${r.status} - ${r.location_verified ? 'Location OK' : 'Location NOT OK'}`);
      });
      doc.pipe(res);
      doc.end();
      return;
    }

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function weeklyReport(req, res) {
  try {
    const start = req.query.start; // YYYY-MM-DD
    if (!start) return res.status(400).json({ message: 'start query param required' });
    const rows = (await db.query('SELECT * FROM attendance WHERE attendance_date >= $1 AND attendance_date < $2 ORDER BY attendance_date', [start, req.query.end || start])).rows;
    res.json({ start, count: rows.length, rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

async function monthlyReport(req, res) {
  try {
    const month = req.query.month; // YYYY-MM
    if (!month) return res.status(400).json({ message: 'month query param required' });
    const from = `${month}-01`;
    const to = new Date(new Date(from).getFullYear(), new Date(from).getMonth()+1, 1).toISOString().slice(0,10);
    const rows = (await db.query('SELECT * FROM attendance WHERE attendance_date >= $1 AND attendance_date < $2 ORDER BY attendance_date', [from, to])).rows;
    res.json({ month, count: rows.length, rows });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
}

module.exports = { dailyReport, weeklyReport, monthlyReport };
