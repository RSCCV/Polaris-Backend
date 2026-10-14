const mongoose = require('mongoose');

const instututeSchema = new mongoose.Schema({ 
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Institute', instututeSchema);
