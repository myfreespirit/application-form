import * as express from 'express';
import { Balance } from '../../models/balance';


class Controller {

  private router: any;

  constructor() {
    this.router = express.Router();
  }


  public routes() {
	// update balances state 
	this.router.put('/update/:token', (req, res, next) => {
		let token = req.params['token'];

		if (req.body['result'] === null) {
			res.json("BAD api call");
			return;
		}

		let bulk = Balance.collection.initializeOrderedBulkOp();

		req.body['result'].forEach(element => {
			if (token === 'EXRN') {
				bulk.find( { wallet: element.wallet } )
					.upsert()
					.update(
						{
							$inc: { EXRN: element.value, EXRT: 0 }
						}
					);
			} else if (token === 'EXRT') {
				bulk.find( { wallet: element.wallet } )
					.upsert()
					.update(
						{
							$inc: { EXRN: 0, EXRT: element.value }
						}
					);
			}
		});

		bulk.execute(err => {
			if (err) return next(err);
			res.json("OK balances bulk");
		});
	});
    
    // retrieve total EXRT balance
	this.router.get('/total/exrt/:wallet', (req, res, next) => {
        Balance.find({ wallet: req.params['wallet'] }, { EXRT: 1 }, (err, document) => {
            if (err) return next(err);
            res.json(document);
        });
	});


	return this.router;
  }
}

export default new Controller();
