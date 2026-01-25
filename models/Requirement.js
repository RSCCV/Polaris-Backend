const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
    description: { type: String },
    explanation: { type: String },
    fields: [{type: String}], 
    tips: { type: String },
    cost: { type: Number }, 
    effort: { type: Number }, 
    impact: { type: Number }, 
    category: { type: String },
    title: { type: String }
});

module.exports = mongoose.model('Requirement', requirementSchema, 'requirements');
