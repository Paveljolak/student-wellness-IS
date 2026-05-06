const pool = require('../config/database');
const { calculateTargets } = require('../utils/calculations');

async function updateProfile(req, res) {
  const { name, gender, age, weight_kg, height_cm, activity_level, goal } = req.body;

  if (!name || !gender || !age || !weight_kg || !height_cm || !activity_level || !goal) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await pool.query(
      `UPDATE users SET name=?, gender=?, age=?, weight_kg=?, height_cm=?, activity_level=?, goal=?
       WHERE id=?`,
      [name, gender, age, weight_kg, height_cm, activity_level, goal, req.user.id]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const { password_hash, ...user } = rows[0];
    res.json({ user: { ...user, targets: calculateTargets(user) } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { updateProfile };
