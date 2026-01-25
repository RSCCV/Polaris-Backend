const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const db = require('../config/db');
const User = require('../models/User')
const Requirement = require('../models/Requirement')

const SECRET = process.env.JWT_SECRET; 


// get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({err: err.message, error: 'Could not fetch users' });
  }
});

// get all groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({err: err.message, error: 'Could not fetch groups' });
  }
});

// get all requirements
router.get('/getAllReq', async (req, res) => {
  try {
    const requirements = await Requirement.find();
    res.json(requirements);
  } catch (err) {
    res.status(500).json({err: err.message, error: 'Could not fetch requirements' });
  }
});

// get single group
router.post('/getGroup', async (req, res) => {
  try {
    const { groupname } = req.body;
    const group = await Group.findOne({ name: groupname });
    res.json(group);
  } catch (err) {
    res.status(500).json({err: err.message, error: 'Could not fetch group' });
  }
});

// get all requirements from List
router.post('/getReqByList', async (req, res) => {
  try {
    const requirements = await Requirement.find();
    const { reqList } = req.body
    const filteredRequirements = requirements.filter((req) => reqList.indexOf(req.title) > -1) //contained in reqList
    res.json(filteredRequirements);
  } catch (err) {
    res.status(500).json({err: err.message, error: 'Could not fetch rqeuirements' });
  }
});

module.exports = router;