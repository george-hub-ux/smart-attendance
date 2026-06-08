const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/daily', authMiddleware, roleMiddleware(['supervisor']), reportController.dailyReport);
router.get('/weekly', authMiddleware, roleMiddleware(['supervisor']), reportController.weeklyReport);
router.get('/monthly', authMiddleware, roleMiddleware(['supervisor']), reportController.monthlyReport);

module.exports = router;
