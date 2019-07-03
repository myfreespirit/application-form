import * as mongoose from 'mongoose';


const PriceSchema = new mongoose.Schema({
    base: String,
    price_usd: Number
});


export const Price = mongoose.model('Price', PriceSchema);
