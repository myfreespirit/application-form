import * as express from 'express';
import { Testnet } from '../../models/testnet';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
  	// retrieve all testnet registrations
	this.router.get('/testnet/all/', (req, res, next) => {
		Testnet.find({}, (err, document) => {
			if (err) return next(err);
			res.json(document);
		});
	});


	return this.router;
  }
}

export default new Controller();
