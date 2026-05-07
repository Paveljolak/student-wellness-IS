const router = require('express').Router();
const { searchFoods, getFood } = require('../controllers/foodController');
const auth = require('../middleware/auth');

router.get('/',    auth, searchFoods);
router.get('/:id', auth, getFood);

module.exports = router;
