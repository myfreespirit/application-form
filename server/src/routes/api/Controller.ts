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
		Testnet.aggregate(
			[
				{
					$lookup: {
							from: 'balances',
							localField: 'wallet',
							foreignField: 'wallet',
							as: 'tokens'
						 }
				},
				{
					$project: {
							wallet: 1,
							telegram: 1,
							username: 1,
							hash: 1,
							motivation: 1,
							states: 1,
							EXRN: "$tokens.EXRN",
							EXRT: "$tokens.EXRT"
						  }
				}
			],
			(err, document) => {
				if (err) return next(err);
				res.json(document);
			}
		);

	});


  	// update registration
	this.router.put('/testnet/update/', (req, res, next) => {
		let obj = {
			status: req.body['status'],
			telegram: req.body['telegram']
		};

		Testnet.findOneAndUpdate({ wallet: req.body['wallet'] },
					{ $push: { states: obj } },
					{ upsert: true, new: true },
					(err, document) => {
						if (err) return next(err);
						res.json(document);
		});
	});


	return this.router;
  }
}

export default new Controller();
