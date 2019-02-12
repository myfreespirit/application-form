import * as mongoose from 'mongoose';


const BalanceSchema = new mongoose.Schema({
  wallet: {
	type: String
  },
  EXRN: {
	type: Number,
  	default: 0
  },
  EXRT: {
	type: Number,
  	default: 0
  }

});


BalanceSchema.index({ wallet: 1 });


export const Balance = mongoose.model('Balance', BalanceSchema);
