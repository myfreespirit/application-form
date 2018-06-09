import * as mongoose from 'mongoose';
import { Contribution } from '../models/contribution';


const DistributionSchema = new mongoose.Schema({
  wallet: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  distributions: {
    type: [Contribution.schema]
  }
});


export const Distribution = mongoose.model('Distribution', DistributionSchema);
