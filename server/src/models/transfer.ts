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

const TransferEXRN = mongoose.model('TransferEXRN', TransferSchema);
const TransferEXRT = mongoose.model('TransferEXRT', TransferSchema);


module.exports = {
	TransferEXRN: TransferEXRN,
	TransferEXRT: TransferEXRT
};
