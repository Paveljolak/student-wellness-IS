const router = require('express').Router();
const { searchFoods, getFood, createFood } = require('../controllers/foodController');
const auth = require('../middleware/auth');

router.get('/',    auth, searchFoods);
router.post('/',   auth, createFood);
router.get('/:id', auth, getFood);

module.exports = router;
