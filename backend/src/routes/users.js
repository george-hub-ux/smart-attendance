const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.post('/', authMiddleware, roleMiddleware(['supervisor']), userController.createUser);
router.get('/', authMiddleware, roleMiddleware(['supervisor']), userController.listUsers);

module.exports = router;
