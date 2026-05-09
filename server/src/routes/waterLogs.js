const router = require('express').Router();
const { addWaterLog, getWaterLogs, deleteWaterLog } = require('../controllers/waterLogController');
const auth = require('../middleware/auth');

router.post('/',      auth, addWaterLog);
router.get('/',       auth, getWaterLogs);
router.delete('/:id', auth, deleteWaterLog);

module.exports = router;
