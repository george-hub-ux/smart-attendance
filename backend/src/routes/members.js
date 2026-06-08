const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/verify', memberController.verifyMember);
router.get('/qrcode', memberController.generateQRCode);
router.get('/qrcode/token', memberController.generateTokenQRCode);

// Supervisor-only member management
router.get('/', authMiddleware, roleMiddleware(['supervisor']), memberController.listMembers);
router.post('/', authMiddleware, roleMiddleware(['supervisor']), memberController.createMember);
router.post('/bulk', authMiddleware, roleMiddleware(['supervisor']), memberController.bulkUpload);
router.put('/:id', authMiddleware, roleMiddleware(['supervisor']), memberController.updateMember);
router.delete('/:id', authMiddleware, roleMiddleware(['supervisor']), memberController.deleteMember);

module.exports = router;
