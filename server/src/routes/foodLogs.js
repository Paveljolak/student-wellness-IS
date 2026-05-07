const router = require('express').Router();
const { addLog, getLogs, deleteLog } = require('../controllers/foodLogController');
const auth = require('../middleware/auth');

router.post('/',     auth, addLog);
router.get('/',      auth, getLogs);
router.delete('/:id', auth, deleteLog);

module.exports = router;
