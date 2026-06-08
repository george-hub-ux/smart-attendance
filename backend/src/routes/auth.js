const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', [body('email').isEmail(), body('password').isLength({ min: 6 })], authController.login);
router.post('/signup', [body('email').isEmail(), body('password').isLength({ min: 6 })], authController.signup);
router.post('/logout', authMiddleware, authController.logout);
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
