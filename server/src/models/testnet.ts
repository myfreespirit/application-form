import * as mongoose from 'mongoose';


const TestnetSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^0x[0-9a-z]{40}$/
  }
});


export const Testnet = mongoose.model('Testnet', TestnetSchema);
