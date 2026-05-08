const pool = require('../config/database');

async function searchFoods(req, res) {
  const q = req.query.q || '';
  try {
    const [foods] = await pool.query(
      `SELECT * FROM foods
       WHERE name LIKE ? OR name_sl LIKE ?
       ORDER BY name_sl
       LIMIT 50`,
      [`%${q}%`, `%${q}%`]
    );
    res.json({ foods });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getFood(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM foods WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Food not found' });
    res.json({ food: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { searchFoods, getFood };
