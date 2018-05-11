const mongoose = require('mongoose');
const Contribution = require('../models/contribution.js');

const DistributionSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  distributions: {
    type: [Contribution.schema]
  }
});

module.exports = mongoose.model('Distribution', DistributionSchema);
