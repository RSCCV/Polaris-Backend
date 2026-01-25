const dotenv = require('dotenv').config();
const bcrypt = require('bcryptjs');
const express = require('express');
// const {connectDB} = require('../backend/config/db.js');
//import { db } from '../backend/config/db.js';
// const db = require('../backend/config/db'); 
const authRoutes = require('./routes/auth');
const loaderRoutes = require('./routes/loader');
const uploadRoutes = require('./routes/upload');
const cors = require('cors');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Environment variables:', process.env ? 'Loaded ✅' : 'Missing ❌');


// CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://kim278.wwwdns.kim.uni-konstanz.de',
      'http://localhost:4200'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

const app = express();
// Mounts
app.use(express.json());
app.use(cors(corsOptions));
app.use('/api/auth', authRoutes);
app.use('/api/loader', loaderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload', express.static('uploads'));

// DB
// async function connect() {
//   try {
    
    
//   } catch (error) {
//     console.error('Failed to connect to database:', error);
//     process.exit(1);
//   }
// }





// connect();

// Posts
// app.post('/api/users', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     //Debug console.log(password);

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({ username, password: hashedPassword });
//     await newUser.save();

//     res.status(201).json({ message: 'User created successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
const PORT = process.env.PORT || 5000;

// Listens
try {
  // connectDB();
  app.listen(PORT, () => console.log('Server running on port ${PORT}'));
  app.listen(PORT, () => {
    console.log('✅ Backend running at http://localhost:${PORT}');
  });
} catch (err) {
  console.error('❌ Failed to connect to DB:', err);
}

