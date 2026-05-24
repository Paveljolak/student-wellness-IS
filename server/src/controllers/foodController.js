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

async function createFood(req, res) {
  const {
    name, name_sl, category,
    calories_per_100g, protein_per_100g, carbs_per_100g,
    fat_per_100g, fiber_per_100g, sugar_per_100g,
  } = req.body;

  if (!name || !name_sl || calories_per_100g == null) {
    return res.status(400).json({ message: 'name, name_sl and calories_per_100g are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO foods
         (name, name_sl, category, calories_per_100g, protein_per_100g,
          carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g,
          is_custom, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)`,
      [
        name, name_sl, category || 'Custom',
        calories_per_100g,
        protein_per_100g || 0, carbs_per_100g || 0, fat_per_100g || 0,
        fiber_per_100g   || 0, sugar_per_100g  || 0,
        req.user.id,
      ]
    );
    const [food] = await pool.query('SELECT * FROM foods WHERE id = ?', [result.insertId]);
    res.status(201).json({ food: food[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { searchFoods, getFood, createFood };
