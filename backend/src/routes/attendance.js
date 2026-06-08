const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/geofence', attendanceController.geofenceInfo);
router.post('/checkin', authMiddleware, attendanceController.checkin);
router.post('/checkin/public', attendanceController.publicCheckin);
router.get('/history/:userId?', authMiddleware, attendanceController.history);

module.exports = router;
