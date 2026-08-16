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
    responsible: [{type: String}], } ], 
  fields: [{type: String}], 
  comments: [{type: String}],
  thumbnail: { type: Buffer},
  institute: {type: String}
});

module.exports = mongoose.model('Group', groupSchema);
