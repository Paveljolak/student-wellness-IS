const router = require('express').Router();
const { updateProfile } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.put('/profile', auth, updateProfile);

module.exports = router;
