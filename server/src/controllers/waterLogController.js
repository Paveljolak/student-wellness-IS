const pool = require('../config/database');

async function addWaterLog(req, res) {
  const { amount_ml, date } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  if (!amount_ml || amount_ml <= 0) {
    return res.status(400).json({ message: 'amount_ml must be a positive number' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO water_logs (user_id, amount_ml, date) VALUES (?, ?, ?)',
      [req.user.id, amount_ml, logDate]
    );
    const [log] = await pool.query('SELECT * FROM water_logs WHERE id = ?', [result.insertId]);
    res.status(201).json({ log: log[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getWaterLogs(req, res) {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const [logs] = await pool.query(
      'SELECT * FROM water_logs WHERE user_id = ? AND date = ? ORDER BY created_at ASC',
      [req.user.id, date]
    );
    const total_ml = logs.reduce((sum, l) => sum + l.amount_ml, 0);
    res.json({ logs, total_ml, date });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function deleteWaterLog(req, res) {
  try {
    const [result] = await pool.query(
      'DELETE FROM water_logs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Log entry not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { addWaterLog, getWaterLogs, deleteWaterLog };
