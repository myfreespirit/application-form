const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  from: {
    type: String,
    required: true,
    lowercase: true
  },
  date: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Contribution', ContributionSchema);
