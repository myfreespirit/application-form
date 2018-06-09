import * as mongoose from 'mongoose';


const SignupEntry = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  totalEXRN: {
    type: Number,
    default: 0,
    min: 0,
    max: 100000000000
  },
  teamEXRN: {
    type: Number,
    default: 0,
    min: 0,
    max: 100000000000
  }
});


const SignupSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[0-9a-z]{40}$/
  },
  signups: {
    type: [ SignupEntry ]
  }
});


export const Signup = mongoose.model('Signup', SignupSchema);
