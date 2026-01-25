const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUsersCollection } = require('../models/User');

const SECRET = process.env.JWT_SECRET;

