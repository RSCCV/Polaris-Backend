const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
// const db = require('../config/db.js');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  const SECRET = process.env.JWT_SECRET; 

  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

router.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'You have access!', userId: req.user.userId });
});
router.post('/register', async (req, res) => {
  try {
    const { username, password, SelectedFields, isUserAdmin } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' ,username });
    }

    // Hash PW
    const hashedPassword = await bcrypt.hash(password, 10);

    //probably need more acesslevels later on anyway

    var userAcess = "user"
    const acess = isUserAdmin
    if (acess) {
      userAcess = "admin"
    }

    // Create and save User
    const newUser = User.create({
      username : username,
      password: hashedPassword,
      fields: SelectedFields,  //TODO might rename here
      accessLevel: userAcess
    });


    // Response
    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser._id, username: newUser.username }

    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const SECRET = process.env.JWT_SECRET; 
  try {
    const user = await User.findOne({ username });
    if (!user)
      return res.status(401).json({ message: 'Invalid username or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign({ user: user }, SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' ,
      Secret: SECRET
    });
  }
});


module.exports = router;