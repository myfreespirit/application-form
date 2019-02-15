import * as mongoose from 'mongoose';


const ExrnSchema = new mongoose.Schema({
});


const TestnetSchema = new mongoose.Schema({
  docLink: {
    type: String
  }
});


const ExrtSchema = new mongoose.Schema({
  testnet: {
    type: [ TestnetSchema ]
  }
});


const AdministrationSchema = new mongoose.Schema({
  exrn: {
    type: [ ExrnSchema ]
  },
  exrt: {
    type: [ ExrtSchema ]
  }
});


export const Administration = mongoose.model('Administration', AdministrationSchema);
