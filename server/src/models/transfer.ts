import * as mongoose from 'mongoose';


const TransferSchema = new mongoose.Schema({
  blockNumber: {
    type: Number
  },
  timeStamp: {
    type: Number
  },
  from: {
    type: String
  },
  to: {
    type: String
  },
  value: {
    type: Number
  }
});


export const Transfer = mongoose.model('Transfer', TransferSchema);
