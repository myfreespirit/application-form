import * as mongoose from 'mongoose';


const ContributionSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true
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


export const Contribution = mongoose.model('Contribution', ContributionSchema);
