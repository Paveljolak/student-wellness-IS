require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const foodRoutes      = require('./routes/foods');
const foodLogRoutes   = require('./routes/foodLogs');
const waterLogRoutes  = require('./routes/waterLogs');
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/foods',       foodRoutes);
app.use('/api/food-logs',   foodLogRoutes);
app.use('/api/water-logs',  waterLogRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
