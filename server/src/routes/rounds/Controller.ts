import * as express from 'express';
import { Round } from '../../models/round';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve all round details
	this.router.get('/', (req, res, next) => {
	  Round.find({ }, (err, document) => {
	    if (err) return next(err);
	    res.json(document);
	  }).sort({ round: 1});
	});


	return this.router;
  }
}

export default new Controller();
