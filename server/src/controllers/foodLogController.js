const pool = require('../config/database');

function round1(n) { return Math.round(n * 10) / 10; }

async function addLog(req, res) {
  const { food_id, meal_type, grams, date } = req.body;

  if (!food_id || !meal_type || !grams || !date) {
    return res.status(400).json({ message: 'food_id, meal_type, grams and date are required' });
  }

  try {
    const [food] = await pool.query('SELECT * FROM foods WHERE id = ?', [food_id]);
    if (food.length === 0) return res.status(404).json({ message: 'Food not found' });

    const f = food[0];
    const ratio = grams / 100;

    const calories  = round1(f.calories_per_100g  * ratio);
    const protein_g = round1(f.protein_per_100g   * ratio);
    const carbs_g   = round1(f.carbs_per_100g     * ratio);
    const fat_g     = round1(f.fat_per_100g       * ratio);
    const fiber_g   = round1(f.fiber_per_100g     * ratio);
    const sugar_g   = round1(f.sugar_per_100g     * ratio);

    const [result] = await pool.query(
      `INSERT INTO food_logs
         (user_id, food_id, meal_type, grams, date, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, food_id, meal_type, grams, date, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g]
    );

    const [log] = await pool.query(
      `SELECT fl.*, f.name, f.name_sl, f.category
       FROM food_logs fl
       JOIN foods f ON fl.food_id = f.id
       WHERE fl.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ log: log[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function getLogs(req, res) {
  const date = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const [logs] = await pool.query(
      `SELECT fl.*, f.name, f.name_sl, f.category
       FROM food_logs fl
       JOIN foods f ON fl.food_id = f.id
       WHERE fl.user_id = ? AND fl.date = ?
       ORDER BY fl.created_at ASC`,
      [req.user.id, date]
    );
    res.json({ logs, date });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

async function deleteLog(req, res) {
  try {
    const [result] = await pool.query(
      'DELETE FROM food_logs WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Log entry not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { addLog, getLogs, deleteLog };
