import * as mongoose from 'mongoose';


const StateEntry = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  telegram: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: true,
    default: "APPLIED"
  }
});


const TestnetSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    match: /^0x[0-9a-f]{40}$/
  },
  telegram: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  hash: {
    type: String,
    required: true
  },
  motivation: {
    type: String,
    required: false
  },
  states: {
    type: [ StateEntry ],
    required: true
  }
});


export const Testnet = mongoose.model('Testnet', TestnetSchema);
