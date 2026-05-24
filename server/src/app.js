require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

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

// Serve React build when deployed (client/dist must exist)
const distPath = path.join(__dirname, '../../client/dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
