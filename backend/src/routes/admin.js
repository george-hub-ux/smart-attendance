const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/dashboard', authMiddleware, roleMiddleware(['supervisor']), adminController.dashboard);
router.get('/audit-logs', authMiddleware, roleMiddleware(['supervisor']), adminController.auditLogs);
router.post('/send-summary', authMiddleware, roleMiddleware(['supervisor']), adminController.triggerSummary);

module.exports = router;
