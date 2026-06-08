const memberModel = require('../models/memberModel');
const auditModel = require('../models/auditModel');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const verifyMember = async (req, res) => {
  const { full_name, email, phone_number, token } = req.body;
  try {
    // If token provided, validate it first
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.purpose !== 'verify') return res.status(403).json({ message: 'Invalid token purpose' });
      } catch (e) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
    }

    const member = await memberModel.getMemberByEmail(email);
    if (!member) return res.status(403).json({ message: 'Access Denied. You are not registered as an authorized Swahilipot Hub Foundation member. Please contact the administrator.' });

    if (member.email !== email || member.membership_status !== 'active') {
      return res.status(403).json({ message: 'Access Denied. You are not registered as an authorized Swahilipot Hub Foundation member. Please contact the administrator.' });
    }

    res.json({ access: 'granted', member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createMember = async (req, res) => {
  try {
    const member = await memberModel.createMember(req.body);
    await auditModel.createAudit({ user_name: req.user.email, email: req.user.email, ip_address: req.ip, location: null, access_status: 'member_created', reason: `Member ${member.email} created` });
    res.status(201).json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listMembers = async (req, res) => {
  try {
    const rows = await memberModel.listMembers();
    res.json({ members: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    const updated = await memberModel.updateMember(memberId, req.body);
    res.json({ member: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    await memberModel.deleteMember(memberId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { verifyMember, createMember, listMembers, updateMember, deleteMember };

const generateQRCode = async (req, res) => {
  try {
    const url = req.query.url || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-member`;
    const dataUrl = await QRCode.toDataURL(url);
    res.json({ qrcode: dataUrl, url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate QR' });
  }
};

module.exports.generateQRCode = generateQRCode;

const generateTokenQRCode = async (req, res) => {
  try {
    const expires = parseInt(req.query.expires || '600', 10); // seconds
    const payload = { purpose: 'verify' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expires });
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const url = `${frontend}/verify-member?token=${encodeURIComponent(token)}`;
    const dataUrl = await QRCode.toDataURL(url);
    // record audit log (who generated the token)
    try {
      const actor = (req.user && req.user.email) || 'system';
      await auditModel.createAudit({ user_name: actor, email: (req.user && req.user.email) || null, ip_address: req.ip, location: null, access_status: 'qrcode_generated', reason: `Generated token QR (expires=${expires}s)` });
    } catch (e) {
      console.error('Failed to write audit for QR generation', e);
    }
    res.json({ qrcode: dataUrl, url, expires });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not generate token QR' });
  }
};

module.exports.generateTokenQRCode = generateTokenQRCode;

const bulkUpload = async (req, res) => {
  // Accepts JSON array of member objects or CSV text in `csv` field
  try {
    const items = req.body.members;
    const csv = req.body.csv;
    let toCreate = [];
    if (Array.isArray(items) && items.length) {
      toCreate = items;
    } else if (csv && typeof csv === 'string') {
      const lines = csv.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      if (lines.length < 2) return res.status(400).json({ message: 'CSV must include header and at least one row' });
      const headers = lines[0].split(',').map(h=>h.trim());
      for (let i=1;i<lines.length;i++) {
        const cols = lines[i].split(',').map(c=>c.trim());
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = cols[idx] || null });
        toCreate.push(obj);
      }
    } else {
      return res.status(400).json({ message: 'No members or csv provided' });
    }

    const created = [];
    for (const m of toCreate) {
      const member = await memberModel.createMember({
        full_name: m.full_name || m.name || m.fullName,
        email: m.email,
        phone_number: m.phone_number || m.phone,
        institution: m.institution,
        department: m.department,
        role: m.role || 'attachee',
        membership_status: m.membership_status || 'active'
      });
      created.push(member);
    }

    await auditModel.createAudit({ user_name: req.user.email, email: req.user.email, ip_address: req.ip, location: null, access_status: 'members_bulk_upload', reason: `Uploaded ${created.length} members` });

    res.status(201).json({ createdCount: created.length, created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports.bulkUpload = bulkUpload;
