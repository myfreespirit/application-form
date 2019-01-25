import * as express from 'express';
import { Testnet } from '../../models/testnet';
import { exec } from 'child_process';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }

  public routes() {
	// retrieve testnet registrations
	this.router.post('/hash/', (req, res, next) => {
		exec('openssl passwd -apr1 -salt ' + req.body['salt'] + ' ' + req.body['pass'], (err, out) => {
			if (err) {
				console.error(err)
				next(err);
			} else {
				//console.log(out)
				res.json(out);
			}
		})
	});


	return this.router;
  }
}

export default new Controller();
