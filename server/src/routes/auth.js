const router = require('express').Router();
const { register, login, me, registerValidation } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login',    login);
router.get('/me',        auth, me);

module.exports = router;
