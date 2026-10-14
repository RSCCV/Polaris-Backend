const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({ 
  name: { type: String, required: true, unique: true }, 
  members: [{ type: String }], 
  admins: [{type: String}], 
  requirements: [ { title: { type: String }, 
    cost: { type: Number }, 
    effort: { type: Number }, 
    impact: { type: Number }, 
    status: { type: String }, 
    responsible: [{type: String}],
    timerConsumed: { type: Boolean, default: false }, } ], 
  fields: [{type: String}], 
  comments: [{type: String}],
  thumbnail: { type: Buffer},
  institute: {type: String},
  timer: {
    intervalValue: { type: Number, default: null },
    status: { type: String, enum: ['off', 'running', 'paused'], default: 'off' },
    lastTickAt: { type: Date, default: null },
    nextTickAt: { type: Date, default: null },
    remainingMs: { type: Number, default: null }
  }
});

module.exports = mongoose.model('Group', groupSchema);
