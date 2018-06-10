import * as mongoose from 'mongoose';


const EtherSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  from: {
    type: String,
    required: true,
    lowercase: true
  },
  to: {
    type: String,
    required: true,
    lowercase: true
  },
  value: {
    type: Number,
    required: true
  }
});


export const Ether = mongoose.model('Ether', EtherSchema);
