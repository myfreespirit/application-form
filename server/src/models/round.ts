import * as mongoose from 'mongoose';


const RoundSchema = new mongoose.Schema({
  id: {
    type: Number
  },
  round: {
    type: Number
  },
  end: {
    type: Date
  },
  endBlock: {
    type: Number
  }
});


export const Round = mongoose.model('Round', RoundSchema);
