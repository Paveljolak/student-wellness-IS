const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const pool = require('../config/database')
const { calculateTargets } = require('../utils/calculations')

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('gender').isIn(['male', 'female']),
  body('age').isInt({ min: 10, max: 120 }),
  body('weight_kg').isFloat({ min: 20, max: 500 }),
  body('height_cm').isFloat({ min: 50, max: 300 }),
  body('activity_level').isIn([
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extra_active',
  ]),
  body('goal').isIn(['fat_loss', 'maintenance', 'bulking']),
]

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const {
    email,
    password,
    name,
    gender,
    age,
    weight_kg,
    height_cm,
    activity_level,
    goal,
  } = req.body

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email],
    )
    if (existing.length > 0)
      return res.status(409).json({ message: 'Email already in use' })

    const password_hash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, name, gender, age, weight_kg, height_cm, activity_level, goal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        password_hash,
        name,
        gender,
        age,
        weight_kg,
        height_cm,
        activity_level,
        goal,
      ],
    )

    const user = {
      id: result.insertId,
      email,
      name,
      gender,
      age: Number(age),
      weight_kg: Number(weight_kg),
      height_cm: Number(height_cm),
      activity_level,
      goal,
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    res
      .status(201)
      .json({ token, user: { ...user, targets: calculateTargets(user) } })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' })

  try {
    console.log(
      `Login attempt: email=${email}, password=${'*'.repeat(password.length)}`,
    )
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
      email,
    ])
    console.log(2, `Database query result: ${rows.length} user(s) found`)
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid credentials' })

    const user = rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })
    const { password_hash, ...safeUser } = user

    res.json({
      token,
      user: { ...safeUser, targets: calculateTargets(safeUser) },
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

async function me(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      req.user.id,
    ])
    if (rows.length === 0)
      return res.status(404).json({ message: 'User not found' })

    const { password_hash, ...user } = rows[0]
    res.json({ user: { ...user, targets: calculateTargets(user) } })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

module.exports = { register, login, me, registerValidation }
