import * as express from 'express';
import { Price } from '../../models/price';


class Controller {

  private router: any;


  constructor() {
    this.router = express.Router();
  }


  public routes() {
      
	// retrieve all prices
	this.router.get('/all', (req, res, next) => {
		Price.find({}, { base: 1, price_usd: 1 })
			.then(result => res.json(result))
			.catch(err => next(err));
	});
    

	// update price of a ticker
	this.router.put('/save', (req, res, next) => {
		Price.updateOne({ base: req.body['base']},
                        { $set: { base: req.body['base'], price_usd: req.body['price']} },
                        { upsert: true })
            .then(result => res.json(result))
            .catch(err => next(err));
	});


	return this.router;
  }
}

export default new Controller();
